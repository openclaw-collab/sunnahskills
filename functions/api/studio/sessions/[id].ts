/**
 * GET  /api/studio/sessions/:id  — fetch full session state
 * PATCH /api/studio/sessions/:id — update edits/comments/theme (full state replace)
 * POST  /api/studio/sessions/:id — authenticate (set cookie) if session is protected
 */
import bcrypt from "bcryptjs";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
      ...(init?.headers ?? {}),
    },
  });
}

function cors() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function parseSession(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name ?? null,
    protected: row.protected === 1,
    themePresetId: row.theme_preset_id ?? "brand",
    customTheme: row.custom_theme_json ? JSON.parse(String(row.custom_theme_json)) : null,
    edits: row.edits_json ? JSON.parse(String(row.edits_json)) : [],
    comments: row.comments_json ? JSON.parse(String(row.comments_json)) : [],
    uploads: row.uploads_json ? JSON.parse(String(row.uploads_json)) : [],
  };
}

function isAuthed(request: Request, sessionId: string): boolean {
  const cookie = request.headers.get("Cookie") ?? "";
  return cookie.includes(`studio_auth_${sessionId}=1`);
}

export async function onRequestGet({ request, params, env }: { request: Request; params: { id: string }; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const row = await env.DB.prepare(`SELECT * FROM studio_sessions WHERE id = ?`)
    .bind(params.id)
    .first<Record<string, unknown>>();

  if (!row) return json({ error: "Session not found" }, { status: 404 });

  if (row.protected === 1 && !isAuthed(request, params.id)) {
    return json({ id: params.id, protected: true }, { status: 401 });
  }

  return json(parseSession(row));
}

export async function onRequestPatch({
  request,
  params,
  env,
}: {
  request: Request;
  params: { id: string };
  env: Env;
}) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const row = await env.DB.prepare(`SELECT id, protected FROM studio_sessions WHERE id = ?`)
    .bind(params.id)
    .first<Record<string, unknown>>();

  if (!row) return json({ error: "Session not found" }, { status: 404 });

  if (row.protected === 1 && !isAuthed(request, params.id)) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    themePresetId?: string;
    customTheme?: unknown;
    edits?: unknown[];
    comments?: unknown[];
    uploads?: unknown[];
    name?: string;
  } | null;

  if (!body) return json({ error: "Invalid body" }, { status: 400 });

  await env.DB.prepare(
    `UPDATE studio_sessions SET
       theme_preset_id = COALESCE(?, theme_preset_id),
       custom_theme_json = COALESCE(?, custom_theme_json),
       edits_json = COALESCE(?, edits_json),
       comments_json = COALESCE(?, comments_json),
       uploads_json = COALESCE(?, uploads_json),
       name = COALESCE(?, name),
       updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(
      body.themePresetId ?? null,
      body.customTheme ? JSON.stringify(body.customTheme) : null,
      body.edits ? JSON.stringify(body.edits) : null,
      body.comments ? JSON.stringify(body.comments) : null,
      body.uploads ? JSON.stringify(body.uploads) : null,
      body.name ?? null,
      params.id,
    )
    .run();

  const updated = await env.DB.prepare(`SELECT * FROM studio_sessions WHERE id = ?`)
    .bind(params.id)
    .first<Record<string, unknown>>();

  return json(parseSession(updated!));
}

export async function onRequestPost({
  request,
  params,
  env,
}: {
  request: Request;
  params: { id: string };
  env: Env;
}) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const row = await env.DB.prepare(`SELECT id, protected, password_hash FROM studio_sessions WHERE id = ?`)
    .bind(params.id)
    .first<Record<string, unknown>>();

  if (!row) return json({ error: "Session not found" }, { status: 404 });

  if (!row.protected) {
    // Not protected — auto-auth
    const cookie = `studio_auth_${params.id}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
    return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
  }

  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password) return json({ error: "Password required" }, { status: 400 });

  const ok = await bcrypt.compare(body.password, String(row.password_hash));
  if (!ok) return json({ error: "Incorrect password" }, { status: 401 });

  const cookie = `studio_auth_${params.id}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
  return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}

export async function onRequestOptions() {
  return cors();
}
