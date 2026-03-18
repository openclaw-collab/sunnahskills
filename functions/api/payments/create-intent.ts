interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}

type CreateIntentRequest = {
  registrationId: number;
  discountCode?: string;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const body = (await request.json().catch(() => null)) as CreateIntentRequest | null;
  if (!body?.registrationId) return json({ error: "registrationId is required" }, { status: 400 });
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const reg = await env.DB.prepare(
    `
    SELECT r.id as registration_id,
           r.program_id as program_id,
           r.price_id as price_id,
           p.amount as amount,
           p.registration_fee as registration_fee,
           p.frequency as frequency
    FROM registrations r
    LEFT JOIN program_prices p ON p.id = r.price_id
    WHERE r.id = ?
    `,
  )
    .bind(body.registrationId)
    .first();

  if (!reg) return json({ error: "Registration not found" }, { status: 404 });
  if (!reg.amount) return json({ error: "Registration has no price selected" }, { status: 400 });

  // TODO(phase2): validate discountCode server-side; compute sibling discounts.
  const subtotal = Number(reg.amount) + Number(reg.registration_fee ?? 0);
  let discountAmount = 0;
  if (body.discountCode) {
    const disc = await env.DB.prepare(
      `
      SELECT type, value, program_id, max_uses, current_uses, valid_from, valid_until, active
      FROM discounts
      WHERE code = ? AND active = 1
      LIMIT 1
      `,
    )
      .bind(body.discountCode.trim().toUpperCase())
      .first();

    if (disc && (!disc.program_id || disc.program_id === reg.program_id)) {
      const now = Date.now();
      const validFrom = disc.valid_from ? Date.parse(String(disc.valid_from)) : null;
      const validUntil = disc.valid_until ? Date.parse(String(disc.valid_until)) : null;
      const withinWindow = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
      const underMaxUses =
        disc.max_uses == null ||
        disc.current_uses == null ||
        Number(disc.current_uses) < Number(disc.max_uses);

      if (withinWindow && underMaxUses) {
        if (disc.type === "fixed") discountAmount = Math.min(subtotal, Number(disc.value));
        if (disc.type === "percentage") discountAmount = Math.floor((subtotal * Number(disc.value)) / 100);
      }
    }
  }
  const total = subtotal - discountAmount;

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json({ error: "Stripe not configured" }, { status: 500 });

  const params = new URLSearchParams();
  params.set("amount", String(total));
  params.set("currency", "usd");
  params.set("automatic_payment_methods[enabled]", "true");
  params.set("metadata[registration_id]", String(body.registrationId));
  params.set("metadata[program_id]", String(reg.program_id ?? ""));

  const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const stripeJson = (await stripeRes.json().catch(() => null)) as any;
  if (!stripeRes.ok || !stripeJson?.id || !stripeJson?.client_secret) {
    return json(
      { error: "Stripe error creating PaymentIntent", details: stripeJson },
      { status: 502 },
    );
  }

  await env.DB.prepare(
    `
    INSERT INTO payments (
      registration_id,
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
    ) VALUES (?, ?, ?, ?, ?, 'usd', 'pending', 'one_time', ?, datetime('now'), datetime('now'))
    `,
  )
    .bind(
      body.registrationId,
      stripeJson.id,
      total,
      subtotal,
      discountAmount,
      JSON.stringify({ discountCode: body.discountCode ?? null }),
    )
    .run();

  await env.DB.prepare(
    `UPDATE registrations SET status = 'pending_payment', updated_at = datetime('now') WHERE id = ?`,
  )
    .bind(body.registrationId)
    .run();

  return json({ clientSecret: stripeJson.client_secret, paymentIntentId: stripeJson.id });
}

