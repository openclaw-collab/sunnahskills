import { parseCookieHeader, serializeCookie } from "./cookies";

export type GuardianSessionUser = {
  guardianAccountId: number;
  email: string;
  accountNumber: string;
  fullName: string | null;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  accountRole: string | null;
  completedAt: string | null;
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
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      account_role TEXT,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_guardian_accounts_account_number ON guardian_accounts(account_number)`,
    `ALTER TABLE guardian_accounts ADD COLUMN emergency_contact_name TEXT`,
    `ALTER TABLE guardian_accounts ADD COLUMN emergency_contact_phone TEXT`,
    `ALTER TABLE guardian_accounts ADD COLUMN account_role TEXT`,
    `ALTER TABLE guardian_accounts ADD COLUMN completed_at DATETIME`,
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
      participant_type TEXT DEFAULT 'child',
      is_account_holder INTEGER DEFAULT 0,
      full_name TEXT NOT NULL,
      date_of_birth TEXT,
      gender TEXT,
      medical_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE saved_students ADD COLUMN participant_type TEXT DEFAULT 'child'`,
    `ALTER TABLE saved_students ADD COLUMN is_account_holder INTEGER DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS waiver_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      body_html TEXT NOT NULL,
      version_label TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_waiver_documents_slug_active ON waiver_documents(slug, active, published_at DESC)`,
    `CREATE TABLE IF NOT EXISTS trial_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id TEXT NOT NULL,
      account_holder_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      participant_type TEXT NOT NULL,
      participant_full_name TEXT NOT NULL,
      participant_age INTEGER NOT NULL,
      participant_gender TEXT NOT NULL,
      desired_date TEXT NOT NULL,
      notes TEXT,
      qr_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'booked',
      verified_at DATETIME,
      verified_by TEXT,
      redeemed_order_id INTEGER,
      redeemed_registration_id INTEGER,
      matched_guardian_account_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_trial_bookings_email ON trial_bookings(email)`,
    `CREATE INDEX IF NOT EXISTS idx_trial_bookings_status ON trial_bookings(status)`,
    `CREATE TABLE IF NOT EXISTS proration_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      note TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_by_admin_email TEXT,
      redeemed_at DATETIME,
      redeemed_order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_proration_codes_active ON proration_codes(active, redeemed_at)`,
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
            a.email as email, a.account_number as account_number, a.full_name as full_name, a.phone as phone,
            a.emergency_contact_name as emergency_contact_name,
            a.emergency_contact_phone as emergency_contact_phone,
            a.account_role as account_role,
            a.completed_at as completed_at
     FROM guardian_sessions s
     JOIN guardian_accounts a ON a.id = s.guardian_account_id
     WHERE s.token = ?
     LIMIT 1`,
  )
    .bind(token)
    .first<{
      aid: number;
      exp: string;
      email: string;
      account_number: string;
      full_name: string | null;
      phone: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
      account_role: string | null;
      completed_at: string | null;
    }>();

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
    phone: row.phone != null ? String(row.phone) : null,
    emergencyContactName: row.emergency_contact_name != null ? String(row.emergency_contact_name) : null,
    emergencyContactPhone: row.emergency_contact_phone != null ? String(row.emergency_contact_phone) : null,
    accountRole: row.account_role != null ? String(row.account_role) : null,
    completedAt: row.completed_at != null ? String(row.completed_at) : null,
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
