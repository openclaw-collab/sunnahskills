import { z } from "zod";
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

const createOfferSchema = z.object({
  programId: z.string().trim().min(1),
  name: z.string().trim().min(2),
  isPrivate: z.boolean().optional().default(false),
  sessionName: z.string().trim().min(2),
  season: z.string().trim().optional().default(""),
  dayOfWeek: z.string().trim().optional().default(""),
  startTime: z.string().trim().optional().default(""),
  endTime: z.string().trim().optional().default(""),
  startDate: z.string().trim().optional().default(""),
  endDate: z.string().trim().optional().default(""),
  capacity: z.number().int().positive(),
  amount: z.number().int().nonnegative(),
  frequency: z.string().trim().min(1),
  audienceGender: z.string().trim().optional().default(""),
  confirmationNotes: z.string().trim().optional().default(""),
  dates: z.array(z.string().trim().min(1)).optional().default([]),
});

const updateOfferSchema = z.object({
  offerId: z.number().int().positive(),
  active: z.number().int().optional(),
  confirmationNotes: z.string().trim().optional(),
  dates: z.array(z.string().trim().min(1)).optional(),
});

function generateAccessCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "offers", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const offers = (await env.DB.prepare(`SELECT * FROM program_offers ORDER BY created_at DESC, id DESC`).all()).results ?? [];
  const offerDates = (await env.DB.prepare(`SELECT * FROM program_offer_dates ORDER BY sort_order ASC, event_date ASC`).all()).results ?? [];
  return json({
    offers: (offers as any[]).map((offer) => ({
      ...offer,
      dates: (offerDates as any[])
        .filter((entry) => entry.offer_id === offer.id)
        .map((entry) => entry.event_date),
    })),
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "offers", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const parsed = createOfferSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });

  const body = parsed.data;
  const accessCode = body.isPrivate ? generateAccessCode() : null;
  const waiverSlug = String((body as any).waiver_slug ?? body.programId ?? "registration").trim();

  const offerInsert = await env.DB.prepare(
    `INSERT INTO program_offers (
      program_id, name, confirmation_notes, is_private, access_code, active, audience_gender, waiver_slug, created_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, datetime('now'))`,
  )
    .bind(
      body.programId,
      body.name,
      body.confirmationNotes || null,
      body.isPrivate ? 1 : 0,
      accessCode,
      body.audienceGender || null,
      waiverSlug,
    )
    .run();
  const offerId = Number(offerInsert.meta?.last_row_id ?? 0);

  const sessionInsert = await env.DB.prepare(
    `INSERT INTO program_sessions (
      program_id, offer_id, name, season, day_of_week, start_time, end_time, age_group, gender_group,
      capacity, enrolled_count, start_date, end_date, status, visible, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'all', ?, ?, 0, ?, ?, 'active', 1, datetime('now'))`,
  )
    .bind(
      body.programId,
      offerId,
      body.sessionName,
      body.season || null,
      body.dayOfWeek || null,
      body.startTime || null,
      body.endTime || null,
      body.audienceGender || null,
      body.capacity,
      body.startDate || null,
      body.endDate || null,
    )
    .run();
  const sessionId = Number(sessionInsert.meta?.last_row_id ?? 0);

  const priceInsert = await env.DB.prepare(
    `INSERT INTO program_prices (
      program_id, offer_id, age_group, label, amount, frequency, registration_fee, metadata, active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1, datetime('now'))`,
  )
    .bind(
      body.programId,
      offerId,
      body.audienceGender || "all",
      body.name,
      body.amount,
      body.frequency,
      JSON.stringify({ offer_id: offerId, session_id: sessionId }),
    )
    .run();
  const priceId = Number(priceInsert.meta?.last_row_id ?? 0);

  const offerDates = body.dates.length > 0
    ? body.dates
    : body.startDate.trim()
      ? [body.startDate.trim()]
      : [];
  for (const [index, eventDate] of offerDates.entries()) {
    await env.DB.prepare(
      `INSERT INTO program_offer_dates (offer_id, event_date, sort_order, created_at)
       VALUES (?, ?, ?, datetime('now'))`,
    )
      .bind(offerId, eventDate, index + 1)
      .run();
  }

  return json(
    {
      offer: {
        id: offerId,
        program_id: body.programId,
        name: body.name,
        confirmation_notes: body.confirmationNotes,
        is_private: body.isPrivate ? 1 : 0,
        access_code: accessCode,
        active: 1,
        audience_gender: body.audienceGender || null,
        dates: offerDates,
        session_id: sessionId,
        price_id: priceId,
      },
    },
    { status: 201 },
  );
}

export async function onRequestPatch({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "offers", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const parsed = updateOfferSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });

  const body = parsed.data;
  const existing = await env.DB.prepare(`SELECT id FROM program_offers WHERE id = ? LIMIT 1`)
    .bind(body.offerId)
    .first<{ id: number }>();
  if (!existing?.id) return json({ error: "Offer not found" }, { status: 404 });

  await env.DB.prepare(
    `UPDATE program_offers
     SET active = COALESCE(?, active),
         confirmation_notes = COALESCE(?, confirmation_notes)
     WHERE id = ?`,
  )
    .bind(body.active ?? null, body.confirmationNotes ?? null, body.offerId)
    .run();

  if (body.dates) {
    await env.DB.prepare(`DELETE FROM program_offer_dates WHERE offer_id = ?`).bind(body.offerId).run();
    for (const [index, eventDate] of body.dates.entries()) {
      await env.DB.prepare(
        `INSERT INTO program_offer_dates (offer_id, event_date, sort_order, created_at)
         VALUES (?, ?, ?, datetime('now'))`,
      )
        .bind(body.offerId, eventDate, index + 1)
        .run();
    }
  }

  return json({ ok: true });
}
