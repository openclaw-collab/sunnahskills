import { createGuardianSession, ensureGuardianSchema, hashToken } from "../../_utils/guardianAuth";

interface Env {
  DB: D1Database;
  SITE_URL?: string;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return new Response("Server error", { status: 500 });
  await ensureGuardianSchema(env);

  const url = new URL(request.url);
  const raw = url.searchParams.get("token") ?? "";
  const next = url.searchParams.get("next") ?? "/register";
  const safeNext = next.startsWith("/") ? next : "/register";
  if (raw.length < 20) {
    return Response.redirect(`${env.SITE_URL ?? "http://localhost:5173"}/register?error=invalid_link`, 302);
  }

  const tokenHash = await hashToken(raw);
  const row = await env.DB.prepare(
    `SELECT t.id as tid, t.guardian_account_id as aid, t.used_at, t.expires_at
     FROM guardian_magic_tokens t
     WHERE t.token_hash = ?
     LIMIT 1`,
  )
    .bind(tokenHash)
    .first<{ tid: number; aid: number; used_at: string | null; expires_at: string }>();

  const site = env.SITE_URL ?? "http://localhost:5173";
  const fail = `${site.replace(/\/$/, "")}/register?error=link_used_or_expired`;

  if (!row) return Response.redirect(fail, 302);
  if (row.used_at) return Response.redirect(fail, 302);
  const exp = Date.parse(String(row.expires_at));
  if (!Number.isFinite(exp) || Date.now() > exp) return Response.redirect(fail, 302);

  await env.DB.prepare(`UPDATE guardian_magic_tokens SET used_at = datetime('now') WHERE id = ?`).bind(row.tid).run();

  const session = await createGuardianSession(env, Number(row.aid));
  const ok = `${site.replace(/\/$/, "")}${safeNext}${safeNext.includes("?") ? "&" : "?"}signed_in=1`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: ok,
      "Set-Cookie": session.cookie,
    },
  });
}
