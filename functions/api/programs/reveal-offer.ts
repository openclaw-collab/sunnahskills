import { z } from "zod";

interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

const revealSchema = z.object({
  programSlug: z.string().trim().min(1),
  accessCode: z.string().trim().min(1),
});

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const parsed = revealSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const program = await env.DB.prepare(`SELECT id, slug, status FROM programs WHERE slug = ?`)
    .bind(parsed.data.programSlug)
    .first<{ id: string; slug: string; status: string | null }>();
  if (!program?.id || program.status === "archived") {
    return json({ error: "Program not found" }, { status: 404 });
  }

  const offers = (await env.DB.prepare(`SELECT * FROM program_offers WHERE program_id = ? AND active = 1`).bind(program.id).all())
    .results ?? [];
  const normalizedCode = parsed.data.accessCode.trim().toUpperCase();
  const offer = (offers as any[]).find(
    (row) => row.is_private && String(row.access_code ?? "").trim().toUpperCase() === normalizedCode,
  );
  if (!offer) {
    return json({ error: "Invalid or inactive access code." }, { status: 404 });
  }

  const sessions = (await env.DB.prepare(`SELECT * FROM program_sessions WHERE program_id = ? AND visible = 1`).bind(program.id).all())
    .results ?? [];
  const prices = (await env.DB.prepare(`SELECT * FROM program_prices WHERE program_id = ? AND active = 1`).bind(program.id).all())
    .results ?? [];
  const dates = (
    await env.DB.prepare(`SELECT event_date FROM program_offer_dates WHERE offer_id = ? ORDER BY sort_order ASC, event_date ASC`)
      .bind(offer.id)
      .all()
  ).results ?? [];

  return json({
    offer: {
      ...offer,
      dates: (dates as Array<{ event_date: string }>).map((entry) => entry.event_date),
      sessions: (sessions as any[]).filter((session) => session.offer_id === offer.id),
      prices: (prices as any[]).filter((price) => price.offer_id === offer.id),
    },
  });
}
