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
  if (!hasAdminPermission(admin, "registrations", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const token = url.searchParams.get("trialToken");

  if (token) {
    const booking = await env.DB.prepare(
      `SELECT * FROM trial_bookings WHERE qr_token = ? LIMIT 1`,
    )
      .bind(token)
      .first();
    return json({ booking: booking ?? null });
  }

  const { results } = await env.DB.prepare(
    `SELECT *
     FROM trial_bookings
     ORDER BY
       CASE WHEN verified_at IS NULL THEN 0 ELSE 1 END,
       desired_date ASC,
       created_at DESC
     LIMIT 250`,
  ).all();
  return json({ trials: results ?? [] });
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "registrations", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    id?: number;
    trialToken?: string;
    status?: string;
    verify?: boolean;
  } | null;

  const lookup = body?.id
    ? await env.DB.prepare(`SELECT id FROM trial_bookings WHERE id = ?`).bind(body.id).first<{ id: number }>()
    : body?.trialToken
      ? await env.DB.prepare(`SELECT id FROM trial_bookings WHERE qr_token = ?`).bind(body.trialToken).first<{ id: number }>()
      : null;

  if (!lookup?.id) return json({ error: "Trial booking not found." }, { status: 404 });

  if (body?.verify) {
    await env.DB.prepare(
      `UPDATE trial_bookings
       SET status = 'verified',
           verified_at = COALESCE(verified_at, datetime('now')),
           verified_by = ?
       WHERE id = ?`,
    )
      .bind(admin.email, lookup.id)
      .run();
  } else if (body?.status) {
    await env.DB.prepare(`UPDATE trial_bookings SET status = ? WHERE id = ?`)
      .bind(body.status, lookup.id)
      .run();
  }

  const updated = await env.DB.prepare(`SELECT * FROM trial_bookings WHERE id = ?`).bind(lookup.id).first();
  return json({ ok: true, booking: updated ?? null });
}
