import { sendMailChannelsEmail } from "../../_utils/email";
import { ensureGuardianSchema, hashToken } from "../../_utils/guardianAuth";

interface Env {
  DB: D1Database;
  EMAIL_FROM?: string;
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

  const body = (await request.json().catch(() => null)) as { email?: string; next?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "Valid email is required." }, { status: 400 });

  const account = await env.DB.prepare(`SELECT id, full_name FROM guardian_accounts WHERE email = ?`)
    .bind(email)
    .first<{ id: number; full_name: string | null }>();

  if (!account?.id) {
    return json({ ok: true, message: "If we find an account, we sent a sign-in link." });
  }

  const rawToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await env.DB.prepare(
    `INSERT INTO guardian_magic_tokens (token_hash, guardian_account_id, expires_at, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
  )
    .bind(tokenHash, account.id, expiresAt.toISOString())
    .run();

  const site = env.SITE_URL ?? "http://localhost:8788";
  const next = typeof body?.next === "string" && body.next.startsWith("/") ? body.next : "/register";
  const verifyUrl = `${site.replace(/\/$/, "")}/api/guardian/verify?token=${encodeURIComponent(rawToken)}&next=${encodeURIComponent(next)}`;
  const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";

  await sendMailChannelsEmail(env, {
    to: { email, name: account.full_name ?? undefined },
    from: { email: fromEmail, name: "Sunnah Skills" },
    subject: "Your Sunnah Skills sign-in link",
    text: `Open this link to sign in: ${verifyUrl}`,
    html: `<p><a href="${verifyUrl}">Sign in to Sunnah Skills</a></p><p>This link expires in 30 minutes.</p>`,
  }).catch(() => {});

  return json({ ok: true, message: "If we find an account, we sent a sign-in link." });
}
