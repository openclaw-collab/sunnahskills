import Stripe from "stripe";
import { DEFAULT_CURRENCY } from "../../../shared/money";
import {
  finalizePaymentIntentSucceeded,
  incrementDiscountUse,
  loadOrderStatus,
  loadPaymentBySubscription,
  markRegistrationActive,
  syncSessionEnrolledCount,
  sendPaymentEmails,
  type PaymentsEnv as Env,
} from "./finalize-payment-intent";

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function errorSummary(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
    stack: null,
  };
}

function eventObjectId(event: Stripe.Event) {
  const object = event.data?.object as { id?: string } | undefined;
  return object?.id ?? null;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    console.error("[stripe webhook] missing configuration", {
      hasStripeSecretKey: Boolean(env.STRIPE_SECRET_KEY),
      hasStripeWebhookSecret: Boolean(env.STRIPE_WEBHOOK_SECRET),
      url: request.url,
    });
    return json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    console.warn("[stripe webhook] missing signature header", { url: request.url });
    return json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("[stripe webhook] invalid signature", {
      url: request.url,
      signaturePrefix: sig.slice(0, 24),
      bodyLength: raw.length,
      error: errorSummary(error),
    });
    return json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const finalization = await finalizePaymentIntentSucceeded(env, stripe, pi);
      return json(finalization);
    }

    if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      await env.DB.prepare(
        `UPDATE payments SET status='failed', updated_at=datetime('now') WHERE stripe_payment_intent_id = ? AND status != 'paid'`,
      )
        .bind(pi.id)
        .run();
      const orderIdFromMeta = pi.metadata?.enrollment_order_id ? Number(pi.metadata.enrollment_order_id) : null;
      if (Number.isInteger(orderIdFromMeta) && orderIdFromMeta! > 0) {
        const payPhase = String(pi.metadata?.pay_phase ?? "first");
        const order = await loadOrderStatus(env, orderIdFromMeta);
        if (order?.status === "superseded" || order?.status === "abandoned") {
          return json({ ok: true });
        }
        await env.DB.prepare(
          `UPDATE enrollment_orders
           SET manual_review_status = 'required',
               manual_review_reason = ?,
               last_payment_error = ?,
               last_payment_attempt_at = datetime('now')
           WHERE id = ?`,
        )
          .bind(
            payPhase === "second" ? "later_charge_failed" : "initial_payment_failed",
            pi.last_payment_error?.message ?? "Payment failed",
            orderIdFromMeta,
          )
          .run();
      }
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
            await syncSessionEnrolledCount(env, payment.session_id ?? null);

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
                currency: String(invoice.currency ?? payment.currency ?? DEFAULT_CURRENCY),
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
  } catch (error) {
    console.error("[stripe webhook] handler failed", {
      eventId: event.id,
      eventType: event.type,
      objectId: eventObjectId(event),
      error: errorSummary(error),
    });
    return json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
