import { getGuardianFromRequest } from "../../../_utils/guardianAuth";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

async function loadOwnedStudent(env: Env, guardianAccountId: number, studentId: number) {
  return env.DB.prepare(
    `SELECT id FROM saved_students WHERE id = ? AND guardian_account_id = ? LIMIT 1`,
  )
    .bind(studentId, guardianAccountId)
    .first<{ id: number }>();
}

export async function onRequestPatch({
  request,
  env,
  params,
}: {
  request: Request;
  env: Env;
  params: { id: string };
}) {
  if (!env.DB) return json({ error: "Server error" }, { status: 500 });
  const guardian = await getGuardianFromRequest(env, request);
  if (!guardian) return json({ error: "Unauthorized" }, { status: 401 });

  const studentId = Number(params.id);
  if (!Number.isInteger(studentId) || studentId <= 0) {
    return json({ error: "Invalid student id." }, { status: 400 });
  }

  const owned = await loadOwnedStudent(env, guardian.guardianAccountId, studentId);
  if (!owned) return json({ error: "Not found." }, { status: 404 });

  const body = (await request.json().catch(() => null)) as {
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    medicalNotes?: string;
  } | null;

  const fullName = compactWhitespace(String(body?.fullName ?? ""));
  const dateOfBirth = String(body?.dateOfBirth ?? "").trim();
  const gender = String(body?.gender ?? "").trim();
  const medicalNotes = compactWhitespace(String(body?.medicalNotes ?? "")).slice(0, 1500);

  if (fullName.length < 2) return json({ error: "Student name is required." }, { status: 400 });

  await env.DB.prepare(
    `UPDATE saved_students
     SET full_name = ?, date_of_birth = ?, gender = ?, medical_notes = ?
     WHERE id = ? AND guardian_account_id = ?`,
  )
    .bind(
      fullName,
      dateOfBirth || null,
      gender || null,
      medicalNotes || null,
      studentId,
      guardian.guardianAccountId,
    )
    .run();

  return json({ ok: true });
}

export async function onRequestDelete({
  request,
  env,
  params,
}: {
  request: Request;
  env: Env;
  params: { id: string };
}) {
  if (!env.DB) return json({ error: "Server error" }, { status: 500 });
  const guardian = await getGuardianFromRequest(env, request);
  if (!guardian) return json({ error: "Unauthorized" }, { status: 401 });

  const studentId = Number(params.id);
  if (!Number.isInteger(studentId) || studentId <= 0) {
    return json({ error: "Invalid student id." }, { status: 400 });
  }

  await env.DB.prepare(`DELETE FROM saved_students WHERE id = ? AND guardian_account_id = ?`)
    .bind(studentId, guardian.guardianAccountId)
    .run();

  return json({ ok: true });
}
