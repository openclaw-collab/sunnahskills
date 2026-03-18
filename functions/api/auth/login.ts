import bcrypt from "bcryptjs";
import { createAdminSession } from "../../_utils/adminAuth";

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
  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? "";
  if (!email || password.length < 8) return json({ error: "Invalid credentials" }, { status: 400 });

  const user = await env.DB.prepare(`SELECT id, email, password_hash, name, role FROM admin_users WHERE email = ?`)
    .bind(email)
    .first();
  if (!user?.id) return json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await bcrypt.compare(password, String(user.password_hash));
  if (!ok) return json({ error: "Invalid credentials" }, { status: 401 });

  await env.DB.prepare(`UPDATE admin_users SET last_login = datetime('now') WHERE id = ?`).bind(user.id).run();

  const session = await createAdminSession(env, Number(user.id));

  return json(
    { ok: true, user: { email: user.email, name: user.name ?? null, role: user.role ?? "admin" } },
    { status: 200, headers: { "Set-Cookie": session.cookie } },
  );
}

