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
  if (!hasAdminPermission(admin, "registrations", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const programId = url.searchParams.get("programId");
  const registrationStatus = url.searchParams.get("registrationStatus") ?? url.searchParams.get("status");
  const track = url.searchParams.get("track");
  const locationId = url.searchParams.get("locationId");
  const paymentState = url.searchParams.get("paymentState");
  const q = url.searchParams.get("q");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const sort = url.searchParams.get("sort") ?? "newest";
  const includeSuperseded = url.searchParams.get("includeSuperseded") === "1";

  const where: string[] = [];
  const binds: any[] = [];
  if (programId) {
    where.push("r.program_id = ?");
    binds.push(programId);
  }
  if (track) {
    where.push("ps.age_group = ?");
    binds.push(track);
  }
  if (locationId) {
    where.push("COALESCE(ps.location_id, 'mississauga') = ?");
    binds.push(locationId);
  }
  if (registrationStatus) {
    where.push("r.status = ?");
    binds.push(registrationStatus);
  }
  if (q) {
    where.push("(g.full_name LIKE ? OR g.email LIKE ? OR s.full_name LIKE ? OR CAST(r.id AS TEXT) LIKE ? OR CAST(o.id AS TEXT) LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (dateFrom) {
    where.push("date(r.created_at) >= date(?)");
    binds.push(dateFrom);
  }
  if (dateTo) {
    where.push("date(r.created_at) <= date(?)");
    binds.push(dateTo);
  }
  if (!includeSuperseded) {
    where.push("(o.status IS NULL OR o.status != 'superseded')");
  }

  const paymentWhere: string[] = [];
  if (paymentState === "paid_full") paymentWhere.push("paid_cents >= COALESCE(order_total_cents, payment_amount, 0) AND COALESCE(order_total_cents, payment_amount, 0) > 0");
  if (paymentState === "paid_partial") paymentWhere.push("paid_cents > 0 AND paid_cents < COALESCE(order_total_cents, payment_amount, 0)");
  if (paymentState === "pending") paymentWhere.push("(paid_cents = 0 OR paid_cents IS NULL) AND COALESCE(order_status, registration_status) NOT IN ('cancelled', 'superseded')");
  if (paymentState === "failed") paymentWhere.push("payment_status IN ('failed', 'requires_payment_method')");
  if (paymentState === "superseded") paymentWhere.push("order_status = 'superseded'");
  if (paymentState === "cancelled") paymentWhere.push("registration_status = 'cancelled' OR order_status = 'cancelled'");

  const orderBy =
    sort === "oldest" ? "ORDER BY created_at ASC" :
    sort === "student" ? "ORDER BY student_name COLLATE NOCASE ASC, created_at DESC" :
    sort === "guardian" ? "ORDER BY guardian_name COLLATE NOCASE ASC, created_at DESC" :
    sort === "amount_desc" ? "ORDER BY COALESCE(order_total_cents, payment_amount, 0) DESC, created_at DESC" :
    sort === "amount_asc" ? "ORDER BY COALESCE(order_total_cents, payment_amount, 0) ASC, created_at DESC" :
    "ORDER BY created_at DESC";

  const sql = `
    WITH registration_rows AS (
    SELECT
      r.id as registration_id,
      r.status as registration_status,
      r.created_at as created_at,
      r.program_specific_data,
      p.name as program_name,
      p.slug as program_slug,
      ps.age_group as track,
      ps.id as session_id,
      ps.name as session_name,
      ps.day_of_week as session_day_of_week,
      ps.start_time as session_start_time,
      ps.end_time as session_end_time,
      COALESCE(ps.location_id, 'mississauga') as location_id,
      COALESCE(l.display_name, 'Mississauga') as location_name,
      g.full_name as guardian_name,
      g.email as guardian_email,
      g.phone as guardian_phone,
      s.full_name as student_name,
      s.date_of_birth as student_dob,
      s.gender as student_gender,
      pay.status as payment_status,
      pay.amount as payment_amount,
      pay.stripe_payment_intent_id,
      pay.receipt_url,
      o.id as order_id,
      o.status as order_status,
      o.manual_review_reason as order_manual_review_reason,
      o.total_cents as order_total_cents,
      o.amount_due_today_cents as order_amount_due_today_cents,
      o.later_amount_cents as order_later_amount_cents,
      o.later_payment_date as order_later_payment_date,
      COALESCE((
        SELECT SUM(CASE WHEN p2.status = 'paid' THEN p2.amount ELSE 0 END)
        FROM payments p2
        WHERE p2.enrollment_order_id = o.id
      ), 0) as paid_cents
    FROM registrations r
    JOIN programs p ON p.id = r.program_id
    LEFT JOIN program_sessions ps ON ps.id = r.session_id
    LEFT JOIN locations l ON l.id = COALESCE(ps.location_id, 'mississauga')
    JOIN guardians g ON g.id = r.guardian_id
    JOIN students s ON s.id = r.student_id
    LEFT JOIN payments pay ON pay.registration_id = r.id
    LEFT JOIN enrollment_orders o ON o.id = r.enrollment_order_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    )
    SELECT
      *,
      paid_cents as order_paid_cents
    FROM registration_rows
    ${paymentWhere.length ? `WHERE ${paymentWhere.join(" AND ")}` : ""}
    ${orderBy}
    LIMIT 250
  `;

  const stmt = env.DB.prepare(sql);
  const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
  return json({ registrations: results ?? [] });
}
