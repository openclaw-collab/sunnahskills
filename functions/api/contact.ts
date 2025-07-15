// /functions/api/contact.ts

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// In-memory storage (replace with D1 or KV for production)
const contacts: ContactForm[] = [];

export async function onRequestPost({ request }: { request: Request }) {
  try {
    const data = await request.json();
    // Basic validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const contact: ContactForm = {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    };
    contacts.push(contact);
    return new Response(
      JSON.stringify({ message: "Message sent successfully! We'll respond within 24 hours.", contact }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestGet({ request }: { request: Request }) {
  const url = new URL(request.url);
  const admin = url.searchParams.get('admin');
  const password = url.searchParams.get('password');
  
  // Admin access with password protection
  if (admin === 'true') {
    if (password !== 'admin123') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({
      contacts,
      total: contacts.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Regular GET - return empty array (for public access)
  return new Response(
    JSON.stringify(contacts),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );
} 