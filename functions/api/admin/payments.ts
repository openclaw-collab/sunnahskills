import { getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "payments", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const { results } = await env.DB.prepare(
    `
    SELECT
      pay.id as payment_id,
      pay.registration_id as registration_id,
      pay.status as status,
      pay.amount as amount,
      pay.currency as currency,
      pay.created_at as created_at,
      pay.stripe_payment_intent_id as stripe_payment_intent_id
    FROM payments pay
    ORDER BY pay.created_at DESC
    LIMIT 250
    `,
  ).all();

  return json({ payments: results ?? [] });
}
