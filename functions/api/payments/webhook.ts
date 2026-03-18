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
  } catch (err) {
    return json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const registrationId = pi.metadata?.registration_id ? Number(pi.metadata.registration_id) : null;
      const receiptUrl = (pi.charges?.data?.[0]?.receipt_url as string) ?? null;

      await env.DB.prepare(
        `UPDATE payments SET status='paid', receipt_url=?, updated_at=datetime('now')
         WHERE stripe_payment_intent_id = ?`,
      )
        .bind(receiptUrl, pi.id)
        .run();

      if (registrationId) {
        await env.DB.prepare(
          `UPDATE registrations SET status='active', updated_at=datetime('now') WHERE id = ?`,
        )
          .bind(registrationId)
          .run();

        const reg = await env.DB.prepare(`SELECT session_id FROM registrations WHERE id = ?`)
          .bind(registrationId)
          .first();
        if (reg?.session_id) {
          await env.DB.prepare(
            `UPDATE program_sessions SET enrolled_count = enrolled_count + 1 WHERE id = ?`,
          )
            .bind(reg.session_id)
            .run();
        }

        // Best-effort emails
        try {
          const row = await env.DB.prepare(
            `
            SELECT
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
            .first();

          const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";
          const guardianName = String(row?.guardian_name ?? "Parent");
          const guardianEmail = String(row?.guardian_email ?? "");
          const studentName = String(row?.student_name ?? "Student");
          const programName = String(row?.program_name ?? "Program");
          const amount = Number(row?.amount ?? pi.amount_received ?? 0);
          const currency = String(row?.currency ?? pi.currency ?? "usd");

          if (guardianEmail) {
            const userMsg = paymentReceiptEmail({
              guardianName,
              studentName,
              programName,
              amountCents: amount,
              currency,
              receiptUrl,
              siteUrl: env.SITE_URL,
            });
            await sendMailChannelsEmail(env, {
              to: { email: guardianEmail, name: guardianName },
              from: { email: fromEmail, name: "Sunnah Skills" },
              subject: userMsg.subject,
              text: userMsg.text,
              html: userMsg.html,
            });
          }

          if (env.EMAIL_TO) {
            const adminMsg = adminPaymentReceivedEmail({
              guardianName,
              guardianEmail,
              studentName,
              programName,
              amountCents: amount,
              currency,
              registrationId,
              receiptUrl,
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
          // swallow
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      await env.DB.prepare(
        `UPDATE payments SET status='failed', updated_at=datetime('now') WHERE stripe_payment_intent_id = ?`,
      )
        .bind(pi.id)
        .run();
    }

    // invoice.paid: subscription recurring payment (handled when subscription support is enabled)
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoice.subscription ? String(invoice.subscription) : null;
      if (subId) {
        await env.DB.prepare(
          `UPDATE payments SET status='paid', updated_at=datetime('now') WHERE stripe_subscription_id = ?`,
        )
          .bind(subId)
          .run();
      }
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

