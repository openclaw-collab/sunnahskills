interface Env {
  DB: D1Database;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestGet({ env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const programs =
    ((await env.DB.prepare(`SELECT * FROM programs WHERE status != 'archived'`).all()).results ?? []).filter(
      (program: any) => program.status !== "archived",
    );
  const sessions =
    ((await env.DB.prepare(`SELECT * FROM program_sessions WHERE visible = 1`).all()).results ?? []).filter(
      (session: any) => Number(session.visible ?? 1) === 1,
    );
  const prices =
    ((await env.DB.prepare(`SELECT * FROM program_prices WHERE active = 1`).all()).results ?? []).filter(
      (price: any) => Number(price.active ?? 1) === 1,
    );
  const offers = await env.DB.prepare(`SELECT * FROM program_offers WHERE active = 1`)
    .all()
    .then((result) => result.results ?? [])
    .catch(() => []);
  const offerDates = await env.DB.prepare(`SELECT * FROM program_offer_dates ORDER BY sort_order ASC, event_date ASC`)
    .all()
    .then((result) => result.results ?? [])
    .catch(() => []);
  const semesters =
    (await env.DB.prepare(`SELECT * FROM semesters WHERE active = 1 ORDER BY id DESC`).all()).results ?? [];

  /** Latest active semester row per program (ORDER BY id DESC → first wins). */
  const activeSemesterByProgram = new Map<string, Record<string, unknown>>();
  for (const row of semesters as Record<string, unknown>[]) {
    const pid = String(row.program_id ?? "");
    if (pid && !activeSemesterByProgram.has(pid)) {
      activeSemesterByProgram.set(pid, row);
    }
  }

  const privateOfferIds = new Set(
    (offers as any[])
      .filter((offer) => Number(offer.is_private ?? 0) === 1)
      .map((offer) => Number(offer.id)),
  );

  const byProgram: Record<string, any> = {};
  for (const p of programs as any[]) {
    const semRow = activeSemesterByProgram.get(p.id);
    const active_semester = semRow
      ? {
          id: semRow.id,
          name: semRow.name,
          program_id: semRow.program_id,
          start_date: semRow.start_date ?? null,
          end_date: semRow.end_date ?? null,
          classes_in_semester: semRow.classes_in_semester ?? 12,
          price_per_class_cents: semRow.price_per_class_cents ?? null,
          registration_fee_cents: semRow.registration_fee_cents ?? null,
          later_payment_date: semRow.later_payment_date ?? null,
          active: semRow.active ?? 1,
        }
      : null;
    byProgram[p.id] = { ...p, sessions: [], prices: [], offers: [], active_semester };
  }
  for (const s of sessions as any[]) {
    if (s.offer_id != null && privateOfferIds.has(Number(s.offer_id))) continue;
    if (byProgram[s.program_id]) byProgram[s.program_id].sessions.push(s);
  }
  for (const pr of prices as any[]) {
    if (pr.offer_id != null && privateOfferIds.has(Number(pr.offer_id))) continue;
    if (byProgram[pr.program_id]) byProgram[pr.program_id].prices.push(pr);
  }
  for (const offer of offers as any[]) {
    if (offer.is_private) continue;
    if (!byProgram[offer.program_id]) continue;
    const dates = (offerDates as any[])
      .filter((entry) => entry.offer_id === offer.id)
      .map((entry) => entry.event_date);
    byProgram[offer.program_id].offers.push({
      ...offer,
      dates,
      sessions: byProgram[offer.program_id].sessions.filter((session: any) => session.offer_id === offer.id),
      prices: byProgram[offer.program_id].prices.filter((price: any) => price.offer_id === offer.id),
    });
  }

  return json({ programs: Object.values(byProgram) });
}
