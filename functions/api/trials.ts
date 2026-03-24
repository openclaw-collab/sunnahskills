import { z } from "zod";
import { sendMailChannelsEmail } from "../_utils/email";
import { freeTrialConfirmationEmail } from "../_utils/emailTemplates";

interface Env {
  DB: D1Database;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  SITE_URL?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

const trialSchema = z.object({
  accountHolderName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(7).max(32),
  participantType: z.enum(["self", "child"]),
  participantName: z.string().trim().min(2).max(120),
  participantAge: z.number().int().min(5).max(100),
  participantGender: z.string().trim().min(1).max(32),
  desiredDate: z.string().trim().min(1),
  programId: z.literal("bjj"),
  notes: z.string().trim().max(1500).optional().default(""),
});

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const parsed = trialSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const body = parsed.data;
  const qrToken = crypto.randomUUID().replace(/-/g, "") + Math.random().toString(36).slice(2, 10).toUpperCase();
  const desiredDate = body.desiredDate.trim();
  const siteUrl = (env.SITE_URL ?? "http://localhost:8788").replace(/\/$/, "");
  const qrVerifyUrl = `${siteUrl}/admin/dashboard/trials?trialToken=${encodeURIComponent(qrToken)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrVerifyUrl)}`;

  const result = await env.DB.prepare(
    `INSERT INTO trial_bookings (
      program_id, account_holder_name, email, phone, participant_type, participant_full_name,
      participant_age, participant_gender, desired_date, notes, qr_token, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'booked', datetime('now'))`,
  )
    .bind(
      body.programId,
      compactWhitespace(body.accountHolderName),
      body.email,
      compactWhitespace(body.phone),
      body.participantType,
      compactWhitespace(body.participantName),
      body.participantAge,
      compactWhitespace(body.participantGender),
      desiredDate,
      compactWhitespace(body.notes ?? "") || null,
      qrToken,
    )
    .run();

  const bookingId = Number(result.meta?.last_row_id ?? 0);
  const email = freeTrialConfirmationEmail({
    accountHolderName: body.accountHolderName,
    participantName: body.participantName,
    participantType: body.participantType,
    desiredDate,
    programName: "Brazilian Jiu-Jitsu",
    qrImageUrl,
    qrVerifyUrl,
  });

  const sent = await sendMailChannelsEmail(env, {
    to: { email: body.email, name: body.accountHolderName },
    from: { email: env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev", name: "Sunnah Skills" },
    replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
    subject: email.subject,
    text: email.text,
    html: email.html,
  }).catch(() => false);

  return json({
    ok: true,
    trialBookingId: bookingId,
    qrToken,
    emailSent: sent,
    message: sent
      ? "Free trial booked. Check your email for the confirmation QR code."
      : "Free trial booked, but we could not send the confirmation email right now. Please contact us before class so we can confirm your visit.",
  });
}
