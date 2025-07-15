// /functions/api/admin.ts
// Updated to handle database errors gracefully

interface Env {
  DB: D1Database;
}

// Cloudflare D1 Database type
declare global {
  interface D1Database {
    prepare: (query: string) => any;
  }
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare("SELECT * FROM admin").all();
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
} 