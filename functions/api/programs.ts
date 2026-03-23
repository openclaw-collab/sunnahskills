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

  const programs = (await env.DB.prepare(`SELECT * FROM programs WHERE status != 'archived'`).all()).results ?? [];
  const sessions = (await env.DB.prepare(`SELECT * FROM program_sessions WHERE visible = 1`).all()).results ?? [];
  const prices = (await env.DB.prepare(`SELECT * FROM program_prices WHERE active = 1`).all()).results ?? [];
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
    byProgram[p.id] = { ...p, sessions: [], prices: [], active_semester };
  }
  for (const s of sessions as any[]) {
    if (byProgram[s.program_id]) byProgram[s.program_id].sessions.push(s);
  }
  for (const pr of prices as any[]) {
    if (byProgram[pr.program_id]) byProgram[pr.program_id].prices.push(pr);
  }

  return json({ programs: Object.values(byProgram) });
}

