import Stripe from "stripe";

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}

type CreateSubscriptionRequest = {
  registrationId: number;
  guardianEmail: string;
  guardianName: string;
  discountCode?: string;
  siblingCount?: number;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Graceful fallback: subscriptions not configured
    return json({ error: "subscriptions_not_configured" }, { status: 200 });
  }

  const body = (await request.json().catch(() => null)) as CreateSubscriptionRequest | null;
  if (!body?.registrationId) return json({ error: "registrationId is required" }, { status: 400 });

  // Fetch the registration and its price — price must have a Stripe Price ID in metadata
  const reg = await env.DB.prepare(
    `
    SELECT r.id, r.program_id, r.price_id,
           p.amount, p.registration_fee, p.metadata as price_metadata
    FROM registrations r
    LEFT JOIN program_prices p ON p.id = r.price_id
    WHERE r.id = ?
    `,
  )
    .bind(body.registrationId)
    .first();

  if (!reg) return json({ error: "Registration not found" }, { status: 404 });

  // Extract Stripe Price ID from metadata JSON
  let stripePriceId: string | null = null;
  try {
    const meta = JSON.parse(String(reg.price_metadata ?? "{}"));
    stripePriceId = meta.stripe_price_id ?? null;
  } catch {
    // ignore
  }

  if (!stripePriceId) {
    // No Stripe Price ID configured — graceful fallback to one-time payment
    return json({ error: "subscriptions_not_configured" }, { status: 200 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  // Create or retrieve customer by guardian email
  const existingCustomers = await stripe.customers.list({
    email: body.guardianEmail,
    limit: 1,
  });

  const customer =
    existingCustomers.data[0] ??
    (await stripe.customers.create({
      email: body.guardianEmail,
      name: body.guardianName,
      metadata: { registration_id: String(body.registrationId) },
    }));

  // Apply sibling discount coupon if needed
  const discounts: Stripe.SubscriptionCreateParams.Discount[] = [];
  const siblingCount = Number(body.siblingCount ?? 0);
  if (siblingCount > 0) {
    // Look for an existing sibling coupon or create it
    const SIBLING_DISCOUNT_PERCENT = 10;
    const couponId = `sibling-${SIBLING_DISCOUNT_PERCENT}pct`;
    try {
      await stripe.coupons.retrieve(couponId);
    } catch {
      await stripe.coupons.create({
        id: couponId,
        percent_off: SIBLING_DISCOUNT_PERCENT,
        duration: "forever",
        name: `Sibling Discount (${SIBLING_DISCOUNT_PERCENT}%)`,
      });
    }
    discounts.push({ coupon: couponId });
  }

  // Create subscription with default_incomplete — returns a clientSecret from the latest invoice
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: stripePriceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
    metadata: { registration_id: String(body.registrationId) },
    ...(discounts.length > 0 ? { discounts } : {}),
  });

  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
  const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;
  const clientSecret = paymentIntent?.client_secret ?? null;

  if (!clientSecret) {
    return json({ error: "Could not retrieve clientSecret from subscription" }, { status: 500 });
  }

  // Save the payment record
  await env.DB.prepare(
    `
    INSERT INTO payments (
      registration_id,
      stripe_payment_intent_id,
      stripe_subscription_id,
      amount,
      subtotal,
      discount_amount,
      currency,
      status,
      payment_type,
      metadata,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, 0, 'usd', 'pending', 'subscription', ?, datetime('now'), datetime('now'))
    `,
  )
    .bind(
      body.registrationId,
      paymentIntent?.id ?? null,
      subscription.id,
      paymentIntent?.amount ?? 0,
      paymentIntent?.amount ?? 0,
      JSON.stringify({
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        siblingCount,
      }),
    )
    .run();

  await env.DB.prepare(
    `UPDATE registrations SET status = 'pending_payment', updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(body.registrationId)
    .run();

  return json({ clientSecret, subscriptionId: subscription.id });
}
