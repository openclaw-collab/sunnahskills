import Stripe from "stripe";

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}

type CreateSubscriptionRequest = {
  registrationId: number;
  guardianEmail?: string;
  guardianName?: string;
  discountCode?: string;
  siblingCount?: number;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isValidStripePriceId(value: string) {
  return /^price_[A-Za-z0-9]+$/.test(value.trim());
}

async function ensureProgramPriceMetadataColumn(env: Env) {
  try {
    await env.DB.prepare(`ALTER TABLE program_prices ADD COLUMN metadata TEXT`).run();
  } catch {
    // Column already exists on migrated databases.
  }
}

async function ensureCoupon(stripe: Stripe, params: Stripe.CouponCreateParams) {
  const couponId = params.id;
  if (!couponId) return null;
  try {
    return await stripe.coupons.retrieve(couponId);
  } catch {
    try {
      return await stripe.coupons.create(params);
    } catch {
      return null;
    }
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  await ensureProgramPriceMetadataColumn(env);

  const body = (await request.json().catch(() => null)) as CreateSubscriptionRequest | null;
  if (!Number.isInteger(body?.registrationId) || Number(body.registrationId) <= 0) {
    return json({ error: "registrationId is required" }, { status: 400 });
  }

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    // Graceful fallback: subscriptions not configured
    return json({ error: "subscriptions_not_configured" }, { status: 200 });
  }

  const reg = await env.DB.prepare(
    `
    SELECT r.id,
           r.program_id,
           r.price_id,
           p.amount,
           p.registration_fee,
           p.metadata as price_metadata,
           g.full_name as guardian_name,
           g.email as guardian_email
    FROM registrations r
    JOIN guardians g ON g.id = r.guardian_id
    LEFT JOIN program_prices p ON p.id = r.price_id
    WHERE r.id = ?
    `,
  )
    .bind(body.registrationId)
    .first<{
      id: number;
      program_id: string;
      price_id: number | null;
      amount: number | null;
      registration_fee: number | null;
      price_metadata: string | null;
      guardian_name: string;
      guardian_email: string;
    }>();

  if (!reg) return json({ error: "Registration not found" }, { status: 404 });

  const guardianEmail = compactWhitespace((body.guardianEmail ?? reg.guardian_email) || "").toLowerCase();
  const guardianName = compactWhitespace(body.guardianName ?? reg.guardian_name);
  if (!guardianEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(guardianEmail)) {
    return json({ error: "guardianEmail is invalid" }, { status: 400 });
  }
  if (!guardianName) {
    return json({ error: "guardianName is required" }, { status: 400 });
  }

  // Fetch the Stripe Price ID from the stored metadata.
  let stripePriceId: string | null = null;
  try {
    const meta = JSON.parse(String(reg.price_metadata ?? "{}")) as Record<string, unknown>;
    const candidate = typeof meta.stripe_price_id === "string" ? meta.stripe_price_id.trim() : "";
    stripePriceId = isValidStripePriceId(candidate) ? candidate : null;
  } catch {
    stripePriceId = null;
  }

  if (!stripePriceId) {
    // No Stripe Price ID configured — graceful fallback to one-time payment
    return json({ error: "subscriptions_not_configured" }, { status: 200 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
  const siblingCount = Number(body.siblingCount ?? 0);
  if (!Number.isInteger(siblingCount) || siblingCount < 0 || siblingCount > 2) {
    return json({ error: "siblingCount must be between 0 and 2" }, { status: 400 });
  }

  // Create or retrieve customer by guardian email
  const existingCustomers = await stripe.customers.list({
    email: guardianEmail,
    limit: 1,
  });

  const customer =
    existingCustomers.data[0] ??
    (await stripe.customers.create({
      email: guardianEmail,
      name: guardianName,
      metadata: { registration_id: String(body.registrationId) },
    }));

  const discounts: Stripe.SubscriptionCreateParams.Discount[] = [];

  // Sibling discount coupon
  if (siblingCount > 0) {
    const siblingCouponId = "sibling-10pct";
    const siblingCoupon = await ensureCoupon(stripe, {
      id: siblingCouponId,
      percent_off: 10,
      duration: "forever",
      name: "Sibling Discount (10%)",
    });
    if (siblingCoupon) discounts.push({ coupon: siblingCouponId });
  }

  // Promo code coupon if configured in D1.
  if (body.discountCode) {
    const code = body.discountCode.trim().toUpperCase();
    const disc = await env.DB.prepare(
      `
      SELECT id, type, value, program_id, max_uses, current_uses, valid_from, valid_until, active
      FROM discounts
      WHERE code = ? AND active = 1
      LIMIT 1
      `,
    )
      .bind(code)
      .first<{
        id: number;
        type: "percentage" | "fixed" | "sibling";
        value: number;
        program_id: string | null;
        max_uses: number | null;
        current_uses: number | null;
        valid_from: string | null;
        valid_until: string | null;
        active: number;
      }>();

    if (disc && (!disc.program_id || disc.program_id === reg.program_id)) {
      const now = Date.now();
      const validFrom = disc.valid_from ? Date.parse(disc.valid_from) : null;
      const validUntil = disc.valid_until ? Date.parse(disc.valid_until) : null;
      const withinWindow = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
      const underMaxUses =
        disc.max_uses == null ||
        disc.current_uses == null ||
        Number(disc.current_uses) < Number(disc.max_uses);

      if (withinWindow && underMaxUses) {
        const couponId = `promo-${disc.id}`;
        const couponParams: Stripe.CouponCreateParams =
          disc.type === "fixed"
            ? {
                id: couponId,
                amount_off: Math.max(0, Math.round(Number(disc.value))),
                currency: "usd",
                duration: "once",
                name: `Promo ${code}`,
              }
            : {
                id: couponId,
                percent_off: Math.max(0, Math.min(100, Number(disc.value))),
                duration: "once",
                name: `Promo ${code}`,
              };
        const promoCoupon = await ensureCoupon(stripe, couponParams);
        if (promoCoupon) discounts.push({ coupon: couponId });
      }
    }
  }

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: stripePriceId }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
    metadata: {
      registration_id: String(body.registrationId),
      program_id: String(reg.program_id ?? ""),
    },
    ...(discounts.length > 0 ? { discounts } : {}),
  });

  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
  const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;
  const clientSecret = paymentIntent?.client_secret ?? null;

  if (!clientSecret) {
    return json({ error: "Could not retrieve clientSecret from subscription" }, { status: 500 });
  }

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
    ) VALUES (?, ?, ?, ?, ?, ?, 'usd', 'pending', 'subscription', ?, datetime('now'), datetime('now'))
    `,
  )
    .bind(
      body.registrationId,
      paymentIntent?.id ?? null,
      subscription.id,
      paymentIntent?.amount ?? 0,
      paymentIntent?.amount ?? 0,
      0,
      JSON.stringify({
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        siblingCount,
        discountCode: body.discountCode?.trim().toUpperCase() ?? null,
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
