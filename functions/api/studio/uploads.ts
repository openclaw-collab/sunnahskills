/**
 * POST /api/studio/uploads?session=SESSION_ID&slot=SLOT_KEY
 *
 * Accepts multipart/form-data with a "file" field.
 * When R2 is bound (env.STUDIO_UPLOADS), stores there and returns a proxy URL.
 * Without R2, returns the raw base64 data URL (fine for small images in dev).
 *
 * Max file size enforced: 5 MB
 */

const MAX_BYTES = 5 * 1024 * 1024;

interface Env {
  DB: D1Database;
  STUDIO_UPLOADS?: R2Bucket;
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

function genId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session") ?? "";
  const slotKey = url.searchParams.get("slot") ?? "default";
  const route = url.searchParams.get("route") ?? "/";
  const author = url.searchParams.get("author") ?? undefined;

  if (!sessionId) return json({ error: "Missing session param" }, { status: 400 });

  const session = await env.DB.prepare(`SELECT id, protected FROM studio_sessions WHERE id = ?`)
    .bind(sessionId)
    .first<{ id: string; protected: number }>();

  if (!session) return json({ error: "Session not found" }, { status: 404 });

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) return json({ error: "Missing file field" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) {
    return json({ error: "File too large (max 5 MB)" }, { status: 413 });
  }

  const id = genId();
  let fileUrl: string;

  if (env.STUDIO_UPLOADS) {
    // Store in R2
    const key = `studio/${sessionId}/${slotKey}/${file.name}`;
    await env.STUDIO_UPLOADS.put(key, bytes, { httpMetadata: { contentType: file.type } });
    const origin = new URL(request.url).origin;
    fileUrl = `${origin}/api/studio/image/${sessionId}/${encodeURIComponent(slotKey)}`;
  } else {
    // Fallback: base64 data URL (small images only)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
    fileUrl = `data:${file.type};base64,${base64}`;
  }

  const uploadEntry = {
    id,
    route,
    slotKey,
    url: fileUrl,
    filename: file.name,
    createdAt: new Date().toISOString(),
    author,
  };

  // Append to uploads_json
  const existing = await env.DB.prepare(`SELECT uploads_json FROM studio_sessions WHERE id = ?`)
    .bind(sessionId)
    .first<{ uploads_json: string }>();

  const uploads = JSON.parse(existing?.uploads_json ?? "[]") as unknown[];
  // Replace any existing upload for the same slotKey
  const next = [...uploads.filter((u: any) => u.slotKey !== slotKey), uploadEntry];

  await env.DB.prepare(`UPDATE studio_sessions SET uploads_json = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(JSON.stringify(next), sessionId)
    .run();

  return json({ ok: true, upload: uploadEntry });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
