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
    `SELECT id, full_name, date_of_birth, gender, medical_notes, created_at
     FROM saved_students
     WHERE guardian_account_id = ?
     ORDER BY created_at DESC, id DESC`,
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

  const result = await env.DB.prepare(
    `INSERT INTO saved_students (guardian_account_id, full_name, date_of_birth, gender, medical_notes, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardian.guardianAccountId,
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
      full_name: fullName,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      medical_notes: medicalNotes || null,
    },
  });
}
