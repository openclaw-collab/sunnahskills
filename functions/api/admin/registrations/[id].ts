import { getAdminFromRequest, hasAdminPermission } from "../../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function getIdFromUrl(request: Request): number | null {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const idStr = parts[parts.length - 1];
  const n = Number(idStr);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "registrations", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const id = getIdFromUrl(request);
  if (!id) return json({ error: "Invalid id" }, { status: 400 });

  const row = await env.DB.prepare(
    `
    SELECT
      r.*,
      p.name as program_name, p.slug as program_slug,
      g.full_name as guardian_full_name, g.email as guardian_email, g.phone as guardian_phone,
      g.emergency_contact_name as guardian_emergency_contact_name,
      g.emergency_contact_phone as guardian_emergency_contact_phone,
      g.relationship as guardian_relationship,
      s.full_name as student_full_name, s.preferred_name as student_preferred_name,
      s.date_of_birth as student_dob, s.age as student_age, s.gender as student_gender,
      s.prior_experience as student_prior_experience, s.skill_level as student_skill_level,
      s.medical_notes as student_medical_notes,
      w.liability_waiver as waiver_liability_waiver,
      w.photo_consent as waiver_photo_consent,
      w.medical_consent as waiver_medical_consent,
      w.terms_agreement as waiver_terms_agreement,
      w.signature_text as waiver_signature_text,
      w.signed_at as waiver_signed_at,
      pay.status as payment_status,
      pay.amount as payment_amount,
      pay.currency as payment_currency,
      pay.stripe_payment_intent_id as stripe_payment_intent_id
    FROM registrations r
    JOIN programs p ON p.id = r.program_id
    JOIN guardians g ON g.id = r.guardian_id
    JOIN students s ON s.id = r.student_id
    LEFT JOIN waivers w ON w.registration_id = r.id
    LEFT JOIN payments pay ON pay.registration_id = r.id
    WHERE r.id = ?
    LIMIT 1
    `,
  )
    .bind(id)
    .first();

  if (!row) return json({ error: "Not found" }, { status: 404 });
  return json({ registration: row });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "registrations", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const id = getIdFromUrl(request);
  if (!id) return json({ error: "Invalid id" }, { status: 400 });

  const body = (await request.json().catch(() => null)) as
    | { status?: string; adminNotes?: string | null }
    | null;
  if (!body) return json({ error: "Invalid payload" }, { status: 400 });

  await env.DB.prepare(
    `
    UPDATE registrations
    SET status = COALESCE(?, status),
        admin_notes = COALESCE(?, admin_notes),
        updated_at = datetime('now')
    WHERE id = ?
    `,
  )
    .bind(body.status ?? null, body.adminNotes ?? null, id)
    .run();

  return json({ ok: true });
}
