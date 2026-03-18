/**
 * POST /api/studio/sessions  — create a new shared studio session
 * Returns { id, shareUrl, name, protected }
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
      ...(init?.headers ?? {}),
    },
  });
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    password?: string;
  } | null;

  const id = uuidv4();
  const name = body?.name?.trim() || null;
  const password = body?.password?.trim() || null;
  const isProtected = password ? 1 : 0;
  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  await env.DB.prepare(
    `INSERT INTO studio_sessions (id, name, protected, password_hash, theme_preset_id, edits_json, comments_json, uploads_json)
     VALUES (?, ?, ?, ?, 'brand', '[]', '[]', '[]')`,
  )
    .bind(id, name, isProtected, passwordHash)
    .run();

  const origin = new URL(request.url).origin;
  const shareUrl = `${origin}/?studio=${id}`;

  return json({ id, shareUrl, name, protected: isProtected === 1 }, { status: 201 });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS" },
  });
}
