import { parseCookieHeader, serializeCookie } from "./cookies";

export type AdminSession = {
  adminUserId: number;
  token: string;
  expiresAtIso: string;
};

export async function createAdminSession(env: { DB: D1Database }, adminUserId: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await env.DB.prepare(
    `INSERT INTO admin_sessions (admin_user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
  )
    .bind(adminUserId, token, expiresAt.toISOString())
    .run();

  const cookie = serializeCookie("admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { token, expiresAtIso: expiresAt.toISOString(), cookie };
}

export async function getAdminFromRequest(env: { DB: D1Database }, request: Request) {
  const cookies = parseCookieHeader(request.headers.get("Cookie"));
  const token = cookies["admin_session"];
  if (!token) return null;

  const row = await env.DB.prepare(
    `
    SELECT s.admin_user_id as admin_user_id, s.expires_at as expires_at,
           u.email as email, u.name as name, u.role as role
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.admin_user_id
    WHERE s.token = ?
    LIMIT 1
    `,
  )
    .bind(token)
    .first();

  if (!row) return null;
  const expiresAt = Date.parse(String(row.expires_at));
  if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
    await env.DB.prepare(`DELETE FROM admin_sessions WHERE token = ?`).bind(token).run();
    return null;
  }

  return {
    adminUserId: Number(row.admin_user_id),
    email: String(row.email),
    name: row.name ? String(row.name) : null,
    role: row.role ? String(row.role) : "admin",
  };
}

export function clearAdminSessionCookie() {
  return serializeCookie("admin_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}

