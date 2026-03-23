import { z } from "zod";
import { sendMailChannelsEmail } from "../../_utils/email";
import { adminNewRegistrationEmail, registrationConfirmationEmail, waitlistConfirmationEmail } from "../../_utils/emailTemplates";
import {
  bjjTrialClassOptions,
  bjjTrackOptions,
  guardianRelationshipOptions,
  studentGenderOptions,
  studentSkillLevelOptions,
} from "../../../shared/registration-options";
import {
  computeLaterPaymentDateIso,
  computeLineTuitionCents,
  kidsSiblingRankForLine,
  splitPaymentPlan,
  type SemesterRow,
} from "../../../shared/orderPricing";

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

const studentSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  preferredName: z.string().trim().optional().default(""),
  dateOfBirth: z.string().trim().min(1),
  age: z.number().int().nullable().optional(),
  gender: z.string().trim().optional().default(""),
  skillLevel: z.string().trim().optional().default(""),
  medicalNotes: z.string().trim().optional().default(""),
});

const guardianSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(7).max(32),
  emergencyContactName: z.string().trim().optional().default(""),
  emergencyContactPhone: z.string().trim().optional().default(""),
  relationship: z.string().trim().min(1),
  notes: z.string().optional().default(""),
});

const bjjProgramDetailsSchema = z.object({
  sessionId: z.number().int().positive().nullable().optional(),
  priceId: z.number().int().positive().nullable().optional(),
  preferredStartDate: z.string().trim().optional().default(""),
  scheduleChoice: z.string().trim().optional().default(""),
  programSpecific: z
    .object({
      bjjTrack: z.string().optional().default(""),
      trialClass: z.string().optional().default(""),
      notes: z.string().optional().default(""),
    })
    .optional()
    .default({}),
});

const cartLineSchema = z.object({
  student: studentSchema,
  programDetails: bjjProgramDetailsSchema,
  paymentChoice: z.enum(["full", "plan"]),
});

const cartPayloadSchema = z.object({
  guardian: guardianSchema,
  lines: z.array(cartLineSchema).min(1).max(10),
  waivers: z.object({
    liabilityWaiver: z.boolean(),
    photoConsent: z.boolean(),
    medicalConsent: z.boolean(),
    termsAgreement: z.boolean(),
    signatureText: z.string().trim().min(2).max(120),
    signedAt: z.string().trim().min(1),
  }),
});

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sanitizePhone(value: string) {
  const normalized = value.trim().replace(/[^\d+()\-\s]/g, "");
  return normalized.replace(/\s+/g, " ");
}

function sanitizeFreeText(value: string, maxLength = 1000) {
  return compactWhitespace(value).slice(0, maxLength);
}

function isValidPastDate(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= Date.now();
}

function hasAtLeastTenDigits(value: string) {
  return value.replace(/[^\d]/g, "").length >= 10;
}

function isAllowedValue(value: string, allowed: readonly { value: string }[]) {
  return allowed.some((opt) => opt.value === value);
}

async function insertGuardian(
  env: Env,
  guardian: z.infer<typeof guardianSchema>,
) {
  const result = await env.DB.prepare(
    `INSERT INTO guardians (full_name, email, phone, emergency_contact_name, emergency_contact_phone, relationship, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      compactWhitespace(guardian.fullName),
      guardian.email.trim().toLowerCase(),
      sanitizePhone(guardian.phone),
      compactWhitespace(guardian.emergencyContactName) || null,
      sanitizePhone(guardian.emergencyContactPhone) || null,
      compactWhitespace(guardian.relationship) || null,
    )
    .run();
  return result.meta?.last_row_id as number | undefined;
}

async function insertStudent(env: Env, guardianId: number, student: z.infer<typeof studentSchema>) {
  const result = await env.DB.prepare(
    `INSERT INTO students (guardian_id, full_name, preferred_name, date_of_birth, age, gender, prior_experience, skill_level, medical_notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardianId,
      compactWhitespace(student.fullName),
      compactWhitespace(student.preferredName) || null,
      student.dateOfBirth || null,
      student.age ?? null,
      compactWhitespace(student.gender) || null,
      null,
      compactWhitespace(student.skillLevel) || null,
      sanitizeFreeText(student.medicalNotes, 1500) || null,
    )
    .run();
  return result.meta?.last_row_id as number | undefined;
}

async function insertRegistration(
  env: Env,
  params: {
    guardianId: number;
    studentId: number;
    programId: string;
    sessionId: number | null;
    priceId: number | null;
    status: "submitted" | "waitlisted";
    preferredStartDate: string;
    scheduleChoice: string;
    programSpecific: Record<string, unknown>;
    guardianNotes: string;
    enrollmentOrderId: number;
    paymentChoice: "full" | "plan";
    lineSubtotalCents: number;
    siblingDiscountApplied: number;
  },
) {
  const result = await env.DB.prepare(
    `INSERT INTO registrations (
      guardian_id, student_id, program_id,
      session_id, price_id,
      status, preferred_start_date, schedule_choice,
      program_specific_data,
      enrollment_order_id, payment_choice, line_subtotal_cents, sibling_discount_applied,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  )
    .bind(
      params.guardianId,
      params.studentId,
      params.programId,
      params.sessionId,
      params.priceId,
      params.status,
      params.preferredStartDate || null,
      params.scheduleChoice || null,
      JSON.stringify({
        ...params.programSpecific,
        guardianNotes: params.guardianNotes || undefined,
      }),
      params.enrollmentOrderId,
      params.paymentChoice,
      params.lineSubtotalCents,
      params.siblingDiscountApplied,
    )
    .run();
  return result.meta?.last_row_id as number | undefined;
}

async function insertWaivers(env: Env, registrationId: number, waivers: z.infer<typeof cartPayloadSchema>["waivers"]) {
  await env.DB.prepare(
    `INSERT INTO waivers (
      registration_id,
      liability_waiver, photo_consent, medical_consent, terms_agreement,
      signature_text, signed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      registrationId,
      waivers.liabilityWaiver ? 1 : 0,
      waivers.photoConsent ? 1 : 0,
      waivers.medicalConsent ? 1 : 0,
      waivers.termsAgreement ? 1 : 0,
      compactWhitespace(waivers.signatureText),
      new Date(waivers.signedAt).toISOString(),
    )
    .run();
}

function validateLine(
  line: z.infer<typeof cartLineSchema>,
  guardian: z.infer<typeof guardianSchema>,
  waivers: z.infer<typeof cartPayloadSchema>["waivers"],
): string | null {
  if (guardian.fullName.length < 2) return "Guardian full name is required";
  if (!waivers.signatureText) return "Signature is required";
  if (!isValidPastDate(line.student.dateOfBirth)) return "Date of birth must be a valid past date";
  if (!isValidPastDate(waivers.signedAt)) return "Signed date must be a valid past date";
  if (!hasAtLeastTenDigits(guardian.phone)) return "Guardian phone number is required";
  if (guardian.emergencyContactPhone && !hasAtLeastTenDigits(guardian.emergencyContactPhone)) {
    return "Emergency contact phone number is invalid";
  }
  if (!isAllowedValue(guardian.relationship, guardianRelationshipOptions)) {
    return "Please select a valid relationship";
  }
  if (line.student.fullName.length < 2) return "Student full name is required";
  if (line.student.gender && !isAllowedValue(line.student.gender, studentGenderOptions)) {
    return "Please select a valid gender option";
  }
  if (line.student.skillLevel && !isAllowedValue(line.student.skillLevel, studentSkillLevelOptions)) {
    return "Please select a valid experience level";
  }
  const ps = line.programDetails.programSpecific;
  if (!isAllowedValue(String(ps.bjjTrack ?? ""), bjjTrackOptions)) return "Please select a valid class track";
  if (!isAllowedValue(String(ps.trialClass ?? ""), bjjTrialClassOptions)) return "Please select a valid trial option";
  if (!line.programDetails.sessionId) return "Please select a class session";
  if (!line.programDetails.priceId) return "Pricing is missing — pick a track again";
  return null;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const parsed = cartPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const body = parsed.data;
  const guardian = {
    ...body.guardian,
    fullName: compactWhitespace(body.guardian.fullName),
    email: body.guardian.email.trim().toLowerCase(),
    phone: sanitizePhone(body.guardian.phone),
    emergencyContactName: compactWhitespace(body.guardian.emergencyContactName),
    emergencyContactPhone: sanitizePhone(body.guardian.emergencyContactPhone),
    relationship: compactWhitespace(body.guardian.relationship),
    notes: sanitizeFreeText(body.guardian.notes ?? "", 1500),
  };

  const waivers = {
    ...body.waivers,
    signatureText: compactWhitespace(body.waivers.signatureText),
    signedAt: body.waivers.signedAt.trim(),
  };

  for (let i = 0; i < body.lines.length; i++) {
    const err = validateLine(body.lines[i], guardian, waivers);
    if (err) return json({ error: err, line: i }, { status: 400 });
  }

  const program = await env.DB.prepare(`SELECT id, slug, name, status FROM programs WHERE slug = 'bjj'`)
    .first<{ id: string; slug: string; name: string; status: string | null }>();
  if (!program?.id) return json({ error: "Program not found" }, { status: 404 });

  const semesterRow = await env.DB.prepare(
    `SELECT classes_in_semester, price_per_class_cents, registration_fee_cents, later_payment_date, start_date, end_date
     FROM semesters WHERE program_id = 'bjj' AND active = 1 ORDER BY id DESC LIMIT 1`,
  ).first<SemesterRow>();
  const semester: SemesterRow | null = semesterRow ?? null;

  const linesMeta: {
    waitlisted: boolean;
    sessionId: number | null;
    track: string;
    priceId: number | null;
    pricing: ReturnType<typeof computeLineTuitionCents> & { dueTodayCents: number; dueLaterCents: number };
  }[] = [];

  for (let i = 0; i < body.lines.length; i++) {
    const line = body.lines[i];
    const ps = line.programDetails.programSpecific;
    const track = String(ps.bjjTrack ?? "");

    if (line.programDetails.sessionId) {
      const sess = await env.DB.prepare(`SELECT age_group FROM program_sessions WHERE id = ? AND program_id = 'bjj'`)
        .bind(line.programDetails.sessionId)
        .first<{ age_group: string | null }>();
      if (sess?.age_group && track && sess.age_group !== track) {
        return json({ error: "Selected session does not match the chosen track.", line: i }, { status: 400 });
      }
    }

    let waitlisted = false;
    if (line.programDetails.sessionId) {
      const session = await env.DB.prepare(`SELECT capacity, enrolled_count FROM program_sessions WHERE id = ?`)
        .bind(line.programDetails.sessionId)
        .first<{ capacity: number | null; enrolled_count: number | null }>();
      if (session && session.capacity != null && Number(session.enrolled_count ?? 0) >= Number(session.capacity)) {
        waitlisted = true;
      }
    }

    const priceRow = line.programDetails.priceId
      ? await env.DB.prepare(`SELECT amount, registration_fee, frequency, metadata FROM program_prices WHERE id = ?`)
          .bind(line.programDetails.priceId)
          .first<{ amount: number | null; registration_fee: number | null; frequency: string | null; metadata: string | null }>()
      : null;

    const rank = kidsSiblingRankForLine(
      body.lines.map((l) => ({
        track: String(l.programDetails.programSpecific.bjjTrack ?? ""),
        student: l.student,
      })),
      i,
    );

    const base = computeLineTuitionCents({
      track,
      priceId: line.programDetails.priceId ?? null,
      programPriceAmount: priceRow?.amount ?? null,
      programPriceRegFee: priceRow?.registration_fee ?? null,
      programPriceFrequency: priceRow?.frequency ?? null,
      priceMetadataJson: priceRow?.metadata ?? null,
      paymentChoice: line.paymentChoice,
      siblingRankAmongKidsStudents: rank,
      semester,
    });
    const split = splitPaymentPlan(base.afterSiblingCents, line.paymentChoice);
    linesMeta.push({
      waitlisted,
      sessionId: line.programDetails.sessionId ?? null,
      track,
      priceId: line.programDetails.priceId ?? null,
      pricing: { ...base, dueTodayCents: split.dueToday, dueLaterCents: split.dueLater },
    });
  }

  const allWaitlisted = linesMeta.length > 0 && linesMeta.every((l) => l.waitlisted);
  const guardianId = await insertGuardian(env, guardian);
  if (!guardianId) return json({ error: "Failed to create guardian" }, { status: 500 });

  const totalAfterSibling = linesMeta.filter((l) => !l.waitlisted).reduce((s, l) => s + l.pricing.afterSiblingCents, 0);
  const totalDueToday = linesMeta.filter((l) => !l.waitlisted).reduce((s, l) => s + l.pricing.dueTodayCents, 0);
  const totalDueLater = linesMeta.filter((l) => !l.waitlisted).reduce((s, l) => s + l.pricing.dueLaterCents, 0);
  const laterDate = allWaitlisted ? null : computeLaterPaymentDateIso(semester);
  const orderStatus = allWaitlisted ? "waitlisted" : "pending_payment";

  const orderInsert = await env.DB.prepare(
    `INSERT INTO enrollment_orders (
      guardian_id, status, total_cents, amount_due_today_cents,
      later_amount_cents, later_payment_date, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardianId,
      orderStatus,
      totalAfterSibling,
      totalDueToday,
      totalDueLater,
      laterDate,
      JSON.stringify({ lineCount: body.lines.length, program: "bjj" }),
    )
    .run();
  const orderId = orderInsert.meta?.last_row_id as number | undefined;
  if (!orderId) return json({ error: "Failed to create order" }, { status: 500 });

  const registrationIds: number[] = [];
  const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";
  const siteUrl = env.SITE_URL;

  for (let i = 0; i < body.lines.length; i++) {
    const line = body.lines[i];
    const meta = linesMeta[i];
    const ps = line.programDetails.programSpecific;

    const studentId = await insertStudent(env, guardianId, line.student);
    if (!studentId) return json({ error: "Failed to create student", line: i }, { status: 500 });

    const registrationId = await insertRegistration(env, {
      guardianId,
      studentId,
      programId: program.id,
      sessionId: meta.sessionId,
      priceId: meta.priceId,
      status: meta.waitlisted ? "waitlisted" : "submitted",
      preferredStartDate: line.programDetails.preferredStartDate ?? "",
      scheduleChoice: line.programDetails.scheduleChoice ?? "",
      programSpecific: { bjjTrack: ps.bjjTrack, trialClass: ps.trialClass, notes: ps.notes ?? "" },
      guardianNotes: guardian.notes,
      enrollmentOrderId: orderId,
      paymentChoice: line.paymentChoice,
      lineSubtotalCents: meta.pricing.lineSubtotalCents,
      siblingDiscountApplied: meta.pricing.siblingDiscountCents,
    });
    if (!registrationId) return json({ error: "Failed to create registration", line: i }, { status: 500 });

    await insertWaivers(env, registrationId, waivers);
    registrationIds.push(registrationId);

    try {
      const waitlisted = meta.waitlisted;
      const wlPos = waitlisted
        ? Number(
            (
              await env.DB.prepare(
                `SELECT COUNT(*) as cnt FROM registrations WHERE session_id = ? AND status = 'waitlisted'`,
              )
                .bind(meta.sessionId)
                .first<{ cnt: number }>(),
            )?.cnt ?? 1,
          )
        : 0;

      if (waitlisted) {
        const userMsg = waitlistConfirmationEmail({
          name: guardian.fullName,
          programName: String(program.name),
          siteUrl,
        });
        await sendMailChannelsEmail(env, {
          to: { email: guardian.email, name: guardian.fullName },
          from: { email: fromEmail, name: "Sunnah Skills" },
          replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
          subject: userMsg.subject,
          text: userMsg.text,
          html: userMsg.html,
        });
      } else {
        const userMsg = registrationConfirmationEmail({
          guardianName: guardian.fullName,
          studentName: line.student.fullName,
          programName: String(program.name),
          registrationId,
          siteUrl,
        });
        await sendMailChannelsEmail(env, {
          to: { email: guardian.email, name: guardian.fullName },
          from: { email: fromEmail, name: "Sunnah Skills" },
          replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
          subject: userMsg.subject,
          text: userMsg.text,
          html: userMsg.html,
        });
      }

      if (env.EMAIL_TO) {
        const adminMsg = adminNewRegistrationEmail({
          guardianName: guardian.fullName,
          guardianEmail: guardian.email,
          studentName: `${line.student.fullName}${waitlisted ? " (waitlisted)" : ""}`,
          programName: String(program.name),
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
      /* best-effort */
    }
  }

  return json({
    ok: true,
    enrollmentOrderId: orderId,
    registrationIds,
    summary: {
      totalAfterSiblingCents: totalAfterSibling,
      dueTodayCents: totalDueToday,
      dueLaterCents: totalDueLater,
      laterPaymentDate: laterDate,
      waitlisted: allWaitlisted,
      mixedWaitlist: linesMeta.some((l) => l.waitlisted) && !allWaitlisted,
    },
  });
}
