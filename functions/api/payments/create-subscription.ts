interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestPost({ env }: { request: Request; env: Env }) {
  // NOTE: Subscription support requires mapping program prices to Stripe Price IDs.
  // We’ll add that via program_prices.metadata once Stripe is configured.
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  if (!env.STRIPE_SECRET_KEY) return json({ error: "Stripe not configured" }, { status: 500 });
  return json({ error: "Subscription endpoint not implemented yet" }, { status: 501 });
}

