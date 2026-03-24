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

function generateCode() {
  return `PR-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "pricing", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const { results } = await env.DB.prepare(
    `SELECT * FROM proration_codes ORDER BY created_at DESC LIMIT 250`,
  ).all();
  return json({ codes: results ?? [] });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "pricing", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { note?: string } | null;

  let code = generateCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const exists = await env.DB.prepare(`SELECT id FROM proration_codes WHERE code = ?`).bind(code).first();
    if (!exists) break;
    code = generateCode();
  }

  const inserted = await env.DB.prepare(
    `INSERT INTO proration_codes (code, note, active, created_by_admin_email, created_at)
     VALUES (?, ?, 1, ?, datetime('now'))`,
  )
    .bind(code, body?.note?.trim() || null, admin.email)
    .run();

  return json({
    ok: true,
    code,
    id: inserted.meta?.last_row_id ?? null,
  });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "pricing", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: number; active?: number; note?: string } | null;
  if (!body?.id) return json({ error: "id is required" }, { status: 400 });

  await env.DB.prepare(
    `UPDATE proration_codes
     SET active = COALESCE(?, active),
         note = COALESCE(?, note)
     WHERE id = ?`,
  )
    .bind(typeof body.active === "number" ? body.active : null, body.note?.trim() || null, body.id)
    .run();

  return json({ ok: true });
}
