// _worker.js - Cloudflare Pages Functions
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Handle /api/contact endpoint
  if (url.pathname === '/api/contact') {
    if (request.method === 'GET') {
      return new Response(JSON.stringify([]), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (request.method === 'POST') {
      try {
        const data = await request.json();
        
        // Basic validation
        if (!data.name || !data.email || !data.subject || !data.message) {
          return new Response(JSON.stringify({ message: "Missing required fields" }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        const contact = {
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          timestamp: new Date().toISOString()
        };
        
        return new Response(JSON.stringify({ 
          message: "Message sent successfully! We'll respond within 24 hours.",
          contact 
        }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ message: "Internal server error" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  }
  
  // Handle /api/health endpoint
  if (url.pathname === '/api/health') {
    return new Response(JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "sunnah-skills-api"
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // For all other requests, let the static site handle it
  return context.next();
} 