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

  const { results } = await env.DB.prepare(`SELECT * FROM discounts ORDER BY created_at DESC LIMIT 500`).all();
  return json({ discounts: results ?? [] });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | {
        code: string;
        type: "percentage" | "fixed" | "sibling";
        value: number;
        programId?: string | null;
        maxUses?: number | null;
        validFrom?: string | null;
        validUntil?: string | null;
        active?: number;
      }
    | null;
  if (!body?.code || !body.type || typeof body.value !== "number") {
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  await env.DB.prepare(
    `
    INSERT INTO discounts (
      code, type, value, program_id, max_uses, current_uses, valid_from, valid_until, active, created_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, datetime('now'))
    `,
  )
    .bind(
      body.code.trim().toUpperCase(),
      body.type,
      body.value,
      body.programId ?? null,
      body.maxUses ?? null,
      body.validFrom ?? null,
      body.validUntil ?? null,
      body.active ?? 1,
    )
    .run();

  return json({ ok: true }, { status: 201 });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as
    | { id: number; active?: number; maxUses?: number | null; validUntil?: string | null }
    | null;
  if (!body?.id) return json({ error: "id is required" }, { status: 400 });

  await env.DB.prepare(
    `
    UPDATE discounts
    SET active = COALESCE(?, active),
        max_uses = COALESCE(?, max_uses),
        valid_until = COALESCE(?, valid_until)
    WHERE id = ?
    `,
  )
    .bind(body.active ?? null, body.maxUses ?? null, body.validUntil ?? null, body.id)
    .run();

  return json({ ok: true });
}

