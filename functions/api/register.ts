import { z } from "zod";
import { sendMailChannelsEmail } from "../_utils/email";
import { adminNewRegistrationEmail, registrationConfirmationEmail } from "../_utils/emailTemplates";

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

const registrationPayloadSchema = z.object({
  programSlug: z.enum(["bjj", "archery", "outdoor", "bullyproofing"]),
  guardian: z.object({
    fullName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    emergencyContactName: z.string().optional().default(""),
    emergencyContactPhone: z.string().optional().default(""),
    relationship: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  }),
  student: z.object({
    fullName: z.string().min(1),
    preferredName: z.string().optional().default(""),
    dateOfBirth: z.string().optional().default(""),
    age: z.number().int().nullable().optional(),
    gender: z.string().optional().default(""),
    priorExperience: z.string().optional().default(""),
    skillLevel: z.string().optional().default(""),
    medicalNotes: z.string().optional().default(""),
  }),
  programDetails: z.object({
    sessionId: z.number().int().nullable().optional(),
    priceId: z.number().int().nullable().optional(),
    preferredStartDate: z.string().optional().default(""),
    scheduleChoice: z.string().optional().default(""),
    programSpecific: z.record(z.any()).optional().default({}),
  }),
  waivers: z.object({
    liabilityWaiver: z.boolean(),
    photoConsent: z.boolean(),
    medicalConsent: z.boolean(),
    termsAgreement: z.boolean(),
    signatureText: z.string().optional().default(""),
    signedAt: z.string().optional().default(""),
  }),
});

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const parsed = registrationPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const body = parsed.data;

  const program = await env.DB.prepare(`SELECT id, slug FROM programs WHERE slug = ?`)
    .bind(body.programSlug)
    .first();
  if (!program?.id) return json({ error: "Program not found" }, { status: 404 });

  const guardianRes = await env.DB.prepare(
    `
    INSERT INTO guardians (
      full_name, email, phone,
      emergency_contact_name, emergency_contact_phone,
      relationship, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `,
  )
    .bind(
      body.guardian.fullName,
      body.guardian.email,
      body.guardian.phone,
      body.guardian.emergencyContactName || null,
      body.guardian.emergencyContactPhone || null,
      body.guardian.relationship || null,
    )
    .run();

  const guardianId = guardianRes.meta?.last_row_id as number | undefined;
  if (!guardianId) return json({ error: "Failed to create guardian" }, { status: 500 });

  const studentRes = await env.DB.prepare(
    `
    INSERT INTO students (
      guardian_id, full_name, preferred_name, date_of_birth, age, gender,
      prior_experience, skill_level, medical_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
  )
    .bind(
      guardianId,
      body.student.fullName,
      body.student.preferredName || null,
      body.student.dateOfBirth || null,
      body.student.age ?? null,
      body.student.gender || null,
      body.student.priorExperience || null,
      body.student.skillLevel || null,
      body.student.medicalNotes || null,
    )
    .run();

  const studentId = studentRes.meta?.last_row_id as number | undefined;
  if (!studentId) return json({ error: "Failed to create student" }, { status: 500 });

  const registrationRes = await env.DB.prepare(
    `
    INSERT INTO registrations (
      guardian_id, student_id, program_id,
      session_id, price_id,
      status, preferred_start_date, schedule_choice,
      program_specific_data,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'submitted', ?, ?, ?, datetime('now'), datetime('now'))
    `,
  )
    .bind(
      guardianId,
      studentId,
      program.id,
      body.programDetails.sessionId ?? null,
      body.programDetails.priceId ?? null,
      body.programDetails.preferredStartDate || null,
      body.programDetails.scheduleChoice || null,
      JSON.stringify({
        ...body.programDetails.programSpecific,
        guardianNotes: body.guardian.notes || undefined,
      }),
    )
    .run();

  const registrationId = registrationRes.meta?.last_row_id as number | undefined;
  if (!registrationId) return json({ error: "Failed to create registration" }, { status: 500 });

  await env.DB.prepare(
    `
    INSERT INTO waivers (
      registration_id,
      liability_waiver, photo_consent, medical_consent, terms_agreement,
      signature_text, signed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
  )
    .bind(
      registrationId,
      body.waivers.liabilityWaiver ? 1 : 0,
      body.waivers.photoConsent ? 1 : 0,
      body.waivers.medicalConsent ? 1 : 0,
      body.waivers.termsAgreement ? 1 : 0,
      body.waivers.signatureText || null,
      body.waivers.signedAt ? new Date(body.waivers.signedAt).toISOString() : null,
    )
    .run();

  const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";
  const siteUrl = env.SITE_URL;
  const programName = String((await env.DB.prepare(`SELECT name FROM programs WHERE id = ?`).bind(program.id).first())?.name ?? body.programSlug);

  // Best-effort emails (do not block registration on email failure)
  try {
    const guardianEmail = body.guardian.email;
    const guardianName = body.guardian.fullName;
    const studentName = body.student.fullName;

    const userMsg = registrationConfirmationEmail({
      guardianName,
      studentName,
      programName,
      registrationId,
      siteUrl,
    });
    await sendMailChannelsEmail(env, {
      to: { email: guardianEmail, name: guardianName },
      from: { email: fromEmail, name: "Sunnah Skills" },
      replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
      subject: userMsg.subject,
      text: userMsg.text,
      html: userMsg.html,
    });

    if (env.EMAIL_TO) {
      const adminMsg = adminNewRegistrationEmail({
        guardianName,
        guardianEmail,
        studentName,
        programName,
        registrationId,
        siteUrl,
      });
      await sendMailChannelsEmail(env, {
        to: { email: env.EMAIL_TO, name: "Sunnah Skills Admin" },
        from: { email: fromEmail, name: "Sunnah Skills" },
        subject: adminMsg.subject,
        text: adminMsg.text,
        html: adminMsg.html,
      });
    }
  } catch {
    // swallow
  }

  return json({
    ok: true,
    registrationId,
    status: "submitted",
  });
}