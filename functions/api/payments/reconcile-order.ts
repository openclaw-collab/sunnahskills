import Stripe from "stripe";
import { verifyPaymentReconcileToken } from "../../_utils/paymentReconcileToken";
import {
  finalizePaymentIntentSucceeded,
  loadOrderStatus,
  type PaymentsEnv as Env,
} from "./finalize-payment-intent";

type Body = {
  enrollmentOrderId?: number;
  paymentIntentId?: string;
  reconcileToken?: string;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const orderId = Number(body?.enrollmentOrderId ?? 0);
  const providedPaymentIntentId = String(body?.paymentIntentId ?? "").trim();
  const reconcileToken = String(body?.reconcileToken ?? "").trim();

  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Stripe not configured" }, { status: 500 });
  if (!Number.isInteger(orderId) || orderId <= 0) {
    return json({ error: "enrollmentOrderId is required" }, { status: 400 });
  }
  if (!reconcileToken) {
    return json({ error: "reconcileToken is required" }, { status: 401 });
  }

  const verifiedToken = await verifyPaymentReconcileToken(env, reconcileToken);
  if (!verifiedToken || verifiedToken.enrollmentOrderId !== orderId) {
    return json({ error: "Invalid reconcile token." }, { status: 401 });
  }

  const order = await loadOrderStatus(env, orderId);
  if (!order) return json({ error: "Order not found" }, { status: 404 });

  const paymentIntentId = providedPaymentIntentId || verifiedToken.paymentIntentId;
  if (!paymentIntentId) {
    return json({ error: "No payment intent is attached to this order yet." }, { status: 404 });
  }
  if (paymentIntentId !== verifiedToken.paymentIntentId) {
    return json({ error: "Payment intent does not match this reconcile token." }, { status: 409 });
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
