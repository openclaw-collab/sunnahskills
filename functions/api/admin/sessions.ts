import { getAdminFromRequest } from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { sessionId: number; visible?: number; status?: string }
    | null;
  if (!body?.sessionId) return json({ error: "sessionId is required" }, { status: 400 });

  await env.DB.prepare(
    `
    UPDATE program_sessions
    SET visible = COALESCE(?, visible),
        status = COALESCE(?, status)
    WHERE id = ?
    `,
  )
    .bind(body.visible ?? null, body.status ?? null, body.sessionId)
    .run();

  return json({ ok: true });
}

