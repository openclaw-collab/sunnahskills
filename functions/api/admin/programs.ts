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

function isValidStripePriceId(value: string) {
  return /^price_[A-Za-z0-9]+$/.test(value.trim());
}

async function ensureProgramPriceMetadataColumn(env: Env) {
  try {
    await env.DB.prepare(`ALTER TABLE program_prices ADD COLUMN metadata TEXT`).run();
  } catch {
    // Column already exists on migrated databases.
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "pricing", "read")) return json({ error: "Forbidden" }, { status: 403 });

  await ensureProgramPriceMetadataColumn(env);

  const programs = (await env.DB.prepare(`SELECT * FROM programs`).all()).results ?? [];
  const prices = (await env.DB.prepare(`SELECT * FROM program_prices`).all()).results ?? [];
  return json({ programs, prices });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "pricing", "write")) return json({ error: "Forbidden" }, { status: 403 });

  await ensureProgramPriceMetadataColumn(env);

  const body = (await request.json().catch(() => null)) as
    | { priceId: number; amount?: number; registrationFee?: number; active?: number; stripePriceId?: string | null }
    | null;
  if (!Number.isInteger(body?.priceId) || Number(body.priceId) <= 0) {
    return json({ error: "priceId is required" }, { status: 400 });
  }
  if (body.amount !== undefined && (!Number.isInteger(body.amount) || body.amount < 0)) {
    return json({ error: "amount must be a non-negative integer" }, { status: 400 });
  }
  if (body.registrationFee !== undefined && (!Number.isInteger(body.registrationFee) || body.registrationFee < 0)) {
    return json({ error: "registrationFee must be a non-negative integer" }, { status: 400 });
  }
  if (body.active !== undefined && body.active !== 0 && body.active !== 1) {
    return json({ error: "active must be 0 or 1" }, { status: 400 });
  }

  const existing = await env.DB.prepare(`SELECT metadata FROM program_prices WHERE id = ? LIMIT 1`)
    .bind(body.priceId)
    .first();

  let nextMetadata: Record<string, unknown> = {};
  try {
    nextMetadata = JSON.parse(String(existing?.metadata ?? "{}")) as Record<string, unknown>;
  } catch {
    nextMetadata = {};
  }

  if (body.stripePriceId !== undefined) {
    if (body.stripePriceId?.trim()) {
      const normalized = body.stripePriceId.trim();
      if (!isValidStripePriceId(normalized)) {
        return json({ error: "stripePriceId must look like a Stripe Price ID" }, { status: 400 });
      }
      nextMetadata.stripe_price_id = normalized;
    } else {
      delete nextMetadata.stripe_price_id;
    }
  }

  await env.DB.prepare(
    `
    UPDATE program_prices
    SET amount = COALESCE(?, amount),
        registration_fee = COALESCE(?, registration_fee),
        active = COALESCE(?, active),
        metadata = ?
    WHERE id = ?
    `,
  )
    .bind(
      body.amount ?? null,
      body.registrationFee ?? null,
      body.active ?? null,
      JSON.stringify(nextMetadata),
      body.priceId,
    )
    .run();

  return json({ ok: true });
}
