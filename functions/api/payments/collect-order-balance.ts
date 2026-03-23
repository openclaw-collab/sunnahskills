/**
 * Secured endpoint for automated second payment (off-session) after the later-payment date.
 * Call from an external cron (e.g. daily) with Authorization: Bearer CRON_SECRET.
 */
interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  CRON_SECRET?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const secret = env.CRON_SECRET;
  const auth = request.headers.get("Authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Stripe not configured" }, { status: 500 });

  const due = await env.DB.prepare(
    `
    SELECT id, guardian_id, stripe_customer_id, later_amount_cents, metadata_json
    FROM enrollment_orders
    WHERE status = 'partially_paid'
      AND COALESCE(later_amount_cents, 0) > 0
      AND later_payment_date IS NOT NULL
      AND date(later_payment_date) <= date('now')
      AND second_stripe_payment_intent_id IS NULL
      AND stripe_customer_id IS NOT NULL
    ORDER BY id ASC
    LIMIT 25
    `,
  ).all();

  const rows =
    (due.results as {
      id: number;
      guardian_id: number | null;
      stripe_customer_id: string;
      later_amount_cents: number;
      metadata_json: string | null;
    }[]) ?? [];

  const results: { orderId: number; ok: boolean; detail?: string }[] = [];

  for (const order of rows) {
    let registrationIds: number[] = [];
    try {
      const meta = JSON.parse(String(order.metadata_json ?? "{}")) as { registrationIds?: number[] };
      if (Array.isArray(meta.registrationIds)) registrationIds = meta.registrationIds.filter((n) => Number.isInteger(n));
    } catch {
      registrationIds = [];
    }

    const firstReg =
      registrationIds[0] ??
      (
        await env.DB.prepare(`SELECT id FROM registrations WHERE enrollment_order_id = ? ORDER BY id ASC LIMIT 1`)
          .bind(order.id)
          .first<{ id: number }>()
      )?.id;

    if (!firstReg) {
      results.push({ orderId: order.id, ok: false, detail: "no_registration" });
      continue;
    }

    const amount = Math.max(0, Math.round(Number(order.later_amount_cents ?? 0)));
    if (amount <= 0) {
      results.push({ orderId: order.id, ok: false, detail: "zero_amount" });
      continue;
    }

    const params = new URLSearchParams();
    params.set("amount", String(amount));
    params.set("currency", "usd");
    params.set("customer", order.stripe_customer_id);
    params.set("off_session", "true");
    params.set("confirm", "true");
    params.set("metadata[enrollment_order_id]", String(order.id));
    params.set("metadata[pay_phase]", "second");
    params.set("metadata[registration_ids]", registrationIds.join(",") || String(firstReg));

    const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    const stripeJson = (await stripeRes.json().catch(() => null)) as { id?: string; last_payment_error?: { message?: string } };

    if (!stripeRes.ok || !stripeJson?.id) {
      results.push({
        orderId: order.id,
        ok: false,
        detail: stripeJson?.last_payment_error?.message ?? "stripe_error",
      });
      continue;
    }

    await env.DB.prepare(`UPDATE enrollment_orders SET second_stripe_payment_intent_id = ? WHERE id = ?`)
      .bind(stripeJson.id, order.id)
      .run();

    await env.DB.prepare(
      `
      INSERT INTO payments (
        registration_id,
        enrollment_order_id,
        stripe_payment_intent_id,
        amount,
        subtotal,
        discount_amount,
        currency,
        status,
        payment_type,
        metadata,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, 0, 'usd', 'pending', 'order_balance', ?, datetime('now'), datetime('now'))
      `,
    )
      .bind(
        firstReg,
        order.id,
        stripeJson.id,
        amount,
        amount,
        JSON.stringify({
          enrollmentOrderId: order.id,
          registrationIds,
          payPhase: "second",
        }),
      )
      .run();

    results.push({ orderId: order.id, ok: true });
  }

  return json({ ok: true, processed: results.length, results });
}
