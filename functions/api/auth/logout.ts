import { clearAdminSessionCookie, ensureAdminSecuritySchema, getAdminFromRequest, logAdminActivity } from "../../_utils/adminAuth";
import { parseCookieHeader } from "../../_utils/cookies";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  await ensureAdminSecuritySchema(env);

  const admin = await getAdminFromRequest(env, request);
  const token = parseCookieHeader(request.headers.get("Cookie"))["admin_session"];
  if (token) {
    await env.DB.prepare(`DELETE FROM admin_sessions WHERE token = ?`).bind(token).run();
  }
  if (admin) {
    await logAdminActivity(env, {
      actorAdminUserId: admin.adminUserId,
      subjectAdminUserId: admin.adminUserId,
      action: "auth.logout",
      entityType: "session",
      entityId: token,
      details: { email: admin.email },
    });
  }

  return json({ ok: true }, { headers: { "Set-Cookie": clearAdminSessionCookie() } });
}
