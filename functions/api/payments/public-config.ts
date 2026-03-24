interface Env {
  STRIPE_PUBLISHABLE_KEY?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function onRequestGet({ env }: { env: Env }) {
  const publishableKey = (
    env.VITE_STRIPE_PUBLISHABLE_KEY ??
    env.STRIPE_PUBLISHABLE_KEY ??
    ""
  ).trim();
  return json({
    publishableKey,
    configured: Boolean(publishableKey),
  });
}
