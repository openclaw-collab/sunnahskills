import { clearGuardianSessionCookie } from "../../_utils/guardianAuth";

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
  const cookie = clearGuardianSessionCookie(env);
  return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
