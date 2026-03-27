import { resolveDiscountCode } from "../../_utils/discounts";

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

  const result = await resolveDiscountCode(env.DB, code, { programId: body?.programId ?? null });
  if (!result.valid || !result.row) {
    return json({ valid: false, reason: result.reason }, { status: 200 });
  }

  return json({
    valid: true,
    code: result.row.code,
    type: result.row.type,
    value: result.row.value,
    programId: result.row.program_id ?? null,
  });
}
