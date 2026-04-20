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
    offerId: z.number().int().positive().nullable().optional(),
    sessionId: z.number().int().positive().nullable().optional(),
    priceId: z.number().int().positive().nullable().optional(),
    accessCode: z.string().trim().optional().default(""),
    preferredStartDate: z.string().trim().optional().default(""),
    scheduleChoice: z.string().trim().optional().default(""),
    programSpecific: z.record(z.any()).optional().default({}),
  }),
  waivers: z.object({
    liabilityWaiver: z.boolean(),
    photoConsent: z.boolean().optional().default(false),
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
        sessionDate,
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
      accessCode: payload.programDetails.accessCode.trim(),
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
  if (!body.waivers.liabilityWaiver || !body.waivers.medicalConsent || !body.waivers.termsAgreement) {
    return "You must accept the waiver and policy requirements.";
  }
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
      if (!String(ps.sessionDate ?? "").trim()) {
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
    offerId: number | null;
    payload: ReturnType<typeof sanitizeRegistrationPayload>;
    status: "submitted" | "waitlisted";
  },
) {
  const { guardianId, studentId, programId, offerId, payload, status } = params;
  const result = await env.DB.prepare(
    `INSERT INTO registrations (
      guardian_id, student_id, program_id,
      offer_id,
      session_id, price_id,
      status, preferred_start_date, schedule_choice,
      program_specific_data,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  )
    .bind(
      guardianId,
      studentId,
      programId,
      offerId,
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
  waiverDocument: { id: number; version_label: string } | null,
) {
  await env.DB.prepare(
    `INSERT INTO waivers (
      registration_id,
      waiver_document_id, waiver_version_label,
      liability_waiver, photo_consent, medical_consent, terms_agreement,
      signature_text, signed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      registrationId,
      waiverDocument?.id ?? null,
      waiverDocument?.version_label ?? null,
      waivers.liabilityWaiver ? 1 : 0,
      waivers.photoConsent ? 1 : 0,
      waivers.medicalConsent ? 1 : 0,
      waivers.termsAgreement ? 1 : 0,
      waivers.signatureText,
      new Date(waivers.signedAt).toISOString(),
    )
    .run();
}

async function loadActiveWaiverDocument(env: Env, slug: string) {
  return env.DB.prepare(
    `SELECT id, slug, version_label
     FROM waiver_documents
     WHERE slug = ? AND active = 1
     ORDER BY published_at DESC, id DESC
     LIMIT 1`,
  )
    .bind(slug)
    .first<{ id: number; slug: string; version_label: string }>();
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
  if (body.programSlug === "archery") {
    return json({ error: "Archery registration now uses account checkout. Please sign in and add archery to your registration cart." }, { status: 409 });
  }
  const validationError = validateRegistrationPayload(body);
  if (validationError) {
    return json({ error: validationError }, { status: 400 });
  }

  const program = await env.DB.prepare(`SELECT id, slug, name, status FROM programs WHERE slug = ?`)
    .bind(body.programSlug)
    .first<{ id: string; slug: string; name: string; status: string | null }>();
  if (!program?.id) return json({ error: "Program not found" }, { status: 404 });
  if (program.status !== "active") {
    return json({ error: "Registration is not open for this program right now." }, { status: 403 });
  }

  const sessionRows =
    (
      await env.DB.prepare(`SELECT * FROM program_sessions WHERE program_id = ?`)
        .bind(program.id)
        .all()
    ).results ?? [];
  const priceRows =
    (
      await env.DB.prepare(`SELECT * FROM program_prices WHERE program_id = ?`)
        .bind(program.id)
        .all()
    ).results ?? [];
  const offerRows =
    (
      await env.DB.prepare(`SELECT * FROM program_offers WHERE program_id = ?`)
        .bind(program.id)
        .all()
    ).results ?? [];

  const selectedSession = body.programDetails.sessionId
    ? (sessionRows as any[]).find((row) => Number(row.id) === Number(body.programDetails.sessionId))
    : null;
  const selectedPrice = body.programDetails.priceId
    ? (priceRows as any[]).find((row) => Number(row.id) === Number(body.programDetails.priceId))
    : null;
  const selectedOffer = body.programDetails.offerId
    ? (offerRows as any[]).find((row) => Number(row.id) === Number(body.programDetails.offerId))
    : null;

  if (body.programSlug === "bjj" && selectedSession) {
    const track = String((body.programDetails.programSpecific as { bjjTrack?: string }).bjjTrack ?? "");
    if (selectedSession.age_group && track && selectedSession.age_group !== track) {
      return json({ error: "Selected session does not match the chosen track." }, { status: 400 });
    }
  }

  if (body.programSlug === "archery") {
    if (!selectedOffer) {
      return json({ error: "Please choose a valid archery offer." }, { status: 400 });
    }
    if (!selectedSession || !selectedPrice) {
      return json({ error: "Please choose a valid archery session and price." }, { status: 400 });
    }
    if (Number(selectedOffer.active ?? 0) !== 1) {
      return json({ error: "Selected offer is no longer available." }, { status: 400 });
    }
    if (Number(selectedOffer.is_private ?? 0) === 1) {
      const normalizedAccessCode = body.programDetails.accessCode.trim().toUpperCase();
      if (!normalizedAccessCode) {
        return json({ error: "A valid access code is required for this private offer." }, { status: 400 });
      }
      if (String(selectedOffer.access_code ?? "").trim().toUpperCase() !== normalizedAccessCode) {
        return json({ error: "That access code is invalid for this offer." }, { status: 400 });
      }
    }
    if (selectedOffer.audience_gender === "female" && body.student.gender !== "female") {
      return json({ error: "This offer is restricted to female participants." }, { status: 400 });
    }
    if (selectedSession.offer_id != null && Number(selectedSession.offer_id) !== Number(selectedOffer.id)) {
      return json({ error: "Selected session does not belong to the chosen offer." }, { status: 400 });
    }
    if (selectedPrice.offer_id != null && Number(selectedPrice.offer_id) !== Number(selectedOffer.id)) {
      return json({ error: "Selected price does not belong to the chosen offer." }, { status: 400 });
    }
    if (Number(selectedPrice.active ?? 0) !== 1) {
      return json({ error: "Selected price is no longer active." }, { status: 400 });
    }
    if (Number(selectedSession.visible ?? 1) !== 1 || selectedSession.status === "closed") {
      return json({ error: "Selected session is no longer available." }, { status: 400 });
    }
  }

  let waitlisted = false;
  let waitlistPosition: number | null = null;

  if (selectedSession) {
    if (selectedSession.status === "waitlist_only") {
      waitlisted = true;
      const wlCount = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM registrations WHERE session_id = ? AND status = 'waitlisted'`,
      )
        .bind(body.programDetails.sessionId)
        .first<{ cnt: number }>();
      waitlistPosition = Number(wlCount?.cnt ?? 0) + 1;
    } else if (
      selectedSession.capacity != null &&
      Number(selectedSession.enrolled_count ?? 0) >= Number(selectedSession.capacity)
    ) {
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
    offerId: selectedOffer ? Number(selectedOffer.id) : null,
    payload: body,
    status: waitlisted ? "waitlisted" : "submitted",
  });
  if (!registrationId) return json({ error: "Failed to create registration" }, { status: 500 });

  const waiverSlug =
    selectedOffer?.waiver_slug && String(selectedOffer.waiver_slug).trim()
      ? String(selectedOffer.waiver_slug).trim()
      : body.programSlug === "archery"
        ? "archery"
        : "registration";
  const waiverDocument = await loadActiveWaiverDocument(env, waiverSlug);

  await insertWaivers(env, registrationId, body.waivers, waiverDocument ?? null);

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
