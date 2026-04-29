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
  const programId = url.searchParams.get("programId");
  const locationId = url.searchParams.get("locationId");
  const paymentState = url.searchParams.get("paymentState");
  const review = url.searchParams.get("review");
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const sort = url.searchParams.get("sort") ?? "newest";
  const includeSuperseded = url.searchParams.get("includeSuperseded") === "1";
  const where: string[] = [];
  const binds: unknown[] = [];

  if (programId) {
    where.push("r.program_id = ?");
    binds.push(programId);
  }
  if (locationId) {
    where.push("COALESCE(ps.location_id, 'mississauga') = ?");
    binds.push(locationId);
  }
  if (review) {
    where.push("o.manual_review_status = ?");
    binds.push(review);
  }
  if (status) {
    where.push("o.status = ?");
    binds.push(status);
  }
  if (q) {
    where.push("(g.full_name LIKE ? OR g.email LIKE ? OR s.full_name LIKE ? OR CAST(o.id AS TEXT) LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (dateFrom) {
    where.push("date(o.created_at) >= date(?)");
    binds.push(dateFrom);
  }
  if (dateTo) {
    where.push("date(o.created_at) <= date(?)");
    binds.push(dateTo);
  }
  if (!includeSuperseded) {
    where.push("o.status != 'superseded'");
  }

  const paymentWhere: string[] = [];
  if (paymentState === "paid_full") paymentWhere.push("paid_cents >= COALESCE(total_cents, 0) AND COALESCE(total_cents, 0) > 0");
  if (paymentState === "paid_partial") paymentWhere.push("paid_cents > 0 AND paid_cents < COALESCE(total_cents, 0)");
  if (paymentState === "pending") paymentWhere.push("(paid_cents = 0 OR paid_cents IS NULL) AND order_status NOT IN ('cancelled', 'superseded')");
  if (paymentState === "failed") paymentWhere.push("latest_payment_status IN ('failed', 'requires_payment_method')");
  if (paymentState === "superseded") paymentWhere.push("order_status = 'superseded'");
  if (paymentState === "cancelled") paymentWhere.push("order_status = 'cancelled'");

  const orderBy =
    sort === "oldest" ? "ORDER BY created_at ASC" :
    sort === "guardian" ? "ORDER BY guardian_name COLLATE NOCASE ASC, created_at DESC" :
    sort === "amount_desc" ? "ORDER BY COALESCE(total_cents, amount_due_today_cents, 0) DESC, created_at DESC" :
    sort === "amount_asc" ? "ORDER BY COALESCE(total_cents, amount_due_today_cents, 0) ASC, created_at DESC" :
    "ORDER BY CASE WHEN manual_review_status = 'required' THEN 0 ELSE 1 END, created_at DESC";

  const sql = `
    WITH order_rows AS (
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
      GROUP_CONCAT(DISTINCT p.name) as program_names,
      GROUP_CONCAT(DISTINCT COALESCE(l.display_name, 'Mississauga')) as location_names,
      GROUP_CONCAT(DISTINCT ps.age_group) as tracks,
      COALESCE((
        SELECT SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END)
        FROM payments pay
        WHERE pay.enrollment_order_id = o.id
      ), 0) as paid_cents,
      (SELECT MAX(pay.status)
       FROM payments pay
       WHERE pay.enrollment_order_id = o.id) as latest_payment_status,
      MIN(r.id) as first_registration_id
    FROM enrollment_orders o
    LEFT JOIN guardians g ON g.id = o.guardian_id
    LEFT JOIN registrations r ON r.enrollment_order_id = o.id
    LEFT JOIN programs p ON p.id = r.program_id
    LEFT JOIN program_sessions ps ON ps.id = r.session_id
    LEFT JOIN locations l ON l.id = COALESCE(ps.location_id, 'mississauga')
    LEFT JOIN students s ON s.id = r.student_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    GROUP BY o.id
    )
    SELECT *
    FROM order_rows
    ${paymentWhere.length ? `WHERE ${paymentWhere.join(" AND ")}` : ""}
    ${orderBy}
    LIMIT 250
  `;

  const stmt = env.DB.prepare(sql);
  const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
  return json({ orders: results ?? [] });
}
