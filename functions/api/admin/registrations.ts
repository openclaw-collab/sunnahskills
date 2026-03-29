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
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const includeSuperseded = url.searchParams.get("includeSuperseded") === "1";

  const where: string[] = [];
  const binds: any[] = [];
  if (programId) {
    where.push("r.program_id = ?");
    binds.push(programId);
  }
  if (status) {
    where.push("r.status = ?");
    binds.push(status);
  }
  if (q) {
    where.push("(g.full_name LIKE ? OR g.email LIKE ? OR s.full_name LIKE ?)");
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (!includeSuperseded) {
    where.push("(o.status IS NULL OR o.status != 'superseded')");
  }

  const sql = `
    SELECT
      r.id as registration_id,
      r.status as registration_status,
      r.created_at as created_at,
      p.name as program_name,
      p.slug as program_slug,
      g.full_name as guardian_name,
      g.email as guardian_email,
      s.full_name as student_name,
      pay.status as payment_status,
      pay.amount as payment_amount,
      o.status as order_status,
      o.manual_review_reason as order_manual_review_reason,
      o.total_cents as order_total_cents,
      o.amount_due_today_cents as order_amount_due_today_cents,
      o.later_amount_cents as order_later_amount_cents,
      o.later_payment_date as order_later_payment_date
    FROM registrations r
    JOIN programs p ON p.id = r.program_id
    JOIN guardians g ON g.id = r.guardian_id
    JOIN students s ON s.id = r.student_id
    LEFT JOIN payments pay ON pay.registration_id = r.id
    LEFT JOIN enrollment_orders o ON o.id = r.enrollment_order_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY r.created_at DESC
    LIMIT 250
  `;

  const stmt = env.DB.prepare(sql);
  const { results } = binds.length ? await stmt.bind(...binds).all() : await stmt.all();
  return json({ registrations: results ?? [] });
}
