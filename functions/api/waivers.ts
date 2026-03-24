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
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") ?? "registration").trim();
  const waiver = await env.DB.prepare(
    `SELECT id, slug, title, body_html, version_label, published_at
     FROM waiver_documents
     WHERE slug = ? AND active = 1
     ORDER BY published_at DESC, id DESC
     LIMIT 1`,
  )
    .bind(slug)
    .first();
  return json({ waiver: waiver ?? null });
}
