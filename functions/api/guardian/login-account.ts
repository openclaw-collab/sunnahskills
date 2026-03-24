import { createGuardianSession, ensureGuardianSchema } from "../../_utils/guardianAuth";

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
  if (!env.DB) return json({ error: "Something went wrong." }, { status: 500 });
  await ensureGuardianSchema(env);

  const body = (await request.json().catch(() => null)) as { accountNumber?: string } | null;
  const raw = String(body?.accountNumber ?? "").replace(/\D/g, "");
  if (raw.length < 10 || raw.length > 12) {
    return json({ error: "Enter a valid account number." }, { status: 400 });
  }

  const account = await env.DB.prepare(`SELECT id FROM guardian_accounts WHERE account_number = ?`)
    .bind(raw)
    .first<{ id: number }>();

  if (!account?.id) return json({ error: "Account not found." }, { status: 404 });

  const session = await createGuardianSession(env, Number(account.id));
  return json({ ok: true }, { headers: { "Set-Cookie": session.cookie } });
}
