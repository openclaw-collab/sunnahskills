import { parseCookieHeader, serializeCookie } from "./cookies";

export type GuardianSessionUser = {
  guardianAccountId: number;
  email: string;
  accountNumber: string;
  fullName: string | null;
};

const COOKIE_NAME = "guardian_session";
const SESSION_DAYS = 14;

export async function ensureGuardianSchema(env: { DB: D1Database }) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS guardian_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      account_number TEXT NOT NULL UNIQUE,
      full_name TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_guardian_accounts_account_number ON guardian_accounts(account_number)`,
    `CREATE TABLE IF NOT EXISTS guardian_magic_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_hash TEXT NOT NULL,
      guardian_account_id INTEGER NOT NULL REFERENCES guardian_accounts(id),
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_guardian_magic_tokens_hash ON guardian_magic_tokens(token_hash)`,
    `CREATE TABLE IF NOT EXISTS guardian_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guardian_account_id INTEGER NOT NULL REFERENCES guardian_accounts(id),
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_guardian_sessions_token ON guardian_sessions(token)`,
    `CREATE TABLE IF NOT EXISTS saved_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guardian_account_id INTEGER NOT NULL REFERENCES guardian_accounts(id),
      full_name TEXT NOT NULL,
      date_of_birth TEXT,
      gender TEXT,
      medical_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];
  for (const sql of statements) {
    await env.DB.prepare(sql).run().catch(() => {});
  }
}

/** 11-digit numeric account number (plan: 10–12 digits). */
export function generateAccountNumber(): string {
  let s = "";
  for (let i = 0; i < 11; i++) s += String(Math.floor(Math.random() * 10));
  if (s[0] === "0") s = "1" + s.slice(1);
  return s;
}

export async function hashToken(raw: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createGuardianSession(
  env: { DB: D1Database; SITE_URL?: string },
  guardianAccountId: number,
) {
  await ensureGuardianSchema(env);
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await env.DB.prepare(
    `INSERT INTO guardian_sessions (guardian_account_id, token, expires_at, created_at)
     VALUES (?, ?, ?, datetime('now'))`,
  )
    .bind(guardianAccountId, token, expiresAt.toISOString())
    .run();

  const isHttps = env.SITE_URL?.startsWith("https://") ?? false;
  const cookie = serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return { token, expiresAtIso: expiresAt.toISOString(), cookie };
}

export async function getGuardianFromRequest(
  env: { DB: D1Database },
  request: Request,
): Promise<GuardianSessionUser | null> {
  await ensureGuardianSchema(env);
  const cookies = parseCookieHeader(request.headers.get("Cookie") ?? request.headers.get("cookie") ?? "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT s.guardian_account_id as aid, s.expires_at as exp,
            a.email as email, a.account_number as account_number, a.full_name as full_name
     FROM guardian_sessions s
     JOIN guardian_accounts a ON a.id = s.guardian_account_id
     WHERE s.token = ?
     LIMIT 1`,
  )
    .bind(token)
    .first<{ aid: number; exp: string; email: string; account_number: string; full_name: string | null }>();

  if (!row) return null;
  const exp = Date.parse(String(row.exp));
  if (Number.isFinite(exp) && Date.now() > exp) {
    await env.DB.prepare(`DELETE FROM guardian_sessions WHERE token = ?`).bind(token).run();
    return null;
  }

  return {
    guardianAccountId: Number(row.aid),
    email: String(row.email),
    accountNumber: String(row.account_number),
    fullName: row.full_name != null ? String(row.full_name) : null,
  };
}

export function clearGuardianSessionCookie(env: { SITE_URL?: string }) {
  const isHttps = env.SITE_URL?.startsWith("https://") ?? false;
  return serializeCookie(COOKIE_NAME, "", {
    httpOnly: true,
    secure: isHttps,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
  });
}
