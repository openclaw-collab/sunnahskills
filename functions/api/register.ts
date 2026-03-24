import { z } from "zod";
import { sendMailChannelsEmail } from "../_utils/email";
import {
  adminNewRegistrationEmail,
  registrationConfirmationEmail,
  waitlistConfirmationEmail,
} from "../_utils/emailTemplates";
import {
  archeryDominantHandOptions,
  archeryExperienceOptions,
  archerySessionOptions,
  bjjTrialClassOptions,
  bjjTrackOptions,
  bullyproofingAgeGroupOptions,
  bullyproofingConcernOptions,
  guardianRelationshipOptions,
  outdoorGearOptions,
  outdoorWorkshopDateOptions,
  studentGenderOptions,
  studentSkillLevelOptions,
} from "../../shared/registration-options";

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
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(7).max(32),
    emergencyContactName: z.string().trim().optional().default(""),
    emergencyContactPhone: z.string().trim().optional().default(""),
    relationship: z.string().trim().min(1),
    notes: z.string().optional().default(""),
  }),
  student: z.object({
    fullName: z.string().trim().min(2).max(120),
    preferredName: z.string().trim().optional().default(""),
    dateOfBirth: z.string().trim().min(1),
    age: z.number().int().nullable().optional(),
    gender: z.string().trim().optional().default(""),
    skillLevel: z.string().trim().optional().default(""),
    medicalNotes: z.string().optional().default(""),
  }),
  programDetails: z.object({
    sessionId: z.number().int().positive().nullable().optional(),
    priceId: z.number().int().positive().nullable().optional(),
    preferredStartDate: z.string().trim().optional().default(""),
    scheduleChoice: z.string().trim().optional().default(""),
    programSpecific: z.record(z.any()).optional().default({}),
  }),
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

function sanitizeProgramSpecific(programSlug: string, programSpecific: Record<string, unknown>) {
  switch (programSlug) {
    case "bjj": {
      const bjjTrack = typeof programSpecific.bjjTrack === "string" ? programSpecific.bjjTrack.trim() : "";
      const trialClass = typeof programSpecific.trialClass === "string" ? programSpecific.trialClass.trim() : "";
      return {
        bjjTrack: isAllowedValue(bjjTrack, bjjTrackOptions) ? bjjTrack : "",
        trialClass: isAllowedValue(trialClass, bjjTrialClassOptions) ? trialClass : "",
        notes: sanitizeFreeText(typeof programSpecific.notes === "string" ? programSpecific.notes : "", 1000),
      };
    }
    case "archery": {
      const dominantHand = typeof programSpecific.dominantHand === "string" ? programSpecific.dominantHand.trim() : "";
      const experience = typeof programSpecific.experience === "string" ? programSpecific.experience.trim() : "";
      const sessionDate = typeof programSpecific.sessionDate === "string" ? programSpecific.sessionDate.trim() : "";
      return {
        dominantHand: isAllowedValue(dominantHand, archeryDominantHandOptions) ? dominantHand : "",
        experience: isAllowedValue(experience, archeryExperienceOptions) ? experience : "",
        sessionDate: isAllowedValue(sessionDate, archerySessionOptions) ? sessionDate : "",
        notes: sanitizeFreeText(typeof programSpecific.notes === "string" ? programSpecific.notes : "", 1000),
      };
    }
    case "outdoor": {
      const workshopDate = typeof programSpecific.workshopDate === "string" ? programSpecific.workshopDate.trim() : "";
      const gear = Array.isArray(programSpecific.gear)
        ? programSpecific.gear
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter((item) => isAllowedValue(item, outdoorGearOptions))
        : [];
      return {
        workshopDate: isAllowedValue(workshopDate, outdoorWorkshopDateOptions) ? workshopDate : "",
        gear: gear.slice(0, outdoorGearOptions.length),
        notes: sanitizeFreeText(typeof programSpecific.notes === "string" ? programSpecific.notes : "", 1000),
      };
    }
    case "bullyproofing": {
      const concernType = typeof programSpecific.concernType === "string" ? programSpecific.concernType.trim() : "";
      const ageGroup = typeof programSpecific.ageGroup === "string" ? programSpecific.ageGroup.trim() : "";
      return {
        concernType: isAllowedValue(concernType, bullyproofingConcernOptions) ? concernType : "",
        ageGroup: isAllowedValue(ageGroup, bullyproofingAgeGroupOptions) ? ageGroup : "",
        notes: sanitizeFreeText(typeof programSpecific.notes === "string" ? programSpecific.notes : "", 1000),
      };
    }
    default:
      return {};
  }
}

function sanitizeRegistrationPayload(payload: z.infer<typeof registrationPayloadSchema>) {
  return {
    ...payload,
    guardian: {
      ...payload.guardian,
      fullName: compactWhitespace(payload.guardian.fullName),
      email: payload.guardian.email.trim().toLowerCase(),
      phone: sanitizePhone(payload.guardian.phone),
      emergencyContactName: compactWhitespace(payload.guardian.emergencyContactName),
      emergencyContactPhone: sanitizePhone(payload.guardian.emergencyContactPhone),
      relationship: compactWhitespace(payload.guardian.relationship),
      notes: sanitizeFreeText(payload.guardian.notes, 1500),
    },
    student: {
      ...payload.student,
      fullName: compactWhitespace(payload.student.fullName),
      preferredName: compactWhitespace(payload.student.preferredName),
      dateOfBirth: payload.student.dateOfBirth.trim(),
      gender: compactWhitespace(payload.student.gender),
      skillLevel: compactWhitespace(payload.student.skillLevel),
      medicalNotes: sanitizeFreeText(payload.student.medicalNotes, 1500),
    },
    programDetails: {
      ...payload.programDetails,
      preferredStartDate: payload.programDetails.preferredStartDate.trim(),
      scheduleChoice: sanitizeFreeText(payload.programDetails.scheduleChoice, 250),
      programSpecific: sanitizeProgramSpecific(
        payload.programSlug,
        payload.programDetails.programSpecific ?? {},
      ),
    },
    waivers: {
      ...payload.waivers,
      signatureText: compactWhitespace(payload.waivers.signatureText),
      signedAt: payload.waivers.signedAt.trim(),
    },
  };
}

function validateRegistrationPayload(body: ReturnType<typeof sanitizeRegistrationPayload>) {
  if (body.guardian.fullName.length < 2) return "Guardian full name is required";
  if (body.student.fullName.length < 2) return "Student full name is required";
  if (!body.waivers.signatureText) return "Signature is required";
  if (!isValidPastDate(body.student.dateOfBirth)) return "Date of birth must be a valid past date";
  if (!isValidPastDate(body.waivers.signedAt)) return "Signed date must be a valid past date";
  if (!hasAtLeastTenDigits(body.guardian.phone)) return "Guardian phone number is required";
  if (body.guardian.emergencyContactPhone && !hasAtLeastTenDigits(body.guardian.emergencyContactPhone)) {
    return "Emergency contact phone number is invalid";
  }

  if (!isAllowedValue(body.guardian.relationship, guardianRelationshipOptions)) {
    return "Please select a valid relationship";
  }

  if (body.student.gender && !isAllowedValue(body.student.gender, studentGenderOptions)) {
    return "Please select a valid gender option";
  }
  if (body.student.skillLevel && !isAllowedValue(body.student.skillLevel, studentSkillLevelOptions)) {
    return "Please select a valid experience level";
  }

  const ps = body.programDetails.programSpecific as Record<string, unknown>;
  switch (body.programSlug) {
    case "bjj":
      if (!isAllowedValue(String(ps.bjjTrack ?? ""), bjjTrackOptions)) return "Please select a valid class track";
      if (!isAllowedValue(String(ps.trialClass ?? ""), bjjTrialClassOptions)) return "Please select a valid trial option";
      break;
    case "archery":
      if (!isAllowedValue(String(ps.dominantHand ?? ""), archeryDominantHandOptions)) {
        return "Please select a valid dominant hand";
      }
      if (!isAllowedValue(String(ps.experience ?? ""), archeryExperienceOptions)) {
        return "Please select a valid experience level";
      }
      if (!isAllowedValue(String(ps.sessionDate ?? ""), archerySessionOptions)) {
        return "Please select a valid session";
      }
      break;
    case "outdoor":
      if (!isAllowedValue(String(ps.workshopDate ?? ""), outdoorWorkshopDateOptions)) {
        return "Please select a valid workshop date";
      }
      if (!Array.isArray(ps.gear) || ps.gear.length === 0) {
        return "Please confirm you have the required gear";
      }
      if ((ps.gear as unknown[]).some((item) => typeof item !== "string" || !isAllowedValue(item, outdoorGearOptions))) {
        return "Please confirm valid gear selections";
      }
      break;
    case "bullyproofing":
      if (!isAllowedValue(String(ps.concernType ?? ""), bullyproofingConcernOptions)) {
        return "Please select a valid concern";
      }
      if (!isAllowedValue(String(ps.ageGroup ?? ""), bullyproofingAgeGroupOptions)) {
        return "Please select a valid age group";
      }
      break;
  }

  return null;
}

async function insertGuardian(env: Env, guardian: ReturnType<typeof sanitizeRegistrationPayload>["guardian"]) {
  const result = await env.DB.prepare(
    `INSERT INTO guardians (full_name, email, phone, emergency_contact_name, emergency_contact_phone, relationship, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardian.fullName,
      guardian.email,
      guardian.phone,
      guardian.emergencyContactName || null,
      guardian.emergencyContactPhone || null,
      guardian.relationship || null,
    )
    .run();

  return result.meta?.last_row_id as number | undefined;
}

async function insertStudent(
  env: Env,
  guardianId: number,
  student: ReturnType<typeof sanitizeRegistrationPayload>["student"],
) {
  const result = await env.DB.prepare(
    `INSERT INTO students (guardian_id, full_name, preferred_name, date_of_birth, age, gender, prior_experience, skill_level, medical_notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardianId,
      student.fullName,
      student.preferredName || null,
      student.dateOfBirth || null,
      student.age ?? null,
      student.gender || null,
      null,
      student.skillLevel || null,
      student.medicalNotes || null,
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
    payload: ReturnType<typeof sanitizeRegistrationPayload>;
    status: "submitted" | "waitlisted";
  },
) {
  const { guardianId, studentId, programId, payload, status } = params;
  const result = await env.DB.prepare(
    `INSERT INTO registrations (
      guardian_id, student_id, program_id,
      session_id, price_id,
      status, preferred_start_date, schedule_choice,
      program_specific_data,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  )
    .bind(
      guardianId,
      studentId,
      programId,
      payload.programDetails.sessionId ?? null,
      payload.programDetails.priceId ?? null,
      status,
      payload.programDetails.preferredStartDate || null,
      payload.programDetails.scheduleChoice || null,
      JSON.stringify({
        ...payload.programDetails.programSpecific,
        guardianNotes: payload.guardian.notes || undefined,
      }),
    )
    .run();

  return result.meta?.last_row_id as number | undefined;
}

async function insertWaivers(
  env: Env,
  registrationId: number,
  waivers: ReturnType<typeof sanitizeRegistrationPayload>["waivers"],
) {
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
      waivers.signatureText,
      new Date(waivers.signedAt).toISOString(),
    )
    .run();
}

async function sendRegistrationEmails(
  env: Env,
  params: {
    guardianName: string;
    guardianEmail: string;
    studentName: string;
    programName: string;
    registrationId: number;
    waitlisted: boolean;
  },
) {
  const fromEmail = env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev";
  const siteUrl = env.SITE_URL;

  if (params.waitlisted) {
    const userMsg = waitlistConfirmationEmail({
      name: params.guardianName,
      programName: params.programName,
      siteUrl,
    });

    await sendMailChannelsEmail(env, {
      to: { email: params.guardianEmail, name: params.guardianName },
      from: { email: fromEmail, name: "Sunnah Skills" },
      replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
      subject: userMsg.subject,
      text: userMsg.text,
      html: userMsg.html,
    });

    if (env.EMAIL_TO) {
      const adminMsg = adminNewRegistrationEmail({
        guardianName: params.guardianName,
        guardianEmail: params.guardianEmail,
        studentName: `${params.studentName} (waitlisted)`,
        programName: params.programName,
        registrationId: params.registrationId,
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
    return;
  }

  const userMsg = registrationConfirmationEmail({
    guardianName: params.guardianName,
    studentName: params.studentName,
    programName: params.programName,
    registrationId: params.registrationId,
    siteUrl,
  });
  await sendMailChannelsEmail(env, {
    to: { email: params.guardianEmail, name: params.guardianName },
    from: { email: fromEmail, name: "Sunnah Skills" },
    replyTo: env.EMAIL_TO ? { email: env.EMAIL_TO, name: "Sunnah Skills" } : undefined,
    subject: userMsg.subject,
    text: userMsg.text,
    html: userMsg.html,
  });

  if (env.EMAIL_TO) {
    const adminMsg = adminNewRegistrationEmail({
      guardianName: params.guardianName,
      guardianEmail: params.guardianEmail,
      studentName: params.studentName,
      programName: params.programName,
      registrationId: params.registrationId,
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
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });

  const parsed = registrationPayloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const body = sanitizeRegistrationPayload(parsed.data);
  const validationError = validateRegistrationPayload(body);
  if (validationError) {
    return json({ error: validationError }, { status: 400 });
  }

  const program = await env.DB.prepare(`SELECT id, slug, name, status FROM programs WHERE slug = ?`)
    .bind(body.programSlug)
    .first<{ id: string; slug: string; name: string; status: string | null }>();
  if (!program?.id) return json({ error: "Program not found" }, { status: 404 });

  if (program.slug !== "bjj") {
    return json({ error: "Registration is only open for Brazilian Jiu-Jitsu right now." }, { status: 403 });
  }

  if (body.programSlug === "bjj" && body.programDetails.sessionId) {
    const sess = await env.DB.prepare(`SELECT age_group FROM program_sessions WHERE id = ? AND program_id = 'bjj'`)
      .bind(body.programDetails.sessionId)
      .first<{ age_group: string | null }>();
    const track = String((body.programDetails.programSpecific as { bjjTrack?: string }).bjjTrack ?? "");
    if (sess?.age_group && track && sess.age_group !== track) {
      return json({ error: "Selected session does not match the chosen track." }, { status: 400 });
    }
  }

  let waitlisted = false;
  let waitlistPosition: number | null = null;

  if (body.programDetails.sessionId) {
    const session = await env.DB.prepare(
      `SELECT capacity, enrolled_count FROM program_sessions WHERE id = ?`,
    )
      .bind(body.programDetails.sessionId)
      .first<{ capacity: number | null; enrolled_count: number | null }>();

    if (session && session.capacity != null && Number(session.enrolled_count ?? 0) >= Number(session.capacity)) {
      waitlisted = true;
      const wlCount = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM registrations WHERE session_id = ? AND status = 'waitlisted'`,
      )
        .bind(body.programDetails.sessionId)
        .first<{ cnt: number }>();
      waitlistPosition = Number(wlCount?.cnt ?? 0) + 1;
    }
  }

  const guardianId = await insertGuardian(env, body.guardian);
  if (!guardianId) return json({ error: "Failed to create guardian" }, { status: 500 });

  const studentId = await insertStudent(env, guardianId, body.student);
  if (!studentId) return json({ error: "Failed to create student" }, { status: 500 });

  const registrationId = await insertRegistration(env, {
    guardianId,
    studentId,
    programId: program.id,
    payload: body,
    status: waitlisted ? "waitlisted" : "submitted",
  });
  if (!registrationId) return json({ error: "Failed to create registration" }, { status: 500 });

  await insertWaivers(env, registrationId, body.waivers);

  try {
    await sendRegistrationEmails(env, {
      guardianName: body.guardian.fullName,
      guardianEmail: body.guardian.email,
      studentName: body.student.fullName,
      programName: String(program.name ?? body.programSlug),
      registrationId,
      waitlisted,
    });
  } catch {
    // Best-effort only.
  }

  return json({
    ok: true,
    registrationId,
    status: waitlisted ? "waitlisted" : "submitted",
    ...(waitlisted ? { waitlisted: true, position: waitlistPosition ?? 1 } : {}),
  });
}
