// /functions/api/admin.ts

export async function onRequestGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const password = url.searchParams.get('password');
  
  // Simple password protection (replace with your desired password)
  if (password !== 'admin123') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Import the contacts from the contact function
  // Note: This is a simplified approach - in production, use a database
  const contacts = []; // This would need to be shared between functions
  
  return new Response(JSON.stringify({
    contacts,
    total: contacts.length,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 