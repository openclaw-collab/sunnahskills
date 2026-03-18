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

  const byProgram: Record<string, any> = {};
  for (const p of programs as any[]) {
    byProgram[p.id] = { ...p, sessions: [], prices: [] };
  }
  for (const s of sessions as any[]) {
    if (byProgram[s.program_id]) byProgram[s.program_id].sessions.push(s);
  }
  for (const pr of prices as any[]) {
    if (byProgram[pr.program_id]) byProgram[pr.program_id].prices.push(pr);
  }

  return json({ programs: Object.values(byProgram) });
}

