import { sendMailChannelsEmail } from "../../_utils/email";
import {
  createGuardianSession,
  ensureGuardianSchema,
  generateAccountNumber,
  hashToken,
} from "../../_utils/guardianAuth";

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

  const body = (await request.json().catch(() => null)) as {
    email?: string;
    fullName?: string;
    phone?: string;
  } | null;

  const email = body?.email?.trim().toLowerCase();
  const fullName = body?.fullName?.trim() ?? "";
  const phone = body?.phone?.trim() ?? "";
  if (!email || !email.includes("@")) return json({ error: "Valid email is required." }, { status: 400 });
  if (fullName.length < 2) return json({ error: "Name is required." }, { status: 400 });

  const existing = await env.DB.prepare(`SELECT id FROM guardian_accounts WHERE email = ?`).bind(email).first();
  if (existing?.id) {
    return json({ error: "An account with this email already exists. Request a sign-in link instead." }, { status: 409 });
  }

  let accountNumber = generateAccountNumber();
  for (let attempt = 0; attempt < 8; attempt++) {
    const clash = await env.DB.prepare(`SELECT id FROM guardian_accounts WHERE account_number = ?`)
      .bind(accountNumber)
      .first();
    if (!clash) break;
    accountNumber = generateAccountNumber();
  }

  const ins = await env.DB.prepare(
    `INSERT INTO guardian_accounts (email, account_number, full_name, phone, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
  )
    .bind(email, accountNumber, fullName, phone || null)
    .run();

  const accountId = ins.meta?.last_row_id;
  if (!accountId) return json({ error: "Something went wrong." }, { status: 500 });

  const rawToken = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const tokenHash = await hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await env.DB.prepare(
    `INSERT INTO guardian_magic_tokens (token_hash, guardian_account_id, expires_at, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
  )
    .bind(tokenHash, accountId, expiresAt.toISOString())
    .run();

  const site = env.SITE_URL ?? "http://localhost:8788";
  const verifyUrl = `${site.replace(/\/$/, "")}/api/guardian/verify?token=${encodeURIComponent(rawToken)}`;
  const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";

  await sendMailChannelsEmail(env, {
    to: { email, name: fullName },
    from: { email: fromEmail, name: "Sunnah Skills" },
    subject: "Confirm your Sunnah Skills account",
    text: `Welcome! Your account number is ${accountNumber}. Open this link to sign in: ${verifyUrl}`,
    html: `<p>Welcome!</p><p><strong>Your Sunnah Skills account number:</strong> ${accountNumber}</p><p><a href="${verifyUrl}">Sign in to your account</a></p><p>This link expires in 30 minutes.</p>`,
  }).catch(() => {});

  return json({ ok: true, accountNumber, message: "Check your email for a sign-in link." });
}
