// /functions/api/contact.ts
import { sendMailChannelsEmail } from "../_utils/email";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}

interface Env {
  DB: D1Database;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  RESEND_API_KEY?: string;
  RESEND_API_URL?: string;
}

// Cloudflare D1 Database type
declare global {
  interface D1Database {
    prepare: (query: string) => any;
  }
}

// Email notification function (Resend via shared sender utility)
async function sendEmailNotification(contact: ContactForm, env: Env) {
  try {
    const sent = await sendMailChannelsEmail(env, {
      to: { email: env.EMAIL_TO ?? "mysunnahskill@gmail.com", name: "Sunnah Skills Admin" },
      from: { email: env.EMAIL_FROM ?? "admin@sunnahskills.com", name: "Sunnah Skills Contact Form" },
      replyTo: { email: contact.email, name: contact.name },
      subject: `New Contact Form Submission: ${contact.subject}`,
      text: `
New contact form submission received:

Name: ${contact.name}
Email: ${contact.email}
Subject: ${contact.subject}
Message: ${contact.message}
Timestamp: ${contact.timestamp}

---
Sunnah Skills Contact Form
      `,
      html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${contact.name}</p>
<p><strong>Email:</strong> ${contact.email}</p>
<p><strong>Subject:</strong> ${contact.subject}</p>
<p><strong>Message:</strong></p>
<p>${contact.message.replace(/\n/g, '<br>')}</p>
<p><strong>Timestamp:</strong> ${contact.timestamp}</p>
<hr>
<p><em>Sunnah Skills Contact Form</em></p>
      `,
    });

    if (!sent) {
      console.error("Failed to send contact notification email");
    } else {
      console.log("Email notification sent successfully");
    }

    return sent;
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return false;
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
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
      timestamp: new Date().toISOString()
    };
    
    // Store in D1 database
    const result = await env.DB.prepare(`
      INSERT INTO contacts (name, email, subject, message, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(contact.name, contact.email, contact.subject, contact.message, contact.timestamp)
    .run();
    
    if (!result.success) {
      throw new Error('Failed to store contact in database');
    }
    
    // Send email notification
    await sendEmailNotification(contact, env);
    
    console.log('Contact submitted and stored:', contact);
    
    return new Response(
      JSON.stringify({ 
        message: "Message sent successfully! We'll respond within 24 hours.", 
        contact,
        id: result.meta.last_row_id 
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('Error processing contact submission:', error);
    return new Response(
      JSON.stringify({ message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  const url = new URL(request.url);
  const admin = url.searchParams.get('admin');
  const password = url.searchParams.get('password');
  
  try {
    // Admin access with password protection
    if (admin === 'true') {
      if (password !== 'admin123') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Get all contacts from database
      const { results } = await env.DB.prepare(`
        SELECT * FROM contacts ORDER BY timestamp DESC
      `).all();
      
      return new Response(JSON.stringify({
        contacts: results,
        total: results.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Regular GET - return empty array for public access
    return new Response(
      JSON.stringify([]),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return new Response(
      JSON.stringify({ error: 'Database error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 
