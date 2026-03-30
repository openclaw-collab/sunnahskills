import { sendMailChannelsEmail } from "../../_utils/email";
import { guardianSignInLinkEmail } from "../../_utils/emailTemplates";
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

function isLocalPreviewSite(site: string) {
  return /localhost|127\.0\.0\.1|\.local(?::\d+)?/i.test(site);
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "Something went wrong." }, { status: 500 });
  await ensureGuardianSchema(env);

  const body = (await request.json().catch(() => null)) as { email?: string; next?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) return json({ error: "Valid email is required." }, { status: 400 });

  const account = await env.DB.prepare(`SELECT id, full_name, account_number FROM guardian_accounts WHERE email = ?`)
    .bind(email)
    .first<{ id: number; full_name: string | null; account_number: string | null }>();

  if (!account?.id) {
    return json({
      ok: true,
      message: "If an account exists for that email, we’ll send a sign-in link shortly.",
    });
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
  const emailMessage = guardianSignInLinkEmail({
    fullName: account.full_name,
    accountNumber: account.account_number,
    verifyUrl,
  });

  const sent = await sendMailChannelsEmail(env, {
    to: { email, name: account.full_name ?? undefined },
    from: { email: fromEmail, name: "Sunnah Skills" },
    replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
    subject: emailMessage.subject,
    text: emailMessage.text,
    html: emailMessage.html,
  }).catch(() => false);

  if (!sent) {
    const localPreview = isLocalPreviewSite(site)
      ? {
          verifyUrl,
          accountNumber: account.account_number ?? null,
        }
      : undefined;

    return json({
      ok: true,
      emailSent: false,
      message: localPreview
        ? "We found your account. Email delivery is unavailable in local preview, so use the direct sign-in link below."
        : "We found your account, but the sign-in email could not be sent right now. Please try again shortly.",
      localPreview,
    });
  }

  return json({ ok: true, message: "If an account exists for that email, we’ll send a sign-in link shortly." });
}
