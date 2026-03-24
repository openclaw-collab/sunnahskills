import { getAdminFromRequest, hasAdminPermission } from "../../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function getOrderId(request: Request) {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const id = Number(parts[parts.length - 1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "payments", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const orderId = getOrderId(request);
  if (!orderId) return json({ error: "Invalid id" }, { status: 400 });

  const order = await env.DB.prepare(
    `SELECT
      o.*,
      g.full_name as guardian_name,
      g.email as guardian_email
     FROM enrollment_orders o
     LEFT JOIN guardians g ON g.id = o.guardian_id
     WHERE o.id = ?
     LIMIT 1`,
  )
    .bind(orderId)
    .first();
  if (!order) return json({ error: "Not found" }, { status: 404 });

  const registrations = await env.DB.prepare(
    `SELECT
      r.id,
      r.status,
      r.payment_choice,
      r.line_subtotal_cents,
      r.sibling_discount_applied,
      s.full_name as student_name,
      p.name as program_name,
      pay.status as payment_status,
      pay.amount as payment_amount
     FROM registrations r
     JOIN students s ON s.id = r.student_id
     JOIN programs p ON p.id = r.program_id
     LEFT JOIN payments pay ON pay.registration_id = r.id
     WHERE r.enrollment_order_id = ?
     ORDER BY r.id ASC`,
  )
    .bind(orderId)
    .all();

  return json({ order, registrations: registrations.results ?? [] });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "payments", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const orderId = getOrderId(request);
  if (!orderId) return json({ error: "Invalid id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as {
    manualReviewStatus?: string;
    manualReviewReason?: string | null;
    laterPaymentDate?: string | null;
    status?: string;
  } | null;
  if (!body) return json({ error: "Invalid payload" }, { status: 400 });

  await env.DB.prepare(
    `UPDATE enrollment_orders
     SET manual_review_status = COALESCE(?, manual_review_status),
         manual_review_reason = ?,
         later_payment_date = COALESCE(?, later_payment_date),
         status = COALESCE(?, status)
     WHERE id = ?`,
  )
    .bind(
      body.manualReviewStatus ?? null,
      body.manualReviewReason ?? null,
      body.laterPaymentDate ?? null,
      body.status ?? null,
      orderId,
    )
    .run();

  return json({ ok: true });
}
