// /functions/api/admin.ts
// Updated to handle database errors gracefully

interface Env {
  DB: D1Database;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

interface Registration {
  id: number;
  program_id: string;
  program_name: string;
  form_data: string;
  status: string;
  created_at: string;
  updated_at: string;
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
  
  // Test response to see if function is deployed
  if (password === 'test') {
    return new Response(JSON.stringify({ 
      message: "Function is deployed and working!",
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Simple password protection (replace with your desired password)
  if (password !== 'admin123') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Check if database is available
    if (env.DB) {
      // Get all contacts from database
      const contactsResult = await env.DB.prepare(`
        SELECT * FROM contacts ORDER BY timestamp DESC
      `).all();
      
      // Get all registrations from database
      const registrationsResult = await env.DB.prepare(`
        SELECT * FROM registrations ORDER BY created_at DESC
      `).all();
      
      return new Response(JSON.stringify({
        contacts: contactsResult?.results || [],
        registrations: registrationsResult?.results || [],
        totalContacts: contactsResult?.results?.length || 0,
        totalRegistrations: registrationsResult?.results?.length || 0,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Database not set up yet - return empty data but allow login
      return new Response(JSON.stringify({
        contacts: [],
        registrations: [],
        totalContacts: 0,
        totalRegistrations: 0,
        timestamp: new Date().toISOString(),
        message: "Database not configured yet. Set up D1 database to store submissions."
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    // Return empty data but allow login even if database has issues
    return new Response(JSON.stringify({ 
      contacts: [],
      registrations: [],
      totalContacts: 0,
      totalRegistrations: 0,
      timestamp: new Date().toISOString(),
      message: "Database error. Set up D1 database to store submissions."
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 