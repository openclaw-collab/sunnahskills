import { ensureAdminSecuritySchema, getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";

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
  await ensureAdminSecuritySchema(env);

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "dashboard", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const [registrationCounts, paymentTotals, contactCount, sessionSnapshot, userCount, activityRows] = await Promise.all([
    env.DB.prepare(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN status = 'pending_payment' THEN 1 ELSE 0 END) AS pending_payment,
        SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END) AS waitlisted
      FROM registrations
      `,
    ).first(),
    env.DB.prepare(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid_revenue,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_revenue
      FROM payments
      `,
    ).first(),
    env.DB.prepare(`SELECT COUNT(*) AS total FROM contacts`).first(),
    env.DB.prepare(
      `
      SELECT
        COUNT(*) AS total_sessions,
        SUM(CASE WHEN status = 'active' THEN capacity ELSE 0 END) AS active_capacity,
        SUM(enrolled_count) AS enrolled_total
      FROM program_sessions
      `,
    ).first(),
    env.DB.prepare(
      `
      SELECT
        COUNT(*) AS total_users,
        SUM(CASE WHEN role = 'tech' THEN 1 ELSE 0 END) AS tech_users,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_users
      FROM admin_users
      `,
    ).first(),
    env.DB.prepare(
      `
      SELECT action, entity_type, created_at
      FROM admin_activity_logs
      ORDER BY created_at DESC
      LIMIT 6
      `,
    ).all(),
  ]);

  return json({
    metrics: {
      registrations: registrationCounts,
      payments: paymentTotals,
      contacts: contactCount,
      sessions: sessionSnapshot,
      users: userCount,
    },
    activity: activityRows.results ?? [],
  });
}
