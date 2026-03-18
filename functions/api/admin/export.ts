import { getAdminFromRequest } from "../../_utils/adminAuth";

interface Env {
  DB: D1Database;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return new Response("Unauthorized", { status: 401 });

  const { results } = await env.DB.prepare(
    `
    SELECT
      r.id as registration_id,
      r.status as registration_status,
      r.created_at as created_at,
      p.name as program_name,
      g.full_name as guardian_name,
      g.email as guardian_email,
      g.phone as guardian_phone,
      s.full_name as student_name,
      s.age as student_age,
      pay.status as payment_status,
      pay.amount as payment_amount
    FROM registrations r
    JOIN programs p ON p.id = r.program_id
    JOIN guardians g ON g.id = r.guardian_id
    JOIN students s ON s.id = r.student_id
    LEFT JOIN payments pay ON pay.registration_id = r.id
    ORDER BY r.created_at DESC
    LIMIT 5000
    `,
  ).all();

  const rows = (results ?? []) as any[];
  const headers = [
    "registration_id",
    "registration_status",
    "created_at",
    "program_name",
    "guardian_name",
    "guardian_email",
    "guardian_phone",
    "student_name",
    "student_age",
    "payment_status",
    "payment_amount",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations.csv"`,
    },
  });
}

