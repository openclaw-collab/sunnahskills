import { getAdminFromRequest, hasAdminPermission } from "../../_utils/adminAuth";
import { sendMailChannelsEmail } from "../../_utils/email";

interface Env {
  DB: D1Database;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  RESEND_API_KEY?: string;
  RESEND_API_URL?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return char;
    }
  });
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "contacts", "read")) return json({ error: "Forbidden" }, { status: 403 });

  const { results } = await env.DB.prepare(
    `SELECT * FROM contacts ORDER BY timestamp DESC LIMIT 500`,
  ).all();

  return json({ contacts: results ?? [] });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const admin = await getAdminFromRequest(env, request);
  if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminPermission(admin, "contacts", "write")) return json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | { contactId?: number; subject?: string; message?: string }
    | null;
  const contactId = Number(body?.contactId);
  const subject = body?.subject?.trim() || "Re: Sunnah Skills";
  const message = body?.message?.trim() || "";

  if (!Number.isInteger(contactId) || contactId <= 0) {
    return json({ error: "Valid contactId is required" }, { status: 400 });
  }
  if (message.length < 2) {
    return json({ error: "Reply message is required" }, { status: 400 });
  }

  const contact = await env.DB.prepare(
    `SELECT id, name, email, message FROM contacts WHERE id = ? LIMIT 1`,
  )
    .bind(contactId)
    .first<{ id: number; name: string; email: string; message: string }>();
  if (!contact?.email) return json({ error: "Contact not found" }, { status: 404 });

  const sent = await sendMailChannelsEmail(env, {
    to: { email: String(contact.email), name: String(contact.name || "Sunnah Skills Parent") },
    from: { email: env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev", name: "Sunnah Skills" },
    replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
    subject,
    text: message,
    html: `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
  });

  if (!sent) return json({ error: "Email could not be sent" }, { status: 502 });
  return json({ ok: true });
}
