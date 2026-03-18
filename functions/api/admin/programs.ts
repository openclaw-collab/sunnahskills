import { getAdminFromRequest } from "../../_utils/adminAuth";

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

  const programs = (await env.DB.prepare(`SELECT * FROM programs`).all()).results ?? [];
  const prices = (await env.DB.prepare(`SELECT * FROM program_prices`).all()).results ?? [];
  return json({ programs, prices });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { priceId: number; amount?: number; registrationFee?: number; active?: number }
    | null;
  if (!body?.priceId) return json({ error: "priceId is required" }, { status: 400 });

  await env.DB.prepare(
    `
    UPDATE program_prices
    SET amount = COALESCE(?, amount),
        registration_fee = COALESCE(?, registration_fee),
        active = COALESCE(?, active)
    WHERE id = ?
    `,
  )
    .bind(body.amount ?? null, body.registrationFee ?? null, body.active ?? null, body.priceId)
    .run();

  return json({ ok: true });
}

