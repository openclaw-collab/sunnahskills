import {
  applyPromoToSubtotal,
  computeLaterPaymentDateIso,
  computeLineTuitionCents,
  kidsSiblingRankForLine,
  splitPaymentPlan,
  type SemesterRow,
} from "../../../shared/orderPricing";

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

type Body = { enrollmentOrderId?: number; discountCode?: string };

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!Number.isInteger(body?.enrollmentOrderId) || Number(body!.enrollmentOrderId) <= 0) {
    return json({ error: "enrollmentOrderId is required" }, { status: 400 });
  }
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const orderId = Number(body!.enrollmentOrderId);

  const order = await env.DB.prepare(
    `SELECT id, guardian_id, status, total_cents, amount_due_today_cents, later_amount_cents, later_payment_date,
            stripe_payment_intent_id, stripe_customer_id
     FROM enrollment_orders WHERE id = ?`,
  )
    .bind(orderId)
    .first<{
      id: number;
      guardian_id: number | null;
      status: string;
      total_cents: number;
      amount_due_today_cents: number;
      later_amount_cents: number | null;
      later_payment_date: string | null;
      stripe_payment_intent_id: string | null;
      stripe_customer_id: string | null;
    }>();

  if (!order) return json({ error: "Order not found" }, { status: 404 });
  if (order.status === "waitlisted") {
    return json({ error: "This order is waitlisted — no payment is due online." }, { status: 400 });
  }
  if (order.status !== "pending_payment") {
    return json({ error: "This order is not awaiting payment." }, { status: 400 });
  }
  if (order.stripe_payment_intent_id) {
    return json({ error: "Payment was already started for this order." }, { status: 400 });
  }

  const regs = await env.DB.prepare(
    `
    SELECT r.id, r.session_id, r.price_id, r.status as reg_status, r.payment_choice, r.program_specific_data,
           r.enrollment_order_id
    FROM registrations r
    WHERE r.enrollment_order_id = ? AND r.status NOT IN ('waitlisted', 'cancelled')
    ORDER BY r.id ASC
    `,
  )
    .bind(orderId)
    .all();

  const rows =
    (regs.results as {
      id: number;
      session_id: number | null;
      price_id: number | null;
      reg_status: string;
      payment_choice: string | null;
      program_specific_data: string | null;
      enrollment_order_id: number | null;
    }[]) ?? [];

  if (rows.length === 0) {
    return json({ error: "No payable registrations on this order." }, { status: 400 });
  }

  const semesterRow = await env.DB.prepare(
    `SELECT classes_in_semester, price_per_class_cents, registration_fee_cents, later_payment_date, start_date, end_date
     FROM semesters WHERE program_id = 'bjj' AND active = 1 ORDER BY id DESC LIMIT 1`,
  ).first<SemesterRow>();
  const semester: SemesterRow | null = semesterRow ?? null;

  const parsedLines = rows.map((r) => {
    let ps: { bjjTrack?: string } = {};
    try {
      ps = JSON.parse(String(r.program_specific_data ?? "{}")) as { bjjTrack?: string };
    } catch {
      ps = {};
    }
    return {
      reg: r,
      track: String(ps.bjjTrack ?? ""),
      student: { fullName: "", dateOfBirth: "" },
    };
  });

  for (let i = 0; i < parsedLines.length; i++) {
    const st = await env.DB.prepare(`SELECT full_name, date_of_birth FROM students s JOIN registrations r ON r.student_id = s.id WHERE r.id = ?`)
      .bind(parsedLines[i].reg.id)
      .first<{ full_name: string; date_of_birth: string | null }>();
    parsedLines[i].student = {
      fullName: String(st?.full_name ?? ""),
      dateOfBirth: String(st?.date_of_birth ?? ""),
    };
  }

  const lineInputs = parsedLines.map((p) => ({ track: p.track, student: p.student }));

  let sumAfterSibling = 0;
  let dueTodayRaw = 0;
  let dueLaterRaw = 0;
  const lineCalcs: { regId: number; afterSibling: number }[] = [];

  for (let i = 0; i < parsedLines.length; i++) {
    const { reg, track } = parsedLines[i];
    const priceRow = reg.price_id
      ? await env.DB.prepare(`SELECT amount, registration_fee, frequency, metadata FROM program_prices WHERE id = ?`)
          .bind(reg.price_id)
          .first<{ amount: number | null; registration_fee: number | null; frequency: string | null; metadata: string | null }>()
      : null;

    const rank = kidsSiblingRankForLine(lineInputs, i);
    const choice = reg.payment_choice === "plan" ? "plan" : "full";
    const base = computeLineTuitionCents({
      track,
      priceId: reg.price_id,
      programPriceAmount: priceRow?.amount ?? null,
      programPriceRegFee: priceRow?.registration_fee ?? null,
      programPriceFrequency: priceRow?.frequency ?? null,
      priceMetadataJson: priceRow?.metadata ?? null,
      paymentChoice: choice,
      siblingRankAmongKidsStudents: rank,
      semester,
    });
    const split = splitPaymentPlan(base.afterSiblingCents, choice);
    sumAfterSibling += base.afterSiblingCents;
    dueTodayRaw += split.dueToday;
    dueLaterRaw += split.dueLater;
    lineCalcs.push({ regId: reg.id, afterSibling: base.afterSiblingCents });
  }

  let promoDiscount = 0;
  if (body?.discountCode?.trim()) {
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

    if (disc && (!disc.program_id || disc.program_id === "bjj")) {
      const now = Date.now();
      const validFrom = disc.valid_from ? Date.parse(String(disc.valid_from)) : null;
      const validUntil = disc.valid_until ? Date.parse(String(disc.valid_until)) : null;
      const withinWindow = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
      const underMaxUses =
        disc.max_uses == null ||
        disc.current_uses == null ||
        Number(disc.current_uses) < Number(disc.max_uses);

      if (withinWindow && underMaxUses) {
        const afterSiblingTotal = sumAfterSibling;
        if (disc.type === "fixed") promoDiscount = Math.min(afterSiblingTotal, Number(disc.value));
        if (disc.type === "percentage") promoDiscount = Math.floor((afterSiblingTotal * Number(disc.value)) / 100);
      }
    }
  }

  const adjustedTotal = applyPromoToSubtotal(sumAfterSibling, promoDiscount);
  const gross = dueTodayRaw + dueLaterRaw;
  const scale = gross > 0 ? adjustedTotal / gross : 1;
  let dueToday = Math.max(0, Math.round(dueTodayRaw * scale));
  const dueLater = Math.max(0, adjustedTotal - dueToday);
  if (dueToday + dueLater !== adjustedTotal) {
    dueToday = adjustedTotal - dueLater;
  }

  if (dueToday <= 0) {
    return json({ error: "Payment total must be greater than zero" }, { status: 400 });
  }

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json({ error: "Stripe not configured" }, { status: 500 });

  const guardian = await env.DB.prepare(`SELECT email, full_name FROM guardians WHERE id = ?`)
    .bind(order.guardian_id)
    .first<{ email: string; full_name: string }>();

  if (!guardian?.email) return json({ error: "Guardian not found" }, { status: 400 });

  const registrationIds = rows.map((r) => r.id).join(",");

  const custParams = new URLSearchParams();
  custParams.set("email", guardian.email.trim().toLowerCase());
  custParams.set("name", guardian.full_name.trim());
  custParams.set("metadata[enrollment_order_id]", String(orderId));

  let customerId = order.stripe_customer_id ?? "";
  if (!customerId) {
    const custRes = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: custParams,
    });
    const custJson = (await custRes.json().catch(() => null)) as { id?: string };
    if (!custRes.ok || !custJson?.id) {
      return json({ error: "Stripe error creating customer" }, { status: 502 });
    }
    customerId = custJson.id;
    await env.DB.prepare(`UPDATE enrollment_orders SET stripe_customer_id = ? WHERE id = ?`).bind(customerId, orderId).run();
  }

  const piParams = new URLSearchParams();
  piParams.set("amount", String(dueToday));
  piParams.set("currency", "usd");
  piParams.set("customer", customerId);
  piParams.set("setup_future_usage", "off_session");
  piParams.set("automatic_payment_methods[enabled]", "true");
  piParams.set("metadata[enrollment_order_id]", String(orderId));
  piParams.set("metadata[registration_ids]", registrationIds);
  piParams.set("metadata[pay_phase]", "first");
  piParams.set("metadata[program_id]", "bjj");

  const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: piParams,
  });

  const stripeJson = (await stripeRes.json().catch(() => null)) as { id?: string; client_secret?: string };
  if (!stripeRes.ok || !stripeJson?.id || !stripeJson?.client_secret) {
    return json({ error: "Stripe error creating PaymentIntent" }, { status: 502 });
  }

  const laterDate = order.later_payment_date?.trim() || computeLaterPaymentDateIso(semester);

  await env.DB.prepare(
    `UPDATE enrollment_orders SET
      stripe_payment_intent_id = ?,
      manual_review_status = 'none',
      manual_review_reason = NULL,
      last_payment_error = NULL,
      last_payment_attempt_at = datetime('now'),
      total_cents = ?,
      amount_due_today_cents = ?,
      later_amount_cents = ?,
      later_payment_date = COALESCE(later_payment_date, ?),
      metadata_json = ?
    WHERE id = ?`,
  )
    .bind(
      stripeJson.id,
        adjustedTotal,
        dueToday,
        dueLater,
      laterDate,
      JSON.stringify({
        discountCode: body?.discountCode ?? null,
        registrationIds: rows.map((r) => r.id),
        promoDiscountCents: promoDiscount,
      }),
      orderId,
    )
    .run();

  const firstRegId = rows[0].id;
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
    ) VALUES (?, ?, ?, ?, ?, ?, 'usd', 'pending', 'order_deposit', ?, datetime('now'), datetime('now'))
    `,
  )
    .bind(
      firstRegId,
      orderId,
      stripeJson.id,
      dueToday,
      sumAfterSibling,
      promoDiscount,
      JSON.stringify({
        discountCode: body?.discountCode ?? null,
        enrollmentOrderId: orderId,
        registrationIds: rows.map((r) => r.id),
        dueLaterCents: dueLater,
        payPhase: "first",
      }),
    )
    .run();

  for (const r of rows) {
    await env.DB.prepare(`UPDATE registrations SET status = 'pending_payment', updated_at = datetime('now') WHERE id = ?`)
      .bind(r.id)
      .run();
  }

  return json({
    clientSecret: stripeJson.client_secret,
    paymentIntentId: stripeJson.id,
    enrollmentOrderId: orderId,
    dueTodayCents: dueToday,
    dueLaterCents: dueLater,
    laterPaymentDate: laterDate,
  });
}
