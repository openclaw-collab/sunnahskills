import { parseCookieHeader, serializeCookie } from "./cookies";

export type AdminRole = "tech" | "admin";
export type AdminPermissionLevel = "none" | "read" | "write";
export type AdminPermissionKey =
  | "dashboard"
  | "registrations"
  | "payments"
  | "discounts"
  | "pricing"
  | "sessions"
  | "contacts"
  | "sequences"
  | "exports"
  | "users";

export type AdminPermissions = Record<AdminPermissionKey, AdminPermissionLevel>;

export type AdminSession = {
  adminUserId: number;
  token: string;
  expiresAtIso: string;
};

export const ADMIN_PERMISSION_KEYS: AdminPermissionKey[] = [
  "dashboard",
  "registrations",
  "payments",
  "discounts",
  "pricing",
  "sessions",
  "contacts",
  "sequences",
  "exports",
  "users",
];

export function getDefaultPermissionsForRole(role: AdminRole): AdminPermissions {
  if (role === "tech") {
    return Object.fromEntries(ADMIN_PERMISSION_KEYS.map((key) => [key, "write"])) as AdminPermissions;
  }

  return {
    dashboard: "read",
    registrations: "write",
    payments: "write",
    discounts: "write",
    pricing: "write",
    sessions: "write",
    contacts: "read",
    sequences: "write",
    exports: "read",
    users: "none",
  };
}

export function normalizePermissions(raw: unknown, role: AdminRole): AdminPermissions {
  const base = getDefaultPermissionsForRole(role);
  if (!raw || typeof raw !== "object") return base;

  const result = { ...base };
  for (const key of ADMIN_PERMISSION_KEYS) {
    const value = (raw as Record<string, unknown>)[key];
    if (value === "none" || value === "read" || value === "write") {
      result[key] = value;
    }
  }
  return result;
}

export async function ensureAdminSecuritySchema(env: { DB: D1Database }) {
  const statements = [
    `ALTER TABLE admin_users ADD COLUMN status TEXT DEFAULT 'active'`,
    `ALTER TABLE admin_users ADD COLUMN permissions_json TEXT DEFAULT '{}'`,
    `ALTER TABLE admin_users ADD COLUMN disabled_at DATETIME`,
    `CREATE TABLE IF NOT EXISTS admin_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_admin_user_id INTEGER REFERENCES admin_users(id),
      subject_admin_user_id INTEGER REFERENCES admin_users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_actor ON admin_activity_logs(actor_admin_user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_subject ON admin_activity_logs(subject_admin_user_id)`,
  ];

  for (const statement of statements) {
    try {
      await env.DB.prepare(statement).run();
    } catch {
      // Ignore duplicate-column and already-exists errors to keep this idempotent.
    }
  }
}

export async function logAdminActivity(
  env: { DB: D1Database },
  input: {
    actorAdminUserId?: number | null;
    subjectAdminUserId?: number | null;
    action: string;
    entityType: string;
    entityId?: string | number | null;
    details?: Record<string, unknown>;
  },
) {
  await ensureAdminSecuritySchema(env);
  await env.DB.prepare(
    `
    INSERT INTO admin_activity_logs (
      actor_admin_user_id,
      subject_admin_user_id,
      action,
      entity_type,
      entity_id,
      details_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
  )
    .bind(
      input.actorAdminUserId ?? null,
      input.subjectAdminUserId ?? null,
      input.action,
      input.entityType,
      input.entityId != null ? String(input.entityId) : null,
      JSON.stringify(input.details ?? {}),
    )
    .run();
}

export function hasAdminPermission(
  admin: { role: string; permissions?: AdminPermissions | null },
  key: AdminPermissionKey,
  required: "read" | "write" = "read",
) {
  if (admin.role === "tech") return true;
  const level = admin.permissions?.[key] ?? getDefaultPermissionsForRole("admin")[key];
  if (required === "read") return level === "read" || level === "write";
  return level === "write";
}

export async function createAdminSession(
  env: { DB: D1Database; SITE_URL?: string },
  adminUserId: number,
) {
  await ensureAdminSecuritySchema(env);

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await env.DB.prepare(
    `INSERT INTO admin_sessions (admin_user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
  )
    .bind(adminUserId, token, expiresAt.toISOString())
    .run();

  const isHttps = env.SITE_URL?.startsWith("https://") ?? false;
  const cookie = serializeCookie("admin_session", token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { token, expiresAtIso: expiresAt.toISOString(), cookie };
}

export async function getAdminFromRequest(env: { DB: D1Database }, request: Request) {
  await ensureAdminSecuritySchema(env);
  const cookies = parseCookieHeader(request.headers.get("Cookie"));
  const token = cookies["admin_session"];
  if (!token) return null;

  const row = await env.DB.prepare(
    `
    SELECT s.admin_user_id as admin_user_id, s.expires_at as expires_at,
           u.email as email, u.name as name, u.role as role,
           u.status as status, u.permissions_json as permissions_json
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
  if (row.status && String(row.status) !== "active") {
    await env.DB.prepare(`DELETE FROM admin_sessions WHERE token = ?`).bind(token).run();
    return null;
  }

  const role = (row.role ? String(row.role) : "admin") as AdminRole;
  const permissions = normalizePermissions(
    row.permissions_json ? JSON.parse(String(row.permissions_json)) : null,
    role,
  );

  return {
    adminUserId: Number(row.admin_user_id),
    email: String(row.email),
    name: row.name ? String(row.name) : null,
    role,
    status: row.status ? String(row.status) : "active",
    permissions,
  };
}

export function clearAdminSessionCookie() {
  return serializeCookie("admin_session", "", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}
