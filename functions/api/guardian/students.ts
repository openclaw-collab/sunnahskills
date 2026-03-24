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

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "Server error" }, { status: 500 });
  const guardian = await getGuardianFromRequest(env, request);
  if (!guardian) return json({ error: "Unauthorized" }, { status: 401 });

  const results = await env.DB.prepare(
    `SELECT id, participant_type, is_account_holder, full_name, date_of_birth, gender, medical_notes, created_at
     FROM saved_students
     WHERE guardian_account_id = ?
     ORDER BY is_account_holder DESC, created_at DESC, id DESC`,
  )
    .bind(guardian.guardianAccountId)
    .all();

  return json({ students: results.results ?? [] });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "Server error" }, { status: 500 });
  const guardian = await getGuardianFromRequest(env, request);
  if (!guardian) return json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    participantType?: string;
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    medicalNotes?: string;
  } | null;

  const participantType = String(body?.participantType ?? "").trim();
  const fullName = compactWhitespace(String(body?.fullName ?? ""));
  const dateOfBirth = String(body?.dateOfBirth ?? "").trim();
  const gender = String(body?.gender ?? "").trim();
  const medicalNotes = compactWhitespace(String(body?.medicalNotes ?? "")).slice(0, 1500);

  if (participantType !== "self" && participantType !== "child") {
    return json({ error: "Participant type is required." }, { status: 400 });
  }
  if (fullName.length < 2) return json({ error: "Participant name is required." }, { status: 400 });
  if (!dateOfBirth) return json({ error: "Date of birth is required." }, { status: 400 });
  if (!gender) return json({ error: "Gender is required." }, { status: 400 });

  const result = await env.DB.prepare(
    `INSERT INTO saved_students (guardian_account_id, participant_type, is_account_holder, full_name, date_of_birth, gender, medical_notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardian.guardianAccountId,
      participantType,
      participantType === "self" ? 1 : 0,
      fullName,
      dateOfBirth || null,
      gender || null,
      medicalNotes || null,
    )
    .run();

  return json({
    ok: true,
    student: {
      id: result.meta?.last_row_id ?? null,
      participant_type: participantType,
      is_account_holder: participantType === "self" ? 1 : 0,
      full_name: fullName,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      medical_notes: medicalNotes || null,
    },
  });
}
