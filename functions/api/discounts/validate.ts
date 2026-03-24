interface Env {
  DB: D1Database;
}

type ValidateDiscountRequest = {
  code: string;
  programId?: string | null;
};

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const body = (await request.json().catch(() => null)) as ValidateDiscountRequest | null;
  const code = body?.code?.trim().toUpperCase();
  if (!code) return json({ valid: false, reason: "missing_code" }, { status: 400 });

  const row = await env.DB.prepare(
    `
    SELECT id, code, type, value, program_id, max_uses, current_uses, valid_from, valid_until, active
    FROM discounts
    WHERE code = ? AND active = 1
    LIMIT 1
    `,
  )
    .bind(code)
    .first();

  if (!row) return json({ valid: false, reason: "not_found" }, { status: 200 });

  if (row.program_id && body?.programId && row.program_id !== body.programId) {
    return json({ valid: false, reason: "program_mismatch" }, { status: 200 });
  }

  if (row.max_uses != null && row.current_uses != null && Number(row.current_uses) >= Number(row.max_uses)) {
    return json({ valid: false, reason: "max_uses_reached" }, { status: 200 });
  }

  // NOTE: valid_from/valid_until are stored as DATETIME strings; comparing in JS avoids SQLite format traps.
  const now = Date.now();
  const validFrom = row.valid_from ? Date.parse(String(row.valid_from)) : null;
  const validUntil = row.valid_until ? Date.parse(String(row.valid_until)) : null;
  if (validFrom && now < validFrom) return json({ valid: false, reason: "not_started" }, { status: 200 });
  if (validUntil && now > validUntil) return json({ valid: false, reason: "expired" }, { status: 200 });

  return json({
    valid: true,
    code: row.code,
    type: row.type,
    value: row.value,
    programId: row.program_id ?? null,
  });
}

