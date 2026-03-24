import { parseCookieHeader } from "../../../../_utils/cookies";

interface Env {
  DB: D1Database;
  STUDIO_UPLOADS?: R2Bucket;
}

type StudioUploadEntry = {
  id: string;
  slotKey: string;
  url: string;
  storageKey?: string;
};

function isAuthed(request: Request, sessionId: string) {
  const cookies = parseCookieHeader(request.headers.get("Cookie") ?? request.headers.get("cookie") ?? "");
  return cookies[`studio_auth_${sessionId}`] === "1";
}

export async function onRequestGet({
  request,
  params,
  env,
}: {
  request: Request;
  params: { sessionId: string; slotKey: string };
  env: Env;
}) {
  if (!env.DB) return new Response("DB not configured", { status: 500 });
  if (!env.STUDIO_UPLOADS) return new Response("Uploads bucket not configured", { status: 503 });

  const session = await env.DB.prepare(`SELECT protected, uploads_json FROM studio_sessions WHERE id = ?`)
    .bind(params.sessionId)
    .first<{ protected: number; uploads_json: string | null }>();

  if (!session) return new Response("Session not found", { status: 404 });
  if (session.protected === 1 && !isAuthed(request, params.sessionId)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const uploads = JSON.parse(session.uploads_json ?? "[]") as StudioUploadEntry[];
  const upload = uploads.find((entry) => entry.slotKey === params.slotKey);

  if (!upload?.storageKey) {
    return new Response("Upload not found", { status: 404 });
  }

  const object = await env.STUDIO_UPLOADS.get(upload.storageKey);
  if (!object) return new Response("Upload not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=3600");
  headers.set("ETag", object.httpEtag);

  return new Response(object.body, { headers });
}
