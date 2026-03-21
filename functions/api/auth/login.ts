import bcrypt from "bcryptjs";
import { createAdminSession, ensureAdminSecuritySchema, logAdminActivity, normalizePermissions } from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
  SITE_URL?: string;
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
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  if (!email || password.length < 8) return json({ error: "Invalid credentials" }, { status: 400 });

  const user = await env.DB.prepare(
    `SELECT id, email, password_hash, name, role, status, permissions_json FROM admin_users WHERE email = ?`,
  )
    .bind(email)
    .first();
  if (!user?.id) return json({ error: "Invalid credentials" }, { status: 401 });
  if (user.status && String(user.status) !== "active") {
    return json({ error: "This account is disabled" }, { status: 403 });
  }

  const ok = await bcrypt.compare(password, String(user.password_hash));
  if (!ok) return json({ error: "Invalid credentials" }, { status: 401 });

  await env.DB.prepare(`UPDATE admin_users SET last_login = datetime('now') WHERE id = ?`).bind(user.id).run();

  const session = await createAdminSession(env, Number(user.id));
  const role = (user.role ?? "admin") as "tech" | "admin";
  const permissions = normalizePermissions(
    user.permissions_json ? JSON.parse(String(user.permissions_json)) : null,
    role,
  );

  await logAdminActivity(env, {
    actorAdminUserId: Number(user.id),
    subjectAdminUserId: Number(user.id),
    action: "auth.login",
    entityType: "session",
    entityId: session.token,
    details: { email: user.email, role },
  });

  return json(
    { ok: true, user: { email: user.email, name: user.name ?? null, role, permissions } },
    { status: 200, headers: { "Set-Cookie": session.cookie } },
  );
}
