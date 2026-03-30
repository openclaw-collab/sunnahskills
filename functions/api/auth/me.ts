import { getAdminFromRequest, ensureAdminSecuritySchema, logAdminActivity } from "../../_utils/adminAuth";

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
  if (!admin) return json({ ok: false }, { status: 401 });

  await logAdminActivity(env, {
    actorAdminUserId: admin.adminUserId,
    subjectAdminUserId: admin.adminUserId,
    action: "auth.me",
    entityType: "session",
    entityId: String(admin.adminUserId),
    details: { email: admin.email },
  });

  return json({ ok: true, user: admin });
}

