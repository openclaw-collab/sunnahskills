import Stripe from "stripe";
import {
  finalizePaymentIntentSucceeded,
  loadOrderStatus,
  type PaymentsEnv as Env,
} from "./finalize-payment-intent";

type Body = {
  enrollmentOrderId?: number;
  paymentIntentId?: string;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function loadOrderPaymentIntentId(env: Env, orderId: number) {
  return env.DB.prepare(
    `SELECT stripe_payment_intent_id
     FROM enrollment_orders
     WHERE id = ?
     LIMIT 1`,
  )
    .bind(orderId)
    .first<{ stripe_payment_intent_id: string | null }>();
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const orderId = Number(body?.enrollmentOrderId ?? 0);
  const providedPaymentIntentId = String(body?.paymentIntentId ?? "").trim();

  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Stripe not configured" }, { status: 500 });
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return json({ error: "enrollmentOrderId is required" }, { status: 400 });
  }

  const order = await loadOrderStatus(env, orderId);
  if (!order) return json({ error: "Order not found" }, { status: 404 });

  const storedPaymentIntent = await loadOrderPaymentIntentId(env, orderId);
  const paymentIntentId = providedPaymentIntentId || String(storedPaymentIntent?.stripe_payment_intent_id ?? "").trim();
  if (!paymentIntentId) {
    return json({ error: "No payment intent is attached to this order yet." }, { status: 404 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["charges.data", "payment_method"],
  });

  const paymentIntentOrderId = Number(paymentIntent.metadata?.enrollment_order_id ?? 0);
  if (paymentIntentOrderId > 0 && paymentIntentOrderId !== orderId) {
    return json({ error: "Payment intent does not belong to this order." }, { status: 409 });
  }

  if (paymentIntent.status !== "succeeded") {
    return json({
      ok: false,
      reconciled: false,
      paymentStatus: paymentIntent.status,
      orderStatus: order.status,
      paymentIntentId,
    });
  }

  const result = await finalizePaymentIntentSucceeded(env, stripe, paymentIntent);
  const refreshedOrder = await loadOrderStatus(env, orderId);
  return json({
    ok: true,
    reconciled: true,
    paymentStatus: paymentIntent.status,
    paymentIntentId,
    orderStatus: refreshedOrder?.status ?? order.status,
    ...result,
  });
}
