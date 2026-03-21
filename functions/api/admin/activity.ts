import { ensureAdminSecuritySchema, getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

type ActivityRow = {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details_json: string | null;
  created_at: string | null;
  actor_name: string | null;
  actor_email: string | null;
  subject_name: string | null;
  subject_email: string | null;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function parseDetails(value: string | null) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  await ensureAdminSecuritySchema(env);

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "users", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const rows = (await env.DB.prepare(
    `
    SELECT
      l.id,
      l.action,
      l.entity_type,
      l.entity_id,
      l.details_json,
      l.created_at,
      actor.name AS actor_name,
      actor.email AS actor_email,
      subject.name AS subject_name,
      subject.email AS subject_email
    FROM admin_activity_logs l
    LEFT JOIN admin_users actor ON actor.id = l.actor_admin_user_id
    LEFT JOIN admin_users subject ON subject.id = l.subject_admin_user_id
    ORDER BY l.created_at DESC
    LIMIT 200
    `,
  ).all()).results as ActivityRow[] | undefined;

  return json({
    activity: (rows ?? []).map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: parseDetails(row.details_json),
      createdAt: row.created_at,
      actor: {
        name: row.actor_name,
        email: row.actor_email,
      },
      subject: {
        name: row.subject_name,
        email: row.subject_email,
      },
    })),
  });
}
