import { computeLineTuitionCents, type SemesterRow } from "../../../shared/orderPricing";
import { DEFAULT_CURRENCY } from "../../../shared/money";
import { siblingDiscountForLineCents } from "../../../shared/pricing";
import { discountInvalidReasonMessage, promoDiscountForSubtotal, resolveDiscountCode } from "../../_utils/discounts";
import { getGuardianFromRequest } from "../../_utils/guardianAuth";

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}

type CreateIntentRequest = {
  registrationId: number;
  discountCode?: string;
  siblingCount?: number;
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
  if (!Number.isInteger(body?.registrationId) || Number(body.registrationId) <= 0) {
    return json({ error: "registrationId is required" }, { status: 400 });
  }

  const guardian = await getGuardianFromRequest(env, request);
  if (!guardian) {
    return json({ error: "Not authenticated" }, { status: 401 });
  }

  const ownerCheck = await env.DB.prepare(
    `SELECT r.id FROM registrations r
     JOIN enrollment_orders o ON o.id = r.enrollment_order_id
     WHERE r.id = ? AND o.guardian_account_id = ?`,
  )
    .bind(body.registrationId, guardian.guardianAccountId)
    .first<{ id: number }>();
  if (!ownerCheck) {
    return json({ error: "Registration not found" }, { status: 404 });
  }

  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const reg = await env.DB.prepare(
    `
    SELECT r.id as registration_id,
           r.program_id as program_id,
           r.price_id as price_id,
           r.program_specific_data as program_specific_data,
           p.id as program_price_row_id,
           p.amount as amount,
           p.registration_fee as registration_fee,
           p.frequency as frequency,
           p.metadata as price_metadata
    FROM registrations r
    LEFT JOIN program_prices p ON p.id = r.price_id
    WHERE r.id = ?
    `,
  )
    .bind(body.registrationId)
    .first<{
      registration_id: number;
      program_id: string;
      price_id: number | null;
      program_specific_data: string | null;
      amount: number | null;
      registration_fee: number | null;
      frequency: string | null;
      price_metadata: string | null;
    }>();

  if (!reg) return json({ error: "Registration not found" }, { status: 404 });
  if (reg.price_id == null || reg.amount == null) {
    return json({ error: "Registration has no price selected" }, { status: 400 });
  }

  let track = "";
  try {
    const ps = JSON.parse(String(reg.program_specific_data ?? "{}")) as { bjjTrack?: string };
    track = String(ps.bjjTrack ?? "");
  } catch {
    track = "";
  }

  const semesterRow = await env.DB.prepare(
    `SELECT classes_in_semester, price_per_class_cents, registration_fee_cents, later_payment_date, start_date, end_date
     FROM semesters WHERE program_id = ? AND active = 1 ORDER BY id DESC LIMIT 1`,
  )
    .bind(reg.program_id)
    .first<SemesterRow>();

  const siblingCount = Number(body.siblingCount ?? 0);
  if (!Number.isInteger(siblingCount) || siblingCount < 0 || siblingCount > 2) {
    return json({ error: "siblingCount must be between 0 and 2" }, { status: 400 });
  }

  const linePricing = computeLineTuitionCents({
    track,
    priceId: Number(reg.price_id),
    programPriceAmount: reg.amount,
    programPriceRegFee: reg.registration_fee,
    programPriceFrequency: reg.frequency,
    priceMetadataJson: reg.price_metadata,
    paymentChoice: "full",
    siblingDiscountEligible: siblingCount > 0,
    semester: semesterRow ?? null,
  });

  const subtotal = linePricing.lineSubtotalCents;
  let promoDiscount = 0;

  if (body.discountCode) {
    const discount = await resolveDiscountCode(env.DB, body.discountCode, { programId: reg.program_id });
    if (!discount.valid || !discount.row) {
      return json({ error: discountInvalidReasonMessage(discount.reason) }, { status: 400 });
    }
    promoDiscount = promoDiscountForSubtotal(subtotal, discount.row);
  }
  const afterPromo = Math.max(0, subtotal - promoDiscount);
  const siblingDiscount = siblingDiscountForLineCents(afterPromo, siblingCount > 0);
  const discountAmount = siblingDiscount + promoDiscount;
  const total = Math.max(0, afterPromo - siblingDiscount);
  if (total <= 0) {
    return json({ error: "Payment total must be greater than zero" }, { status: 400 });
  }

  const stripeKey = env.STRIPE_SECRET_KEY;
  if (!stripeKey) return json({ error: "Stripe not configured" }, { status: 500 });

  const params = new URLSearchParams();
  params.set("amount", String(total));
  params.set("currency", DEFAULT_CURRENCY);
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
    return json({ error: "Stripe error creating PaymentIntent" }, { status: 502 });
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
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'one_time', ?, datetime('now'), datetime('now'))
    `,
  )
    .bind(
      body.registrationId,
      stripeJson.id,
      total,
      subtotal,
      discountAmount,
      DEFAULT_CURRENCY,
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
