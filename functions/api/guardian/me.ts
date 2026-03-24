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
    emergencyContactName: g.emergencyContactName,
    emergencyContactPhone: g.emergencyContactPhone,
    accountRole: g.accountRole,
    accountComplete: Boolean(g.phone && g.emergencyContactName && g.emergencyContactPhone && g.accountRole && g.completedAt),
    completedAt: g.completedAt,
  });
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "Server error" }, { status: 500 });
  const g = await getGuardianFromRequest(env, request);
  if (!g) return json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    fullName?: string;
    phone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    accountRole?: string;
  } | null;

  const fullName = compactWhitespace(String(body?.fullName ?? g.fullName ?? ""));
  const phone = compactWhitespace(String(body?.phone ?? g.phone ?? ""));
  const emergencyContactName = compactWhitespace(String(body?.emergencyContactName ?? g.emergencyContactName ?? ""));
  const emergencyContactPhone = compactWhitespace(String(body?.emergencyContactPhone ?? g.emergencyContactPhone ?? ""));
  const accountRole = compactWhitespace(String(body?.accountRole ?? g.accountRole ?? ""));

  if (fullName.length < 2) return json({ error: "Full name is required." }, { status: 400 });
  if (phone.length < 7) return json({ error: "Phone number is required." }, { status: 400 });
  if (emergencyContactName.length < 2) return json({ error: "Emergency contact name is required." }, { status: 400 });
  if (emergencyContactPhone.length < 7) return json({ error: "Emergency contact phone is required." }, { status: 400 });
  if (accountRole !== "parent_guardian" && accountRole !== "adult_student") {
    return json({ error: "Choose whether this account is for a parent/guardian or an adult student." }, { status: 400 });
  }

  await env.DB.prepare(
    `UPDATE guardian_accounts
     SET full_name = ?, phone = ?, emergency_contact_name = ?, emergency_contact_phone = ?, account_role = ?, completed_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(fullName, phone, emergencyContactName, emergencyContactPhone, accountRole, g.guardianAccountId)
    .run();

  return json({ ok: true });
}
