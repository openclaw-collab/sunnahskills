// /functions/api/admin.ts

interface Env {
  DB: D1Database;
}

// Cloudflare D1 Database type
declare global {
  interface D1Database {
    prepare: (query: string) => any;
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const url = new URL(request.url);
  const password = url.searchParams.get('password');
  
  // Simple password protection (replace with your desired password)
  if (password !== 'admin123') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Get all contacts from database
    const { results } = await env.DB.prepare(`
      SELECT * FROM contacts ORDER BY timestamp DESC
    `).all();
    
    return new Response(JSON.stringify({
      contacts: results || [],
      total: results?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return new Response(JSON.stringify({ 
      error: 'Database error',
      contacts: [],
      total: 0,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 