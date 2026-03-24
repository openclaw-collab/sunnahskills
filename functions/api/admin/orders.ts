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

  const url = new URL(request.url);
  const review = url.searchParams.get("review");
  const status = url.searchParams.get("status");
  const where: string[] = [];
  const binds: unknown[] = [];

  if (review) {
    where.push("o.manual_review_status = ?");
    binds.push(review);
  }
  if (status) {
    where.push("o.status = ?");
    binds.push(status);
  }

  const sql = `
    SELECT
      o.id as order_id,
      o.status as order_status,
      o.manual_review_status,
      o.manual_review_reason,
      o.last_payment_error,
      o.last_payment_attempt_at,
      o.total_cents,
      o.amount_due_today_cents,
      o.later_amount_cents,
      o.later_payment_date,
      o.stripe_payment_intent_id,
      o.second_stripe_payment_intent_id,
      o.created_at,
      g.full_name as guardian_name,
      g.email as guardian_email,
      COUNT(DISTINCT r.id) as registration_count,
      GROUP_CONCAT(DISTINCT s.full_name) as student_names,
      SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END) as paid_cents,
      MAX(pay.status) as latest_payment_status,
      MIN(r.id) as first_registration_id
    FROM enrollment_orders o
    LEFT JOIN guardians g ON g.id = o.guardian_id
    LEFT JOIN registrations r ON r.enrollment_order_id = o.id
    LEFT JOIN students s ON s.id = r.student_id
    LEFT JOIN payments pay ON pay.enrollment_order_id = o.id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY o.id
    ORDER BY
      CASE WHEN o.manual_review_status = 'required' THEN 0 ELSE 1 END,
      o.created_at DESC
    LIMIT 250
  `;

  const stmt = env.DB.prepare(sql);
  const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
  return json({ orders: results ?? [] });
}
