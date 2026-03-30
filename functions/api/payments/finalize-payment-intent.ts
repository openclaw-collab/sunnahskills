import Stripe from "stripe";
import { DEFAULT_CURRENCY } from "../../../shared/money";
import { sendMailChannelsEmail } from "../../_utils/email";
import { adminPaymentReceivedEmail, paymentReceiptEmail } from "../../_utils/emailTemplates";

export interface PaymentsEnv {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  SITE_URL?: string;
}

type LoadedPayment = {
  id: number;
  status: string;
  registration_id: number;
  stripe_subscription_id: string | null;
  amount: number;
  currency: string;
  receipt_url: string | null;
  metadata: string | null;
  session_id: number | null;
};

type LoadedOrderStatus = {
  id: number;
  status: string;
  manual_review_status: string | null;
  manual_review_reason: string | null;
};

export async function loadPaymentByIntent(env: PaymentsEnv, paymentIntentId: string) {
  return env.DB.prepare(
    `
    SELECT pay.id, pay.status, pay.registration_id, pay.stripe_subscription_id,
           pay.amount, pay.currency, pay.receipt_url, pay.metadata,
           r.session_id
    FROM payments pay
    JOIN registrations r ON r.id = pay.registration_id
    WHERE pay.stripe_payment_intent_id = ?
    LIMIT 1
    `,
  )
    .bind(paymentIntentId)
    .first<LoadedPayment>();
}

export async function loadPaymentBySubscription(env: PaymentsEnv, subscriptionId: string) {
  return env.DB.prepare(
    `
    SELECT pay.id, pay.status, pay.registration_id, pay.stripe_subscription_id,
           pay.amount, pay.currency, pay.receipt_url, pay.metadata,
           r.session_id
    FROM payments pay
    JOIN registrations r ON r.id = pay.registration_id
    WHERE pay.stripe_subscription_id = ?
    LIMIT 1
    `,
  )
    .bind(subscriptionId)
    .first<LoadedPayment>();
}

export async function loadOrderStatus(env: PaymentsEnv, orderId: number) {
  return env.DB.prepare(
    `SELECT id, status, manual_review_status, manual_review_reason
     FROM enrollment_orders
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(orderId)
    .first<LoadedOrderStatus>();
}

export async function incrementDiscountUse(env: PaymentsEnv, metadataJson: string | null | undefined) {
  if (!metadataJson) return;
  let codes: string[] = [];
  try {
    const metadata = JSON.parse(metadataJson) as Record<string, unknown>;
    if (Array.isArray(metadata.discountCodes)) {
      codes = metadata.discountCodes
        .map((value) => String(value).trim().toUpperCase())
        .filter(Boolean);
    } else if (typeof metadata.discountCode === "string") {
      codes = [metadata.discountCode.trim().toUpperCase()];
    }
  } catch {
    codes = [];
  }
  if (codes.length === 0) return;

  for (const code of codes) {
    await env.DB.prepare(
      `
      UPDATE discounts
      SET current_uses = COALESCE(current_uses, 0) + 1
      WHERE code = ? AND active = 1 AND (max_uses IS NULL OR current_uses < max_uses)
      `,
    )
      .bind(code)
      .run();
  }
}

function readPaymentMetadata(metadataJson: string | null | undefined) {
  if (!metadataJson) return {};
  try {
    return JSON.parse(metadataJson) as {
      prorationCode?: string | null;
    };
  } catch {
    return {};
  }
}

async function redeemProrationCode(env: PaymentsEnv, code: string | null | undefined, orderId: number) {
  const normalized = String(code ?? "")
    .trim()
    .toUpperCase();
  if (!normalized) return;
  await env.DB.prepare(
    `UPDATE proration_codes
     SET redeemed_at = COALESCE(redeemed_at, datetime('now')),
         redeemed_order_id = COALESCE(redeemed_order_id, ?)
     WHERE code = ? AND active = 1`,
  )
    .bind(orderId, normalized)
    .run();
}

async function sendPaymentEmails(
  env: PaymentsEnv,
  params: {
    guardianName: string;
    guardianEmail: string;
    studentName: string;
    programName: string;
    amount: number;
    currency: string;
    registrationId: number;
    receiptUrl?: string | null;
  },
) {
  const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";
  try {
    const userMsg = paymentReceiptEmail({
      guardianName: params.guardianName,
      studentName: params.studentName,
      programName: params.programName,
      amountCents: params.amount,
      currency: params.currency,
      receiptUrl: params.receiptUrl,
      siteUrl: env.SITE_URL,
    });
    await sendMailChannelsEmail(env, {
      to: { email: params.guardianEmail, name: params.guardianName },
      from: { email: fromEmail, name: "Sunnah Skills" },
      subject: userMsg.subject,
      text: userMsg.text,
      html: userMsg.html,
    });

    if (env.EMAIL_TO) {
      const adminMsg = adminPaymentReceivedEmail({
        guardianName: params.guardianName,
        guardianEmail: params.guardianEmail,
        studentName: params.studentName,
        programName: params.programName,
        amountCents: params.amount,
        currency: params.currency,
        registrationId: params.registrationId,
        receiptUrl: params.receiptUrl,
        siteUrl: env.SITE_URL,
      });
      await sendMailChannelsEmail(env, {
        to: { email: env.EMAIL_TO, name: "Sunnah Skills Admin" },
        from: { email: fromEmail, name: "Sunnah Skills" },
        subject: adminMsg.subject,
        text: adminMsg.text,
        html: adminMsg.html,
      });
    }
  } catch {
    // Best-effort only.
  }
}

async function markRegistrationActive(env: PaymentsEnv, registrationId: number) {
  await env.DB.prepare(
    `UPDATE registrations SET status='active', updated_at=datetime('now') WHERE id = ?`,
  )
    .bind(registrationId)
    .run();
}

async function incrementSessionEnrollment(env: PaymentsEnv, sessionId: number | null | undefined) {
  if (!sessionId) return;
  await env.DB.prepare(`UPDATE program_sessions SET enrolled_count = enrolled_count + 1 WHERE id = ?`)
    .bind(sessionId)
    .run();
}

export async function finalizePaymentIntentSucceeded(
  env: PaymentsEnv,
  stripe: Stripe,
  pi: Stripe.PaymentIntent,
) {
  const payment = await loadPaymentByIntent(env, pi.id);
  const receiptUrl = (pi.charges?.data?.[0]?.receipt_url as string) ?? null;

  if (payment?.status === "paid") {
    return { ok: true as const, alreadyPaid: true };
  }

  const orderIdFromMeta = pi.metadata?.enrollment_order_id ? Number(pi.metadata.enrollment_order_id) : null;
  const payPhase = String(pi.metadata?.pay_phase ?? "first");
  const paymentMetadata = readPaymentMetadata(payment?.metadata);

  if (Number.isInteger(orderIdFromMeta) && orderIdFromMeta! > 0) {
    const order = await loadOrderStatus(env, orderIdFromMeta);
    await env.DB.prepare(
      `UPDATE payments SET status='paid', receipt_url=COALESCE(?, receipt_url), updated_at=datetime('now')
       WHERE stripe_payment_intent_id = ?`,
    )
      .bind(receiptUrl, pi.id)
      .run();
    await incrementDiscountUse(env, payment?.metadata ?? null);

    if (order?.status === "superseded" || order?.status === "abandoned") {
      await env.DB.prepare(
        `UPDATE enrollment_orders
         SET manual_review_status = 'required',
             manual_review_reason = ?,
             last_payment_error = NULL,
             last_payment_attempt_at = datetime('now')
         WHERE id = ?`,
      )
        .bind("superseded_payment_succeeded", orderIdFromMeta)
        .run();
      return { ok: true as const, manualReview: true };
    }

    const regIdsStr = String(pi.metadata?.registration_ids ?? "");
    const regIds = regIdsStr
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

    if (payPhase === "second") {
      await env.DB.prepare(
        `UPDATE enrollment_orders
         SET status = 'paid',
             manual_review_status = 'none',
             manual_review_reason = NULL,
             last_payment_error = NULL,
             last_payment_attempt_at = datetime('now')
         WHERE id = ?`,
      )
        .bind(orderIdFromMeta)
        .run();

      let firstReg: {
        guardian_name: string;
        guardian_email: string;
        student_name: string;
        program_name: string;
      } | null = null;

      for (const rid of regIds) {
        const reg = await env.DB.prepare(
          `
          SELECT g.full_name as guardian_name, g.email as guardian_email,
                 s.full_name as student_name, p.name as program_name
          FROM registrations r
          JOIN guardians g ON g.id = r.guardian_id
          JOIN students s ON s.id = r.student_id
          JOIN programs p ON p.id = r.program_id
          WHERE r.id = ?
          LIMIT 1
          `,
        )
          .bind(rid)
          .first<{
            guardian_name: string;
            guardian_email: string;
            student_name: string;
            program_name: string;
          }>();
        if (reg && !firstReg) firstReg = reg;
      }

      if (firstReg?.guardian_email) {
        await sendPaymentEmails(env, {
          guardianName: firstReg.guardian_name,
          guardianEmail: firstReg.guardian_email,
          studentName:
            regIds.length > 1 ? `Household — remaining balance (${regIds.length} enrollments)` : firstReg.student_name,
          programName: firstReg.program_name,
          amount: Number(pi.amount_received ?? 0),
          currency: String(pi.currency ?? DEFAULT_CURRENCY),
          registrationId: regIds[0] ?? 0,
          receiptUrl,
        });
      }

      return { ok: true as const };
    }

    const orderRow = await env.DB.prepare(`SELECT later_amount_cents FROM enrollment_orders WHERE id = ?`)
      .bind(orderIdFromMeta)
      .first<{ later_amount_cents: number | null }>();
    const laterDue = Math.max(0, Number(orderRow?.later_amount_cents ?? 0));

    const pmRef = pi.payment_method;
    const pmId =
      typeof pmRef === "string"
        ? pmRef
        : pmRef && typeof pmRef === "object" && pmRef !== null && "id" in pmRef
          ? String((pmRef as { id: string }).id)
          : null;
    const customerId =
      typeof pi.customer === "string"
        ? pi.customer
        : pi.customer && typeof pi.customer === "object" && "id" in pi.customer
          ? String((pi.customer as { id: string }).id)
          : null;
    if (pmId && customerId) {
      try {
        await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: pmId } });
      } catch {
        /* best-effort: off-session second charge may still work if PM saved */
      }
    }

    let firstReg: {
      session_id: number | null;
      guardian_name: string;
      guardian_email: string;
      student_name: string;
      program_name: string;
    } | null = null;

    for (const rid of regIds) {
      await markRegistrationActive(env, rid);
      const reg = await env.DB.prepare(
        `
        SELECT r.session_id, g.full_name as guardian_name, g.email as guardian_email,
               s.full_name as student_name, p.name as program_name
        FROM registrations r
        JOIN guardians g ON g.id = r.guardian_id
        JOIN students s ON s.id = r.student_id
        JOIN programs p ON p.id = r.program_id
        WHERE r.id = ?
        LIMIT 1
        `,
      )
        .bind(rid)
        .first<{
          session_id: number | null;
          guardian_name: string;
          guardian_email: string;
          student_name: string;
          program_name: string;
        }>();
      if (reg) {
        await incrementSessionEnrollment(env, reg.session_id);
        if (!firstReg) firstReg = reg;
      }
    }

    const newOrderStatus = laterDue > 0 ? "partially_paid" : "paid";
    await env.DB.prepare(
      `UPDATE enrollment_orders
       SET status = ?,
           manual_review_status = 'none',
           manual_review_reason = NULL,
           last_payment_error = NULL,
           last_payment_attempt_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(newOrderStatus, orderIdFromMeta)
      .run();
    await redeemProrationCode(env, paymentMetadata.prorationCode ?? null, orderIdFromMeta);

    if (firstReg?.guardian_email) {
      await sendPaymentEmails(env, {
        guardianName: firstReg.guardian_name,
        guardianEmail: firstReg.guardian_email,
        studentName:
          regIds.length > 1 ? `Household (${regIds.length} students)` : firstReg.student_name,
        programName: firstReg.program_name,
        amount: Number(pi.amount_received ?? 0),
        currency: String(pi.currency ?? DEFAULT_CURRENCY),
        registrationId: regIds[0] ?? 0,
        receiptUrl,
      });
    }

    return { ok: true as const, orderStatus: newOrderStatus };
  }

  const registrationIdFromMeta = pi.metadata?.registration_id ? Number(pi.metadata.registration_id) : null;
  const registrationId = payment?.registration_id ?? (Number.isInteger(registrationIdFromMeta) ? registrationIdFromMeta : null);

  await env.DB.prepare(
    `UPDATE payments SET status='paid', receipt_url=COALESCE(?, receipt_url), updated_at=datetime('now')
     WHERE stripe_payment_intent_id = ?`,
  )
    .bind(receiptUrl, pi.id)
    .run();
  await incrementDiscountUse(env, payment?.metadata ?? null);

  if (registrationId) {
    await markRegistrationActive(env, registrationId);

    const reg = await env.DB.prepare(
      `
      SELECT
        r.session_id,
        g.full_name as guardian_name,
        g.email as guardian_email,
        s.full_name as student_name,
        p.name as program_name,
        pay.amount as amount,
        pay.currency as currency
      FROM registrations r
      JOIN guardians g ON g.id = r.guardian_id
      JOIN students s ON s.id = r.student_id
      JOIN programs p ON p.id = r.program_id
      LEFT JOIN payments pay ON pay.registration_id = r.id
      WHERE r.id = ?
      LIMIT 1
      `,
    )
      .bind(registrationId)
      .first<{
        session_id: number | null;
        guardian_name: string;
        guardian_email: string;
        student_name: string;
        program_name: string;
        amount: number | null;
        currency: string | null;
      }>();

    await incrementSessionEnrollment(env, reg?.session_id ?? payment?.session_id ?? null);

    if (reg?.guardian_email) {
      await sendPaymentEmails(env, {
        guardianName: reg.guardian_name,
        guardianEmail: reg.guardian_email,
        studentName: reg.student_name,
        programName: reg.program_name,
        amount: Number(reg.amount ?? pi.amount_received ?? 0),
        currency: String(reg.currency ?? pi.currency ?? DEFAULT_CURRENCY),
        registrationId,
        receiptUrl,
      });
    }
  }

  return { ok: true as const };
}
