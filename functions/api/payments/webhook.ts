import Stripe from "stripe";
import { sendMailChannelsEmail } from "../../_utils/email";
import { adminPaymentReceivedEmail, paymentReceiptEmail } from "../../_utils/emailTemplates";

interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  SITE_URL?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function loadPaymentByIntent(env: Env, paymentIntentId: string) {
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
    .first<{
      id: number;
      status: string;
      registration_id: number;
      stripe_subscription_id: string | null;
      amount: number;
      currency: string;
      receipt_url: string | null;
      metadata: string | null;
      session_id: number | null;
    }>();
}

async function loadPaymentBySubscription(env: Env, subscriptionId: string) {
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
    .first<{
      id: number;
      status: string;
      registration_id: number;
      stripe_subscription_id: string | null;
      amount: number;
      currency: string;
      receipt_url: string | null;
      metadata: string | null;
      session_id: number | null;
    }>();
}

async function incrementDiscountUse(env: Env, metadataJson: string | null | undefined) {
  if (!metadataJson) return;
  let code: string | null = null;
  try {
    const metadata = JSON.parse(metadataJson) as Record<string, unknown>;
    code = typeof metadata.discountCode === "string" ? metadata.discountCode.trim().toUpperCase() : null;
  } catch {
    code = null;
  }
  if (!code) return;

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

async function sendPaymentEmails(
  env: Env,
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

async function markRegistrationActive(env: Env, registrationId: number) {
  await env.DB.prepare(
    `UPDATE registrations SET status='active', updated_at=datetime('now') WHERE id = ?`,
  )
    .bind(registrationId)
    .run();
}

async function incrementSessionEnrollment(env: Env, sessionId: number | null | undefined) {
  if (!sessionId) return;
  await env.DB.prepare(`UPDATE program_sessions SET enrolled_count = enrolled_count + 1 WHERE id = ?`)
    .bind(sessionId)
    .run();
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const sig = request.headers.get("stripe-signature");
  if (!sig) return json({ error: "Missing stripe-signature header" }, { status: 400 });

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const payment = await loadPaymentByIntent(env, pi.id);
      const receiptUrl = (pi.charges?.data?.[0]?.receipt_url as string) ?? null;

      if (payment?.status === "paid") {
        return json({ ok: true });
      }

      const orderIdFromMeta = pi.metadata?.enrollment_order_id ? Number(pi.metadata.enrollment_order_id) : null;
      const payPhase = String(pi.metadata?.pay_phase ?? "first");

      if (Number.isInteger(orderIdFromMeta) && orderIdFromMeta! > 0) {
        await env.DB.prepare(
          `UPDATE payments SET status='paid', receipt_url=COALESCE(?, receipt_url), updated_at=datetime('now')
           WHERE stripe_payment_intent_id = ?`,
        )
          .bind(receiptUrl, pi.id)
          .run();
        await incrementDiscountUse(env, payment?.metadata ?? null);

        const regIdsStr = String(pi.metadata?.registration_ids ?? "");
        const regIds = regIdsStr
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isInteger(n) && n > 0);

        if (payPhase === "second") {
          await env.DB.prepare(`UPDATE enrollment_orders SET status = 'paid' WHERE id = ?`).bind(orderIdFromMeta).run();

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
              currency: String(pi.currency ?? "usd"),
              registrationId: regIds[0] ?? 0,
              receiptUrl,
            });
          }

          return json({ ok: true });
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
        await env.DB.prepare(`UPDATE enrollment_orders SET status = ? WHERE id = ?`).bind(newOrderStatus, orderIdFromMeta).run();

        if (firstReg?.guardian_email) {
          await sendPaymentEmails(env, {
            guardianName: firstReg.guardian_name,
            guardianEmail: firstReg.guardian_email,
            studentName:
              regIds.length > 1 ? `Household (${regIds.length} students)` : firstReg.student_name,
            programName: firstReg.program_name,
            amount: Number(pi.amount_received ?? 0),
            currency: String(pi.currency ?? "usd"),
            registrationId: regIds[0] ?? 0,
            receiptUrl,
          });
        }

        return json({ ok: true });
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
            currency: String(reg.currency ?? pi.currency ?? "usd"),
            registrationId,
            receiptUrl,
          });
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      await env.DB.prepare(
        `UPDATE payments SET status='failed', updated_at=datetime('now') WHERE stripe_payment_intent_id = ? AND status != 'paid'`,
      )
        .bind(pi.id)
        .run();
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription ? String(invoice.subscription) : null;
      if (subId) {
        const payment = await loadPaymentBySubscription(env, subId);
        const wasPaid = payment?.status === "paid";
        if (!wasPaid) {
          await env.DB.prepare(
            `UPDATE payments SET status='paid', receipt_url=COALESCE(?, receipt_url), updated_at=datetime('now') WHERE stripe_subscription_id = ?`,
          )
            .bind(invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null, subId)
            .run();
          await incrementDiscountUse(env, payment?.metadata ?? null);

          if (payment?.registration_id) {
            await markRegistrationActive(env, payment.registration_id);
            await incrementSessionEnrollment(env, payment.session_id ?? null);

            const reg = await env.DB.prepare(
              `
              SELECT
                g.full_name as guardian_name,
                g.email as guardian_email,
                s.full_name as student_name,
                p.name as program_name
              FROM registrations r
              JOIN guardians g ON g.id = r.guardian_id
              JOIN students s ON s.id = r.student_id
              JOIN programs p ON p.id = r.program_id
              WHERE r.id = ?
              LIMIT 1
              `,
            )
              .bind(payment.registration_id)
              .first<{
                guardian_name: string;
                guardian_email: string;
                student_name: string;
                program_name: string;
              }>();

            if (reg?.guardian_email) {
              await sendPaymentEmails(env, {
                guardianName: reg.guardian_name,
                guardianEmail: reg.guardian_email,
                studentName: reg.student_name,
                programName: reg.program_name,
                amount: Number(payment.amount ?? invoice.amount_paid ?? 0),
                currency: String(invoice.currency ?? payment.currency ?? "usd"),
                registrationId: payment.registration_id,
                receiptUrl: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
              });
            }
          }
        }
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription ? String(invoice.subscription) : null;
      if (subId) {
        await env.DB.prepare(
          `UPDATE payments SET status='failed', updated_at=datetime('now') WHERE stripe_subscription_id = ?`,
        )
          .bind(subId)
          .run();
      }
    }

    return json({ ok: true });
  } catch {
    return json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
