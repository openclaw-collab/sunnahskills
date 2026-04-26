import { clearGuardianSessionCookie } from "../../_utils/guardianAuth";
import { parseCookieHeader } from "../../_utils/cookies";

interface Env {
  DB: D1Database;
  SITE_URL?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
  const token = cookies["guardian_session"];
  if (token && env.DB) {
    await env.DB.prepare(`DELETE FROM guardian_sessions WHERE token = ?`).bind(token).run();
  }
  const cookie = clearGuardianSessionCookie(env);
  return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
