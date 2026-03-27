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
  if (!hasAdminPermission(admin, "discounts", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const { results } = await env.DB.prepare(`SELECT * FROM discounts ORDER BY created_at DESC LIMIT 500`).all();
  return json({ discounts: results ?? [] });
}

type DiscountPayload = {
  code: string;
  type: "percentage" | "fixed" | "sibling";
  value: number;
  programId?: string | null;
  maxUses?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  active?: number;
};

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "discounts", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as DiscountPayload | null;
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

type DiscountPatchPayload = {
  id: number;
  code?: string;
  type?: "percentage" | "fixed" | "sibling";
  value?: number;
  programId?: string | null;
  maxUses?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  active?: number;
};

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "discounts", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as DiscountPatchPayload | null;
  if (!body?.id) return json({ error: "id is required" }, { status: 400 });

  const updates: string[] = [];
  const values: Array<string | number | null> = [];

  if (typeof body.code === "string") {
    updates.push("code = ?");
    values.push(body.code.trim().toUpperCase());
  }
  if (body.type) {
    updates.push("type = ?");
    values.push(body.type);
  }
  if (typeof body.value === "number") {
    updates.push("value = ?");
    values.push(body.value);
  }
  if (Object.prototype.hasOwnProperty.call(body, "programId")) {
    updates.push("program_id = ?");
    values.push(body.programId ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(body, "maxUses")) {
    updates.push("max_uses = ?");
    values.push(body.maxUses ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(body, "validFrom")) {
    updates.push("valid_from = ?");
    values.push(body.validFrom ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(body, "validUntil")) {
    updates.push("valid_until = ?");
    values.push(body.validUntil ?? null);
  }
  if (typeof body.active === "number") {
    updates.push("active = ?");
    values.push(body.active);
  }

  if (updates.length === 0) return json({ error: "Nothing to update" }, { status: 400 });

  values.push(body.id);
  await env.DB.prepare(`UPDATE discounts SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "discounts", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id") ?? 0);
  if (!Number.isInteger(id) || id <= 0) return json({ error: "id is required" }, { status: 400 });

  await env.DB.prepare(`DELETE FROM discounts WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}
