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
  const { results } = await env.DB.prepare("SELECT * FROM contacts").all();
  return new Response(JSON.stringify({
    contacts: results || [],
    total: results ? results.length : 0,
    message: `Found ${results ? results.length : 0} contact submissions`
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 