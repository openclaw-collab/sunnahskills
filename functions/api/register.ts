// /functions/api/register.ts
// Handle program registration submissions

interface Env {
  DB: D1Database;
}

interface RegistrationData {
  programId: string;
  programName: string;
  formData: Record<string, any>;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  // Handle CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body: RegistrationData = await request.json();
    
    // Validate required fields
    if (!body.programId || !body.programName || !body.formData) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: programId, programName, and formData are required' 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Check if database is available
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not configured. Please set up D1 database.' 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // Insert registration into database
    const { success } = await env.DB.prepare(`
      INSERT INTO registrations (program_id, program_name, form_data, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      body.programId,
      body.programName,
      JSON.stringify(body.formData),
      'pending'
    ).run();

    if (success) {
      return new Response(JSON.stringify({ 
        message: 'Registration submitted successfully',
        registrationId: body.programId,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } else {
      throw new Error('Failed to insert registration');
    }

  } catch (error) {
    console.error('Error processing registration:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process registration. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}