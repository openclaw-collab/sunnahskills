import { getGuardianFromRequest } from "../../_utils/guardianAuth";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "Server error" }, { status: 500 });
  const g = await getGuardianFromRequest(env, request);
  if (!g) return json({ authenticated: false }, { status: 200 });
  return json({
    authenticated: true,
    email: g.email,
    accountNumber: g.accountNumber,
    fullName: g.fullName,
    phone: g.phone,
  });
}
