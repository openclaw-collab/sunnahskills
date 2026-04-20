import { DEFAULT_CURRENCY } from "../../../shared/money";
import { issuePaymentReconcileToken } from "../../_utils/paymentReconcileToken";

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

type Body = { enrollmentOrderId?: number };

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const orderId = Number(body?.enrollmentOrderId ?? 0);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return json({ error: "enrollmentOrderId is required" }, { status: 400 });
  }
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const order = await env.DB.prepare(
    `SELECT
      o.id,
      o.guardian_account_id,
      o.guardian_id,
      o.status,
      o.total_cents,
      o.amount_due_today_cents,
      o.later_amount_cents,
      o.later_payment_date,
      o.trial_credit_cents,
      o.sibling_discount_cents,
      o.metadata_json,
      o.stripe_payment_intent_id,
      o.stripe_customer_id,
      g.email as guardian_email,
      g.full_name as guardian_name
     FROM enrollment_orders o
     LEFT JOIN guardians g ON g.id = o.guardian_id
     WHERE o.id = ?
     LIMIT 1`,
  )
    .bind(orderId)
    .first<{
      id: number;
      guardian_account_id: number | null;
      guardian_id: number | null;
      status: string;
      total_cents: number;
      amount_due_today_cents: number;
      later_amount_cents: number;
      later_payment_date: string | null;
      trial_credit_cents: number | null;
      sibling_discount_cents: number | null;
      metadata_json: string | null;
      stripe_payment_intent_id: string | null;
      stripe_customer_id: string | null;
      guardian_email: string | null;
      guardian_name: string | null;
    }>();

  if (!order) return json({ error: "Order not found" }, { status: 404 });
  if (order.status === "waitlisted") return json({ error: "This order is waitlisted." }, { status: 400 });
  if (order.status === "superseded") {
    return json({ error: "This checkout was replaced by a newer one." }, { status: 409 });
  }
  if (order.status === "abandoned") {
    return json({ error: "This checkout expired. Please start a fresh one." }, { status: 409 });
  }
  if (order.status !== "pending_payment") return json({ error: "This order is not awaiting payment." }, { status: 400 });

  const dueToday = Math.max(0, Math.round(Number(order.amount_due_today_cents ?? 0)));
  const dueLater = Math.max(0, Math.round(Number(order.later_amount_cents ?? 0)));
  const trialCreditCents = Math.max(0, Number(order.trial_credit_cents ?? 0));
  const siblingDiscountCents = Math.max(0, Number(order.sibling_discount_cents ?? 0));
  let promoDiscountCents = 0;
  let lineDiscountCodes: string[] = [];
  let prorationCode: string | null = null;
  try {
    const metadata = JSON.parse(order.metadata_json ?? "{}") as {
      promoDiscountCents?: number;
      lineDiscountCodes?: string[];
      prorationCode?: string | null;
    };
    promoDiscountCents = Math.max(0, Number(metadata.promoDiscountCents ?? 0));
    lineDiscountCodes = Array.isArray(metadata.lineDiscountCodes)
      ? metadata.lineDiscountCodes.map((code) => String(code).trim().toUpperCase()).filter(Boolean)
      : [];
    prorationCode = metadata.prorationCode ? String(metadata.prorationCode).trim().toUpperCase() : null;
  } catch {
    promoDiscountCents = 0;
    lineDiscountCodes = [];
    prorationCode = null;
  }
  if (dueToday <= 0) return json({ error: "Payment total must be greater than zero" }, { status: 400 });
  if (!order.guardian_email || !order.guardian_name) {
    return json({ error: "Order contact details are incomplete." }, { status: 400 });
  }
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Stripe not configured" }, { status: 500 });

  if (order.stripe_payment_intent_id) {
    const existingIntentRes = await fetch(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(order.stripe_payment_intent_id)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
      },
    );
    const existingIntentJson = (await existingIntentRes.json().catch(() => null)) as {
      id?: string;
      client_secret?: string;
      status?: string;
    } | null;
    if (
      existingIntentRes.ok &&
      existingIntentJson?.id &&
      existingIntentJson.client_secret &&
      existingIntentJson.status !== "succeeded" &&
      existingIntentJson.status !== "canceled"
    ) {
      return json({
        clientSecret: existingIntentJson.client_secret,
        paymentIntentId: existingIntentJson.id,
        reconcileToken: await issuePaymentReconcileToken(env, {
          enrollmentOrderId: orderId,
          paymentIntentId: existingIntentJson.id,
        }),
        enrollmentOrderId: orderId,
        dueTodayCents: dueToday,
        dueLaterCents: dueLater,
        laterPaymentDate: dueLater > 0 ? order.later_payment_date ?? null : null,
        trialCreditCents,
        siblingDiscountCents,
        promoDiscountCents,
      });
    }
    return json({ error: "Payment was already started for this order." }, { status: 400 });
  }

  const regRows = await env.DB.prepare(
    `SELECT id, program_id FROM registrations WHERE enrollment_order_id = ? ORDER BY id ASC`,
  )
    .bind(orderId)
    .all<{ id: number; program_id: string }>();
  const registrationIds = (regRows.results ?? []).map((row) => Number(row.id)).filter((value) => Number.isInteger(value));
  if (registrationIds.length === 0) return json({ error: "No registrations were found on this order." }, { status: 400 });
  const programIds = Array.from(
    new Set((regRows.results ?? []).map((row) => String(row.program_id ?? "").trim()).filter(Boolean)),
  );

  let customerId = order.stripe_customer_id?.trim() ?? "";
  if (!customerId) {
    if (order.guardian_account_id) {
      const priorOrder = await env.DB.prepare(
        `SELECT stripe_customer_id
         FROM enrollment_orders
         WHERE guardian_account_id = ?
           AND id != ?
           AND stripe_customer_id IS NOT NULL
           AND trim(stripe_customer_id) != ''
         ORDER BY id DESC
         LIMIT 1`,
      )
        .bind(order.guardian_account_id, orderId)
        .first<{ stripe_customer_id: string | null }>();
      customerId = priorOrder?.stripe_customer_id?.trim() ?? "";
    }
  }

  if (!customerId) {
    const customerParams = new URLSearchParams();
    customerParams.set("email", order.guardian_email.trim().toLowerCase());
    customerParams.set("name", order.guardian_name.trim());
    customerParams.set("metadata[enrollment_order_id]", String(orderId));

    const customerRes = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: customerParams,
    });
    const customerJson = (await customerRes.json().catch(() => null)) as { id?: string };
    if (!customerRes.ok || !customerJson?.id) {
      return json({ error: "Stripe error creating customer" }, { status: 502 });
    }
    customerId = customerJson.id;
  }
  await env.DB.prepare(`UPDATE enrollment_orders SET stripe_customer_id = ? WHERE id = ?`).bind(customerId, orderId).run();

  const intentParams = new URLSearchParams();
  intentParams.set("amount", String(dueToday));
  intentParams.set("currency", DEFAULT_CURRENCY);
  intentParams.set("customer", customerId);
  intentParams.set("automatic_payment_methods[enabled]", "true");
  intentParams.set("metadata[enrollment_order_id]", String(orderId));
  intentParams.set("metadata[registration_ids]", registrationIds.join(","));
  intentParams.set("metadata[pay_phase]", "first");
  intentParams.set("metadata[program_id]", programIds.length === 1 ? programIds[0] : "multi");
  if (dueLater > 0) {
    intentParams.set("setup_future_usage", "off_session");
  }

  const intentRes = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `order-${orderId}-first-${dueToday}`,
    },
    body: intentParams,
  });

  const intentJson = (await intentRes.json().catch(() => null)) as { id?: string; client_secret?: string };
  if (!intentRes.ok || !intentJson?.id || !intentJson?.client_secret) {
    return json({ error: "Stripe error creating PaymentIntent" }, { status: 502 });
  }

  const totalDiscountCents = trialCreditCents + siblingDiscountCents + promoDiscountCents;
  const grossSubtotalCents = Math.max(0, Number(order.total_cents ?? dueToday + dueLater) + totalDiscountCents);
  await env.DB.prepare(
    `UPDATE enrollment_orders
     SET stripe_payment_intent_id = ?,
         last_payment_attempt_at = datetime('now'),
         last_payment_error = NULL
     WHERE id = ?`,
  )
    .bind(intentJson.id, orderId)
    .run();

  await env.DB.prepare(
    `INSERT INTO payments (
      registration_id, enrollment_order_id, stripe_payment_intent_id, amount, subtotal,
      discount_amount, currency, status, payment_type, metadata, created_at, updated_at
    )
    SELECT ?, ?, ?, ?, ?, ?, ?, 'pending', 'order_deposit', ?, datetime('now'), datetime('now')
    WHERE NOT EXISTS (
      SELECT 1
      FROM payments
      WHERE enrollment_order_id = ?
        AND stripe_payment_intent_id = ?
    )`,
  )
    .bind(
      registrationIds[0],
      orderId,
      intentJson.id,
      dueToday,
      grossSubtotalCents,
      totalDiscountCents,
      DEFAULT_CURRENCY,
      JSON.stringify({
        enrollmentOrderId: orderId,
        registrationIds,
        dueLaterCents: dueLater,
        discountCodes: lineDiscountCodes,
        promoDiscountCents,
        prorationCode,
        payPhase: "first",
      }),
      orderId,
      intentJson.id,
    )
    .run();

  for (const registrationId of registrationIds) {
    await env.DB.prepare(`UPDATE registrations SET status = 'pending_payment', updated_at = datetime('now') WHERE id = ?`)
      .bind(registrationId)
      .run();
  }

  return json({
    clientSecret: intentJson.client_secret,
    paymentIntentId: intentJson.id,
    reconcileToken: await issuePaymentReconcileToken(env, {
      enrollmentOrderId: orderId,
      paymentIntentId: intentJson.id,
    }),
    enrollmentOrderId: orderId,
    dueTodayCents: dueToday,
    dueLaterCents: dueLater,
    laterPaymentDate: dueLater > 0 ? order.later_payment_date ?? null : null,
    trialCreditCents,
    siblingDiscountCents,
    promoDiscountCents,
  });
}
