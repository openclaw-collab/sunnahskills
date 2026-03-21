import bcrypt from "bcryptjs";
import {
  ADMIN_PERMISSION_KEYS,
  ensureAdminSecuritySchema,
  getAdminFromRequest,
  getDefaultPermissionsForRole,
  hasAdminPermission,
  logAdminActivity,
  normalizePermissions,
  type AdminPermissions,
  type AdminRole,
} from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

type AdminUserRow = {
  id: number;
  email: string;
  name: string | null;
  role: string | null;
  status: string | null;
  permissions_json: string | null;
  last_login: string | null;
  created_at: string | null;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function safeParsePermissions(value: string | null, role: AdminRole) {
  try {
    return normalizePermissions(value ? JSON.parse(value) : null, role);
  } catch {
    return getDefaultPermissionsForRole(role);
  }
}

function mapUser(row: AdminUserRow) {
  const role = (row.role ?? "admin") as AdminRole;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role,
    status: row.status ?? "active",
    permissions: safeParsePermissions(row.permissions_json, role),
    lastLogin: row.last_login,
    createdAt: row.created_at,
  };
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  await ensureAdminSecuritySchema(env);

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "users", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const rows = (await env.DB.prepare(
    `
    SELECT id, email, name, role, status, permissions_json, last_login, created_at
    FROM admin_users
    ORDER BY
      CASE role WHEN 'tech' THEN 0 ELSE 1 END,
      created_at ASC
    `,
  ).all()).results as AdminUserRow[] | undefined;

  return json({ users: (rows ?? []).map(mapUser) });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  await ensureAdminSecuritySchema(env);

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "users", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | {
        id?: number;
        email?: string;
        name?: string;
        role?: AdminRole;
        status?: "active" | "disabled";
        password?: string;
        permissions?: Partial<AdminPermissions>;
      }
    | null;

  const email = body?.email?.trim().toLowerCase();
  const role = (body?.role ?? "admin") as AdminRole;
  const status = body?.status === "disabled" ? "disabled" : "active";

  if (!email) return json({ error: "Email is required" }, { status: 400 });
  if (role !== "admin" && role !== "tech") return json({ error: "Role must be tech or admin" }, { status: 400 });

  const permissions = normalizePermissions(body?.permissions ?? {}, role);
  if (role === "tech") {
    for (const key of ADMIN_PERMISSION_KEYS) permissions[key] = "write";
  }

  if (body?.id) {
    const existing = await env.DB.prepare(`SELECT id, email, role FROM admin_users WHERE id = ?`).bind(body.id).first();
    if (!existing?.id) return json({ error: "User not found" }, { status: 404 });
    if (Number(existing.id) === admin.adminUserId && status !== "active") {
      return json({ error: "You cannot disable your own account" }, { status: 400 });
    }

    if (body.password && body.password.length < 8) {
      return json({ error: "Passwords must be at least 8 characters" }, { status: 400 });
    }

    const passwordHash = body.password ? bcrypt.hashSync(body.password, 10) : null;
    await env.DB.prepare(
      `
      UPDATE admin_users
      SET email = ?, name = ?, role = ?, status = ?, permissions_json = ?, disabled_at = ?, password_hash = COALESCE(?, password_hash)
      WHERE id = ?
      `,
    )
      .bind(
        email,
        body.name?.trim() || null,
        role,
        status,
        JSON.stringify(permissions),
        status === "disabled" ? new Date().toISOString() : null,
        passwordHash,
        body.id,
      )
      .run();

    await logAdminActivity(env, {
      actorAdminUserId: admin.adminUserId,
      subjectAdminUserId: body.id,
      action: "admin_user.updated",
      entityType: "admin_user",
      entityId: body.id,
      details: { email, role, status, permissions },
    });

    return json({ ok: true });
  }

  if (!body?.password || body.password.length < 8) {
    return json({ error: "A password of at least 8 characters is required for new users" }, { status: 400 });
  }

  const passwordHash = bcrypt.hashSync(body.password, 10);
  const result = await env.DB.prepare(
    `
    INSERT INTO admin_users (email, password_hash, name, role, status, permissions_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
  )
    .bind(email, passwordHash, body.name?.trim() || null, role, status, JSON.stringify(permissions))
    .run();

  const newId = Number(result.meta.last_row_id);
  await logAdminActivity(env, {
    actorAdminUserId: admin.adminUserId,
    subjectAdminUserId: newId,
    action: "admin_user.created",
    entityType: "admin_user",
    entityId: newId,
    details: { email, role, status, permissions },
  });

  return json({ ok: true, id: newId });
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  await ensureAdminSecuritySchema(env);

  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "users", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id)) return json({ error: "User id is required" }, { status: 400 });
  if (id === admin.adminUserId) return json({ error: "You cannot delete your own account" }, { status: 400 });

  const existing = await env.DB.prepare(`SELECT id, email FROM admin_users WHERE id = ?`).bind(id).first();
  if (!existing?.id) return json({ error: "User not found" }, { status: 404 });

  await env.DB.prepare(`DELETE FROM admin_activity_logs WHERE actor_admin_user_id = ? OR subject_admin_user_id = ?`).bind(id, id).run();
  await env.DB.prepare(`DELETE FROM admin_sessions WHERE admin_user_id = ?`).bind(id).run();

  await logAdminActivity(env, {
    actorAdminUserId: admin.adminUserId,
    subjectAdminUserId: null,
    action: "admin_user.deleted",
    entityType: "admin_user",
    entityId: id,
    details: { email: existing.email },
  });

  await env.DB.prepare(`DELETE FROM admin_users WHERE id = ?`).bind(id).run();

  return json({ ok: true });
}
