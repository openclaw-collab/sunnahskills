import { getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";

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
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "pricing", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const rows =
    (await env.DB.prepare(`SELECT * FROM semesters ORDER BY active DESC, id DESC`).all()).results ?? [];
  return json({ semesters: rows });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "pricing", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    id?: number;
    classesInSemester?: number;
    pricePerClassCents?: number | null;
    registrationFeeCents?: number | null;
    laterPaymentDate?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    name?: string;
    active?: number;
  } | null;

  if (!body || !Number.isInteger(body.id) || body.id! <= 0) {
    return json({ error: "id is required" }, { status: 400 });
  }

  if (body.classesInSemester !== undefined) {
    if (!Number.isInteger(body.classesInSemester) || body.classesInSemester < 1 || body.classesInSemester > 52) {
      return json({ error: "classesInSemester must be 1–52" }, { status: 400 });
    }
  }
  if (body.pricePerClassCents !== undefined && body.pricePerClassCents !== null) {
    if (!Number.isInteger(body.pricePerClassCents) || body.pricePerClassCents < 0) {
      return json({ error: "pricePerClassCents invalid" }, { status: 400 });
    }
  }
  if (body.registrationFeeCents !== undefined && body.registrationFeeCents !== null) {
    if (!Number.isInteger(body.registrationFeeCents) || body.registrationFeeCents < 0) {
      return json({ error: "registrationFeeCents invalid" }, { status: 400 });
    }
  }
  if (body.active !== undefined && body.active !== 0 && body.active !== 1) {
    return json({ error: "active must be 0 or 1" }, { status: 400 });
  }

  const sets: string[] = [];
  const binds: (string | number | null)[] = [];

  if (body.name !== undefined) {
    sets.push("name = ?");
    binds.push(body.name);
  }
  if (body.classesInSemester !== undefined) {
    sets.push("classes_in_semester = ?");
    binds.push(body.classesInSemester);
  }
  if (body.pricePerClassCents !== undefined) {
    sets.push("price_per_class_cents = ?");
    binds.push(body.pricePerClassCents);
  }
  if (body.registrationFeeCents !== undefined) {
    sets.push("registration_fee_cents = ?");
    binds.push(body.registrationFeeCents);
  }
  if (body.laterPaymentDate !== undefined) {
    sets.push("later_payment_date = ?");
    binds.push(body.laterPaymentDate);
  }
  if (body.startDate !== undefined) {
    sets.push("start_date = ?");
    binds.push(body.startDate);
  }
  if (body.endDate !== undefined) {
    sets.push("end_date = ?");
    binds.push(body.endDate);
  }
  if (body.active !== undefined) {
    sets.push("active = ?");
    binds.push(body.active);
  }

  if (sets.length === 0) return json({ error: "No fields to update" }, { status: 400 });

  binds.push(body.id);
  await env.DB.prepare(`UPDATE semesters SET ${sets.join(", ")} WHERE id = ?`).bind(...binds).run();

  const row = await env.DB.prepare(`SELECT * FROM semesters WHERE id = ?`).bind(body.id).first();
  return json({ ok: true, semester: row });
}
