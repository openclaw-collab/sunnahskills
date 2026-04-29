import { z } from "zod";
import { sendMailChannelsEmail } from "../../_utils/email";
import { adminNewRegistrationEmail, registrationConfirmationEmail, waitlistConfirmationEmail } from "../../_utils/emailTemplates";
import { promoDiscountForSubtotal, resolveDiscountCode } from "../../_utils/discounts";
import { getGuardianFromRequest } from "../../_utils/guardianAuth";
import {
  BJJ_TRACK_BY_KEY,
  isBjjTrackKey,
  isEligibleForBjjTrack,
  isWomenSelfDefenseBjjTrack,
  isWomenWeeklyBjjTrack,
  normalizeGenderLabel,
} from "../../../shared/bjjCatalog";
import {
  computeLaterPaymentDateIso,
  computeLineTuitionCents,
  siblingDiscountEligibleForLine,
  splitPaymentPlan,
  type SemesterRow,
} from "../../../shared/orderPricing";
import { siblingDiscountForLineCents } from "../../../shared/pricing";
import { archeryEyeDominanceOptions, getArcheryFamilyPriceCents } from "../../../shared/archeryCatalog";

interface Env {
  DB: D1Database;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  SITE_URL?: string;
  STRIPE_SECRET_KEY?: string;
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

const accountSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(7).max(32),
  emergencyContactName: z.string().trim().min(2).max(120),
  emergencyContactPhone: z.string().trim().min(7).max(32),
  accountRole: z.enum(["parent_guardian", "adult_student"]),
  notes: z.string().trim().max(1500).optional().default(""),
});

const participantSchema = z.object({
  id: z.number().int().positive().optional().nullable(),
  participantType: z.enum(["self", "child"]),
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().trim().min(1),
  gender: z.string().trim().min(1),
  medicalNotes: z.string().trim().max(1500).optional().default(""),
  experienceLevel: z.string().trim().min(1).max(120),
});

const lineSchema = z.object({
  programSlug: z.enum(["bjj", "archery"]).optional().default("bjj"),
  participant: participantSchema,
  paymentChoice: z.enum(["full", "plan"]),
  discountCode: z.string().trim().max(64).optional().default(""),
  programDetails: z.object({
    sessionId: z.number().int().positive().nullable().optional(),
    priceId: z.number().int().positive().nullable().optional(),
    programSpecific: z.record(z.any()).optional().default({}),
  }),
});

const payloadSchema = z.object({
  account: accountSchema,
  lines: z.array(lineSchema).min(1).max(12),
  prorationCode: z.string().trim().max(64).optional().default(""),
  waivers: z.object({
    waiverId: z.number().int().positive(),
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
  return value.trim().replace(/[^\d+()\-\s]/g, "").replace(/\s+/g, " ");
}

function sanitizeText(value: string, maxLength = 1500) {
  return compactWhitespace(value).slice(0, maxLength);
}

function isValidPastDate(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= Date.now();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizedName(value: string) {
  return compactWhitespace(value).toLowerCase();
}

function normalizeLocationId(value: unknown) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || "mississauga";
}

function sameParticipantIdentity(
  a: { fullName: string; dateOfBirth: string },
  b: { fullName: string; dateOfBirth: string },
) {
  return normalizedName(a.fullName) === normalizedName(b.fullName) && a.dateOfBirth.trim() === b.dateOfBirth.trim();
}

function computeAge(dateOfBirth: string) {
  const birth = Date.parse(`${dateOfBirth}T12:00:00`);
  if (!Number.isFinite(birth)) return null;
  const now = new Date();
  const dob = new Date(birth);
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return Math.max(0, age);
}

async function syncGuardianAccount(env: Env, guardianAccountId: number, account: z.infer<typeof accountSchema>) {
  await env.DB.prepare(
    `UPDATE guardian_accounts
     SET full_name = ?,
         phone = ?,
         emergency_contact_name = ?,
         emergency_contact_phone = ?,
         account_role = ?,
         completed_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(
      compactWhitespace(account.fullName),
      sanitizePhone(account.phone),
      compactWhitespace(account.emergencyContactName),
      sanitizePhone(account.emergencyContactPhone),
      account.accountRole,
      guardianAccountId,
    )
    .run();
}

async function upsertGuardianRecord(env: Env, account: z.infer<typeof accountSchema>) {
  const email = account.email.trim().toLowerCase();
  const existing = await env.DB.prepare(
    `SELECT id FROM guardians WHERE lower(email) = ? ORDER BY id DESC LIMIT 1`,
  )
    .bind(email)
    .first<{ id: number }>();

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE guardians
       SET full_name = ?, phone = ?, emergency_contact_name = ?, emergency_contact_phone = ?, relationship = ?
       WHERE id = ?`,
    )
      .bind(
        compactWhitespace(account.fullName),
        sanitizePhone(account.phone),
        compactWhitespace(account.emergencyContactName),
        sanitizePhone(account.emergencyContactPhone),
        account.accountRole,
        existing.id,
      )
      .run();
    return existing.id;
  }

  const result = await env.DB.prepare(
    `INSERT INTO guardians (full_name, email, phone, emergency_contact_name, emergency_contact_phone, relationship, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      compactWhitespace(account.fullName),
      email,
      sanitizePhone(account.phone),
      compactWhitespace(account.emergencyContactName),
      sanitizePhone(account.emergencyContactPhone),
      account.accountRole,
    )
    .run();
  return Number(result.meta?.last_row_id ?? 0);
}

async function upsertSavedParticipant(
  env: Env,
  guardianAccountId: number,
  participant: z.infer<typeof participantSchema>,
) {
  if (participant.id) {
    const owned = await env.DB.prepare(
      `SELECT id FROM saved_students WHERE id = ? AND guardian_account_id = ? LIMIT 1`,
    )
      .bind(participant.id, guardianAccountId)
      .first<{ id: number }>();
    if (owned?.id) {
      await env.DB.prepare(
        `UPDATE saved_students
         SET participant_type = ?, is_account_holder = ?, full_name = ?, date_of_birth = ?, gender = ?, medical_notes = ?
         WHERE id = ? AND guardian_account_id = ?`,
      )
        .bind(
          participant.participantType,
          participant.participantType === "self" ? 1 : 0,
          compactWhitespace(participant.fullName),
          participant.dateOfBirth,
          normalizeGenderLabel(participant.gender),
          sanitizeText(participant.medicalNotes ?? "") || null,
          participant.id,
          guardianAccountId,
        )
        .run();
      return participant.id;
    }
  }

  const existing = await env.DB.prepare(
    `SELECT id
     FROM saved_students
     WHERE guardian_account_id = ?
       AND lower(full_name) = lower(?)
       AND COALESCE(date_of_birth, '') = ?
     LIMIT 1`,
  )
    .bind(guardianAccountId, compactWhitespace(participant.fullName), participant.dateOfBirth)
    .first<{ id: number }>();

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE saved_students
       SET participant_type = ?, is_account_holder = ?, gender = ?, medical_notes = ?
       WHERE id = ? AND guardian_account_id = ?`,
    )
      .bind(
        participant.participantType,
        participant.participantType === "self" ? 1 : 0,
        normalizeGenderLabel(participant.gender),
        sanitizeText(participant.medicalNotes ?? "") || null,
        existing.id,
        guardianAccountId,
      )
      .run();
    return existing.id;
  }

  const inserted = await env.DB.prepare(
    `INSERT INTO saved_students (
      guardian_account_id, participant_type, is_account_holder, full_name, date_of_birth, gender, medical_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardianAccountId,
      participant.participantType,
      participant.participantType === "self" ? 1 : 0,
      compactWhitespace(participant.fullName),
      participant.dateOfBirth,
      normalizeGenderLabel(participant.gender),
      sanitizeText(participant.medicalNotes ?? "") || null,
    )
    .run();
  return Number(inserted.meta?.last_row_id ?? 0);
}

async function upsertStudentRecord(env: Env, guardianId: number, participant: z.infer<typeof participantSchema>) {
  const age = computeAge(participant.dateOfBirth);
  const name = compactWhitespace(participant.fullName);

  const existing = await env.DB.prepare(
    `SELECT id FROM students
     WHERE guardian_id = ? AND lower(full_name) = lower(?) AND COALESCE(date_of_birth, '') = ?
     ORDER BY id DESC LIMIT 1`,
  )
    .bind(guardianId, name, participant.dateOfBirth)
    .first<{ id: number }>();

  if (existing?.id) {
    await env.DB.prepare(
      `UPDATE students
       SET age = ?, gender = ?, prior_experience = ?, skill_level = ?, medical_notes = ?
       WHERE id = ?`,
    )
      .bind(
        age,
        normalizeGenderLabel(participant.gender),
        participant.experienceLevel,
        participant.experienceLevel,
        sanitizeText(participant.medicalNotes ?? "") || null,
        existing.id,
      )
      .run();
    return existing.id;
  }

  const result = await env.DB.prepare(
    `INSERT INTO students (
      guardian_id, full_name, preferred_name, date_of_birth, age, gender, prior_experience, skill_level, medical_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardianId,
      name,
      null,
      participant.dateOfBirth,
      age,
      normalizeGenderLabel(participant.gender),
      participant.experienceLevel,
      participant.experienceLevel,
      sanitizeText(participant.medicalNotes ?? "") || null,
    )
    .run();
  return Number(result.meta?.last_row_id ?? 0);
}

async function fetchStripeIntentStatus(env: Env, paymentIntentId: string) {
  if (!env.STRIPE_SECRET_KEY) return null;
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as { status?: string } | null;
  return json?.status ?? null;
}

async function cancelStripeIntent(env: Env, paymentIntentId: string) {
  if (!env.STRIPE_SECRET_KEY) return false;
  const params = new URLSearchParams();
  params.set("cancellation_reason", "abandoned");
  const res = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );
  return res.ok;
}

async function supersedeOlderPendingOrders(env: Env, guardianAccountId: number, replacementOrderId: number) {
  const { results } = await env.DB.prepare(
    `SELECT id, stripe_payment_intent_id
     FROM enrollment_orders
     WHERE guardian_account_id = ?
       AND status = 'pending_payment'
       AND id != ?
     ORDER BY id ASC`,
  )
    .bind(guardianAccountId, replacementOrderId)
    .all<{ id: number; stripe_payment_intent_id: string | null }>();

  const supersededOrderIds: number[] = [];
  const skippedOrderIds: number[] = [];

  for (const row of results ?? []) {
    const existingIntentId = row.stripe_payment_intent_id?.trim() || null;
    let canSupersede = true;

    if (existingIntentId) {
      const status = await fetchStripeIntentStatus(env, existingIntentId);
      if (!status || status === "succeeded") {
        canSupersede = false;
      } else if (status && status !== "canceled") {
        const cancelled = await cancelStripeIntent(env, existingIntentId);
        if (!cancelled) canSupersede = false;
      }
    }

    if (!canSupersede) {
      skippedOrderIds.push(row.id);
      continue;
    }

    await env.DB.prepare(
      `UPDATE enrollment_orders
       SET status = 'superseded',
           manual_review_status = 'none',
           manual_review_reason = ?,
           last_payment_error = NULL,
           last_payment_attempt_at = datetime('now')
       WHERE id = ?`,
    )
      .bind(`superseded_by_order:${replacementOrderId}`, row.id)
      .run();

    await env.DB.prepare(
      `UPDATE registrations
       SET status = 'cancelled',
           updated_at = datetime('now')
       WHERE enrollment_order_id = ?
         AND status IN ('submitted', 'pending_payment')`,
    )
      .bind(row.id)
      .run();

    await env.DB.prepare(
      `UPDATE payments
       SET status = 'failed',
           updated_at = datetime('now')
       WHERE enrollment_order_id = ?
         AND status = 'pending'`,
    )
      .bind(row.id)
      .run();

    supersededOrderIds.push(row.id);
  }

  return { supersededOrderIds, skippedOrderIds };
}

async function insertRegistrationRecord(
  env: Env,
  args: {
    programId: string;
    guardianId: number;
    studentId: number;
    sessionId: number | null;
    priceId: number | null;
    orderId: number;
    status: "submitted" | "waitlisted";
    paymentChoice: "full" | "plan";
    lineSubtotalCents: number;
    siblingDiscountCents: number;
    participantType: "self" | "child";
    experienceLevel: string;
    track: string;
    notes: string;
    programSpecificData?: Record<string, unknown>;
    discountCode: string | null;
    promoDiscountCents: number;
  },
) {
  const result = await env.DB.prepare(
    `INSERT INTO registrations (
      guardian_id, student_id, program_id, session_id, price_id, status, preferred_start_date, schedule_choice,
      program_specific_data, enrollment_order_id, payment_choice, line_subtotal_cents, sibling_discount_applied,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  )
    .bind(
      args.guardianId,
      args.studentId,
      args.programId,
      args.sessionId,
      args.priceId,
      args.status,
      todayIso(),
      args.track,
      JSON.stringify(args.programSpecificData ?? {
        bjjTrack: args.track,
        participantType: args.participantType,
        experienceLevel: args.experienceLevel,
        notes: args.notes || undefined,
        discountCode: args.discountCode,
        promoDiscountCents: args.promoDiscountCents,
      }),
      args.orderId,
      args.paymentChoice,
      args.lineSubtotalCents,
      args.siblingDiscountCents,
    )
    .run();
  return Number(result.meta?.last_row_id ?? 0);
}

async function insertWaiverAcceptance(
  env: Env,
  registrationId: number,
  waivers: z.infer<typeof payloadSchema>["waivers"],
) {
  await env.DB.prepare(
    `INSERT INTO waivers (
      registration_id, liability_waiver, photo_consent, medical_consent, terms_agreement,
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

async function loadActiveWaiver(env: Env, waiverId: number) {
  return env.DB.prepare(
    `SELECT id, slug, title, version_label, body_html, published_at
     FROM waiver_documents
     WHERE id = ? AND active = 1
     LIMIT 1`,
  )
    .bind(waiverId)
    .first<{
      id: number;
      slug: string;
      title: string;
      version_label: string;
      body_html: string;
      published_at: string | null;
    }>();
}

async function loadProrationCode(env: Env, code: string) {
  if (!code.trim()) return null;
  return env.DB.prepare(
    `SELECT id, code
     FROM proration_codes
     WHERE code = ? AND active = 1 AND redeemed_at IS NULL
     LIMIT 1`,
  )
    .bind(code.trim().toUpperCase())
    .first<{ id: number; code: string }>();
}

async function resolveTrialMatch(
  env: Env,
  accountEmail: string,
  guardianAccountId: number,
  participantName: string,
) {
  const matches = await env.DB.prepare(
    `SELECT id
     FROM trial_bookings
     WHERE lower(email) = ?
       AND lower(participant_full_name) = ?
       AND verified_at IS NOT NULL
       AND redeemed_order_id IS NULL
     ORDER BY verified_at DESC, id DESC
     LIMIT 5`,
  )
    .bind(accountEmail.trim().toLowerCase(), normalizedName(participantName))
    .all<{ id: number }>();

  const rows = matches.results ?? [];
  if (rows.length === 1) return { id: Number(rows[0].id), ambiguous: false, matchedGuardianAccountId: guardianAccountId };
  if (rows.length > 1) return { id: null, ambiguous: true, matchedGuardianAccountId: guardianAccountId };
  return { id: null, ambiguous: false, matchedGuardianAccountId: guardianAccountId };
}

async function loadExistingBjjRegistrations(env: Env, guardianAccountId: number) {
  const rows = await env.DB.prepare(
    `SELECT
       r.schedule_choice,
       r.status,
       r.program_specific_data,
       COALESCE(ps.location_id, 'mississauga') AS location_id,
       s.full_name as student_full_name,
       s.date_of_birth as student_date_of_birth,
       o.guardian_account_id
     FROM registrations r
     JOIN students s ON s.id = r.student_id
     JOIN enrollment_orders o ON o.id = r.enrollment_order_id
     LEFT JOIN program_sessions ps ON ps.id = r.session_id
     WHERE o.guardian_account_id = ?
       AND r.program_id = 'bjj'
       AND r.status IN ('submitted', 'pending_payment', 'paid', 'active')
     ORDER BY r.id ASC`,
  )
    .bind(guardianAccountId)
    .all<{
      schedule_choice: string | null;
      status: string | null;
      program_specific_data?: string | null;
      location_id?: string | null;
      student_full_name: string | null;
      student_date_of_birth: string | null;
      guardian_account_id?: number | null;
    }>();

  return (rows.results ?? []).filter((row) => {
    if (row.guardian_account_id != null && Number(row.guardian_account_id) !== guardianAccountId) return false;
    return Boolean(row.schedule_choice && row.student_full_name && row.student_date_of_birth);
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.DB) return json({ error: "DB not configured" }, { status: 500 });
  const guardianSession = await getGuardianFromRequest(env, request);
  if (!guardianSession) return json({ error: "Please sign in before registering." }, { status: 401 });

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const body = parsed.data;
  const signedInEmail = guardianSession.email.trim().toLowerCase();
  if (body.account.email.trim().toLowerCase() !== signedInEmail) {
    return json({ error: "The signed-in account email must match the checkout email." }, { status: 400 });
  }
  if (!body.waivers.liabilityWaiver || !body.waivers.medicalConsent || !body.waivers.termsAgreement) {
    return json({ error: "You must accept the waiver and policy requirements." }, { status: 400 });
  }
  if (!isValidPastDate(body.waivers.signedAt)) {
    return json({ error: "Signed date must be valid." }, { status: 400 });
  }

  const waiver = await loadActiveWaiver(env, body.waivers.waiverId);
  if (!waiver) return json({ error: "The selected waiver version is no longer active." }, { status: 400 });

  const semester = (await env.DB.prepare(
    `SELECT classes_in_semester, price_per_class_cents, registration_fee_cents, later_payment_date, start_date, end_date
     FROM semesters WHERE program_id = 'bjj' AND active = 1 ORDER BY id DESC LIMIT 1`,
  ).first<SemesterRow>()) ?? null;

  const prorationCode = body.prorationCode?.trim() ? await loadProrationCode(env, body.prorationCode) : null;
  const hasBjjLine = body.lines.some((line) => (line.programSlug ?? "bjj") === "bjj");
  if (body.prorationCode?.trim() && !hasBjjLine) {
    return json({ error: "Staff proration codes only apply to BJJ registrations." }, { status: 400 });
  }
  if (body.prorationCode?.trim() && !prorationCode) {
    return json({ error: "That discount code is invalid or already used." }, { status: 400 });
  }

  const duplicateKeys = new Set<string>();
  for (const line of body.lines) {
    const programSlug = line.programSlug ?? "bjj";
    const locationKey = programSlug === "bjj" ? normalizeLocationId(line.programDetails.programSpecific.locationId) : "";
    const duplicateKey = `${programSlug}|${normalizedName(line.participant.fullName)}|${line.participant.dateOfBirth}|${programSlug === "bjj" ? `${line.programDetails.programSpecific.bjjTrack}|${locationKey}` : line.programDetails.sessionId}`;
    if (duplicateKeys.has(duplicateKey)) {
      return json({ error: "This participant already has that exact enrollment in the cart." }, { status: 400 });
    }
    duplicateKeys.add(duplicateKey);
  }

  const lineSkeleton = body.lines.map((line) => ({
    participantType: line.participant.participantType,
    student: {
      fullName: line.participant.fullName,
      dateOfBirth: line.participant.dateOfBirth,
    },
  }));
  const existingBjjRegistrations = await loadExistingBjjRegistrations(env, guardianSession.guardianAccountId);

  const lineMeta: Array<{
    programId: "bjj" | "archery";
    programName: string;
    waitlisted: boolean;
    sessionId: number | null;
    priceId: number | null;
    track: string;
    locationId: string | null;
    participantAge: number;
    trialBookingId: number | null;
    promoCode: string | null;
    promoDiscountCents: number;
    afterPromoCents: number;
    pricing: ReturnType<typeof computeLineTuitionCents> & {
      dueTodayCents: number;
      dueLaterCents: number;
      afterPromoCents: number;
    };
    manualReviewReason: string | null;
  }> = [];

  for (let index = 0; index < body.lines.length; index += 1) {
    const line = body.lines[index];
    const programId = line.programSlug ?? "bjj";
    const participantAge = computeAge(line.participant.dateOfBirth);
    if (participantAge == null) return json({ error: "Date of birth must be valid.", line: index }, { status: 400 });
    if (!isValidPastDate(line.participant.dateOfBirth)) {
      return json({ error: "Date of birth must be in the past.", line: index }, { status: 400 });
    }

    const program = await env.DB.prepare(`SELECT id, name, status FROM programs WHERE id = ? LIMIT 1`)
      .bind(programId)
      .first<{ id: string; name: string | null; status: string | null }>();
    if (!program?.id || program.status !== "active") {
      return json({ error: "Registration is not open for this program right now.", line: index }, { status: 400 });
    }

    if (programId === "archery") {
      const archeryRegistrationIndex = body.lines
        .slice(0, index + 1)
        .filter((entry) => (entry.programSlug ?? "bjj") === "archery").length - 1;
      const archeryLinePriceCents = getArcheryFamilyPriceCents(archeryRegistrationIndex);
      if (line.paymentChoice !== "full") {
        return json({ error: "Archery is paid in full at checkout.", line: index }, { status: 400 });
      }
      const eyeDominance = String(line.programDetails.programSpecific.eyeDominance ?? "").trim();
      if (!archeryEyeDominanceOptions.some((option) => option.value === eyeDominance)) {
        return json({ error: "Choose right or left eye dominance.", line: index }, { status: 400 });
      }

      const session = line.programDetails.sessionId
        ? await env.DB.prepare(
            `SELECT ps.id, ps.capacity, ps.visible, ps.status,
                    (SELECT COUNT(*) FROM registrations r
                     WHERE r.session_id = ps.id AND r.program_id = 'archery'
                       AND r.status = 'active') AS active_count
             FROM program_sessions ps
             WHERE ps.id = ? AND ps.program_id = 'archery'
             LIMIT 1`,
          )
            .bind(line.programDetails.sessionId)
            .first<{ id: number; capacity: number | null; visible: number | null; status: string | null; active_count: number }>()
        : null;
      if (!session?.id || Number(session.visible ?? 1) !== 1 || session.status === "closed") {
        return json({ error: "Choose a valid archery time slot.", line: index }, { status: 400 });
      }

      const waitlisted = session.capacity != null && Number(session.active_count ?? 0) >= Number(session.capacity);
      let promoCode: string | null = null;
      let promoDiscountCents = 0;
      if (line.discountCode?.trim()) {
        const discount = await resolveDiscountCode(env.DB, line.discountCode, { programId: "archery" });
        if (!discount.valid || !discount.row) {
          return json({ error: "That discount code is invalid.", line: index }, { status: 400 });
        }
        promoCode = discount.row.code;
        promoDiscountCents = promoDiscountForSubtotal(archeryLinePriceCents, discount.row);
      }
      const finalLineTotalCents = Math.max(0, archeryLinePriceCents - promoDiscountCents);

      lineMeta.push({
        programId: "archery",
        programName: "Traditional Archery",
        waitlisted,
        sessionId: session.id,
        priceId: line.programDetails.priceId ?? null,
        track: "archery",
        locationId: null,
        participantAge,
        trialBookingId: null,
        promoCode,
        promoDiscountCents,
        afterPromoCents: finalLineTotalCents,
        manualReviewReason: promoDiscountCents > 0 ? "promo_discount" : null,
        pricing: {
          scheduledClassCount: 4,
          perClassCents: 0,
          baseTuitionCents: archeryLinePriceCents,
          trialCreditCents: 0,
          lineSubtotalCents: archeryLinePriceCents,
          siblingDiscountCents: 0,
          afterSiblingCents: finalLineTotalCents,
          afterPromoCents: finalLineTotalCents,
          dueTodayCents: finalLineTotalCents,
          dueLaterCents: 0,
        },
      });
      continue;
    }

    const track = String(line.programDetails.programSpecific.bjjTrack ?? "").trim();
    if (!isBjjTrackKey(track)) return json({ error: "Choose a valid BJJ track.", line: index }, { status: 400 });
    if (!isEligibleForBjjTrack(track, participantAge, line.participant.gender)) {
      return json({ error: "That participant is not eligible for the selected BJJ track.", line: index }, { status: 400 });
    }

    const existingTracksForParticipant = existingBjjRegistrations
      .filter((row) =>
        sameParticipantIdentity(
          { fullName: row.student_full_name ?? "", dateOfBirth: row.student_date_of_birth ?? "" },
          { fullName: line.participant.fullName, dateOfBirth: line.participant.dateOfBirth },
        ),
      )
      .map((row) => {
        let storedLocationId = normalizeLocationId(row.location_id);
        try {
          const data = JSON.parse(String(row.program_specific_data ?? "{}")) as { locationId?: unknown };
          storedLocationId = normalizeLocationId(data.locationId ?? storedLocationId);
        } catch {
          // Ignore older registration JSON.
        }
        return {
          track: String(row.schedule_choice ?? "").trim(),
          locationId: storedLocationId,
        };
      })
      .filter((entry) => entry.track);
    const requestedLocationId = normalizeLocationId(line.programDetails.programSpecific.locationId);
    if (existingTracksForParticipant.some((entry) => entry.track === track && entry.locationId === requestedLocationId)) {
      return json({ error: "This participant is already registered for that BJJ option at this location.", line: index }, { status: 400 });
    }
    const existingTrackKeysForParticipant = existingTracksForParticipant
      .map((entry) => entry.track)
      .filter(Boolean);

    const sameCartTracksForParticipant = body.lines
      .slice(0, index)
      .filter((otherLine) =>
        (otherLine.programSlug ?? "bjj") === "bjj" &&
        sameParticipantIdentity(
          { fullName: otherLine.participant.fullName, dateOfBirth: otherLine.participant.dateOfBirth },
          { fullName: line.participant.fullName, dateOfBirth: line.participant.dateOfBirth },
        ),
      )
      .map((otherLine) => ({
        track: String(otherLine.programDetails.programSpecific.bjjTrack ?? "").trim(),
        locationId: normalizeLocationId(otherLine.programDetails.programSpecific.locationId),
      }))
      .filter((entry) => entry.track);

    const hasWomenWeeklyInCartOrAccount =
      sameCartTracksForParticipant.some((entry) => isWomenWeeklyBjjTrack(entry.track)) ||
      existingTrackKeysForParticipant.some(isWomenWeeklyBjjTrack);
    if (isWomenSelfDefenseBjjTrack(track) && hasWomenWeeklyInCartOrAccount) {
      return json({
        error: "Women self-defense is for participants who are not already registered for Tuesday or Thursday women’s BJJ.",
        line: index,
      }, { status: 400 });
    }
    const womenSecondWeeklyClass =
      isWomenWeeklyBjjTrack(track) &&
      (sameCartTracksForParticipant.some((other) => isWomenWeeklyBjjTrack(other.track) && other.track !== track) ||
        existingTrackKeysForParticipant.some((otherTrack) => isWomenWeeklyBjjTrack(otherTrack) && otherTrack !== track));

    const session = await env.DB.prepare(
      `SELECT ps.id, ps.age_group, ps.location_id, ps.capacity, ps.visible, ps.status,
              (SELECT COUNT(*) FROM registrations r
               WHERE r.session_id = ps.id AND r.program_id = 'bjj'
                 AND r.status IN ('active', 'submitted', 'pending_payment')) AS active_count
       FROM program_sessions ps
       WHERE ps.id = ? AND ps.program_id = 'bjj'
       LIMIT 1`,
    )
      .bind(line.programDetails.sessionId)
      .first<{ id: number; age_group: string | null; location_id?: string | null; capacity: number | null; visible?: number | null; status?: string | null; active_count: number }>();
    if (!session?.id || session.age_group !== track) {
      return json({ error: "Selected session does not match the chosen track.", line: index }, { status: 400 });
    }
    if (Number(session.visible ?? 1) !== 1 || session.status === "closed" || session.status === "coming_soon") {
      return json({ error: "Selected BJJ session is not open for registration.", line: index }, { status: 400 });
    }
    const sessionLocationId = normalizeLocationId(session.location_id);
    if (sessionLocationId !== requestedLocationId) {
      return json({ error: "Selected session does not match the chosen location.", line: index }, { status: 400 });
    }

    const allBjjPrices = await env.DB.prepare(
      `SELECT id, age_group, amount, registration_fee, frequency, metadata, active, location_id
       FROM program_prices
       WHERE program_id = 'bjj' AND active = 1`,
    ).all<{
      id: number;
      age_group: string | null;
      amount: number | null;
      registration_fee: number | null;
      frequency: string | null;
      metadata: string | null;
      active: number | null;
      location_id?: string | null;
    }>();
    const eligiblePrices = (allBjjPrices.results ?? []).filter(
      (price) =>
        price.age_group === track &&
        Number(price.active ?? 1) === 1 &&
        (!price.location_id || normalizeLocationId(price.location_id) === sessionLocationId),
    );
    const priceRow =
      eligiblePrices.find((price) => price.location_id && normalizeLocationId(price.location_id) === sessionLocationId) ??
      eligiblePrices.find((price) => price.id === line.programDetails.priceId) ??
      eligiblePrices[0] ??
      null;
    if (!priceRow?.id || !line.programDetails.sessionId) {
      return json({ error: "Track pricing or session selection is missing.", line: index }, { status: 400 });
    }

    const waitlisted =
      session.capacity != null && Number(session.active_count ?? 0) >= Number(session.capacity);

    const trialMatch = await resolveTrialMatch(
      env,
      signedInEmail,
      guardianSession.guardianAccountId,
      line.participant.fullName,
    );

    const siblingDiscountEligible = siblingDiscountEligibleForLine(lineSkeleton, index);
    const trialCreditCents = trialMatch.id ? BJJ_TRACK_BY_KEY[track].defaultPerClassCents : 0;
    const pricing = computeLineTuitionCents({
      track,
      priceId: priceRow.id,
      programPriceAmount: priceRow.amount,
      programPriceRegFee: priceRow.registration_fee,
      programPriceFrequency: priceRow.frequency,
      priceMetadataJson: priceRow.metadata,
      paymentChoice: line.paymentChoice,
      siblingDiscountEligible,
      semester,
      trialCreditCents,
      prorationAllowed: Boolean(prorationCode),
      chargeDateIso: todayIso(),
      womenSecondWeeklyClass,
    });
    let promoCode: string | null = null;
    let promoDiscountCents = 0;
    let siblingDiscountCents = pricing.siblingDiscountCents;
    if (line.discountCode?.trim()) {
      const discount = await resolveDiscountCode(env.DB, line.discountCode, { programId: "bjj" });
      if (!discount.valid || !discount.row) {
        const message =
          discount.reason === "program_mismatch"
            ? "That discount code does not apply to this registration."
            : discount.reason === "max_uses_reached"
              ? "That discount code has already been fully used."
              : discount.reason === "not_started"
                ? "That discount code is not active yet."
                : discount.reason === "expired"
                  ? "That discount code has expired."
                  : discount.reason === "unsupported_type"
                    ? "Sibling pricing is already applied automatically on eligible lines."
                    : "That discount code is invalid.";
        return json({ error: message, line: index }, { status: 400 });
      }
      promoCode = discount.row.code;
      promoDiscountCents = promoDiscountForSubtotal(pricing.lineSubtotalCents, discount.row);
    }
    const afterPromoBeforeSiblingCents = Math.max(0, pricing.lineSubtotalCents - promoDiscountCents);
    siblingDiscountCents = siblingDiscountForLineCents(afterPromoBeforeSiblingCents, siblingDiscountEligible);
    const finalLineTotalCents = Math.max(0, afterPromoBeforeSiblingCents - siblingDiscountCents);
    const split = splitPaymentPlan(finalLineTotalCents, line.paymentChoice);

    lineMeta.push({
      programId: "bjj",
      programName: "Brazilian Jiu-Jitsu",
      waitlisted,
      sessionId: session.id,
      priceId: priceRow.id,
      track,
      locationId: sessionLocationId,
      participantAge,
      trialBookingId: trialMatch.id,
      promoCode,
      promoDiscountCents,
      afterPromoCents: finalLineTotalCents,
      manualReviewReason: trialMatch.ambiguous ? "trial_match_ambiguous" : null,
      pricing: {
        ...pricing,
        siblingDiscountCents,
        afterSiblingCents: finalLineTotalCents,
        afterPromoCents: finalLineTotalCents,
        dueTodayCents: split.dueToday,
        dueLaterCents: split.dueLater,
      },
    });
  }

  await syncGuardianAccount(env, guardianSession.guardianAccountId, body.account);
  const guardianId = await upsertGuardianRecord(env, body.account);
  if (!guardianId) return json({ error: "Could not create account record." }, { status: 500 });

  const totalCents = lineMeta.filter((line) => !line.waitlisted).reduce((sum, line) => sum + line.afterPromoCents, 0);
  const dueTodayCents = lineMeta.filter((line) => !line.waitlisted).reduce((sum, line) => sum + line.pricing.dueTodayCents, 0);
  const dueLaterCents = lineMeta.filter((line) => !line.waitlisted).reduce((sum, line) => sum + line.pricing.dueLaterCents, 0);
  const siblingDiscountCents = lineMeta.reduce((sum, line) => sum + line.pricing.siblingDiscountCents, 0);
  const trialCreditCents = lineMeta.reduce((sum, line) => sum + line.pricing.trialCreditCents, 0);
  const promoDiscountCents = lineMeta.filter((line) => !line.waitlisted).reduce((sum, line) => sum + line.promoDiscountCents, 0);
  const allWaitlisted = lineMeta.length > 0 && lineMeta.every((line) => line.waitlisted);
  const reviewReasons = new Set<string>();
  if (prorationCode) reviewReasons.add("prorated");
  if (trialCreditCents > 0) reviewReasons.add("trial_credit");
  if (siblingDiscountCents > 0) reviewReasons.add("sibling_discount");
  if (promoDiscountCents > 0) reviewReasons.add("promo_discount");
  if (dueLaterCents > 0) reviewReasons.add("payment_plan");
  for (const line of lineMeta) {
    if (line.manualReviewReason) reviewReasons.add(line.manualReviewReason);
  }
  const manualReviewStatus = reviewReasons.size > 0 ? "required" : "none";
  const manualReviewReason = reviewReasons.size > 0 ? [...reviewReasons].join(",") : null;

  const orderInsert = await env.DB.prepare(
    `INSERT INTO enrollment_orders (
      guardian_account_id, guardian_id, status, manual_review_status, manual_review_reason,
      total_cents, amount_due_today_cents, later_amount_cents, later_payment_date,
      waiver_version_id, waiver_version_label, waiver_accepted_at, waiver_signature_text,
      trial_credit_cents, sibling_discount_cents, proration_code, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardianSession.guardianAccountId,
      guardianId,
      allWaitlisted ? "waitlisted" : "pending_payment",
      manualReviewStatus,
      manualReviewReason,
      totalCents,
      dueTodayCents,
      dueLaterCents,
      allWaitlisted ? null : computeLaterPaymentDateIso(semester),
      waiver.id,
      waiver.version_label,
      new Date(body.waivers.signedAt).toISOString(),
      compactWhitespace(body.waivers.signatureText),
      trialCreditCents,
      siblingDiscountCents,
      prorationCode?.code ?? null,
      JSON.stringify({
        programId: Array.from(new Set(lineMeta.map((line) => line.programId))).join(","),
        lineCount: body.lines.length,
        prorationCode: prorationCode?.code ?? null,
        trialCreditCents,
        siblingDiscountCents,
        promoDiscountCents,
        lineDiscountCodes: lineMeta
          .filter((line) => !line.waitlisted)
          .map((line) => line.promoCode)
          .filter((code): code is string => Boolean(code)),
        waiverVersionId: waiver.id,
      }),
    )
    .run();
  const orderId = Number(orderInsert.meta?.last_row_id ?? 0);
  if (!orderId) return json({ error: "Could not create order." }, { status: 500 });

  const registrationIds: number[] = [];
  for (let index = 0; index < body.lines.length; index += 1) {
    const line = body.lines[index];
    const meta = lineMeta[index];

    await upsertSavedParticipant(env, guardianSession.guardianAccountId, line.participant);
    const studentId = await upsertStudentRecord(env, guardianId, line.participant);
    const registrationId = await insertRegistrationRecord(env, {
      programId: meta.programId,
      guardianId,
      studentId,
      sessionId: meta.sessionId,
      priceId: meta.priceId,
      orderId,
      status: meta.waitlisted ? "waitlisted" : "submitted",
      paymentChoice: line.paymentChoice,
      lineSubtotalCents: meta.pricing.lineSubtotalCents,
      siblingDiscountCents: meta.pricing.siblingDiscountCents,
      participantType: line.participant.participantType,
      experienceLevel: line.participant.experienceLevel,
      track: meta.track,
      notes: String(line.programDetails.programSpecific.notes ?? ""),
      programSpecificData: {
        programSlug: meta.programId,
        participantType: line.participant.participantType,
        experienceLevel: line.participant.experienceLevel,
        ...line.programDetails.programSpecific,
        locationId: meta.locationId,
        discountCode: meta.promoCode,
        promoDiscountCents: meta.promoDiscountCents,
      },
      discountCode: meta.promoCode,
      promoDiscountCents: meta.promoDiscountCents,
    });
    if (!registrationId) return json({ error: "Could not create registration.", line: index }, { status: 500 });

    registrationIds.push(registrationId);
    await insertWaiverAcceptance(env, registrationId, body.waivers);

    if (meta.trialBookingId) {
      await env.DB.prepare(
        `UPDATE trial_bookings
         SET status = 'redeemed',
             redeemed_order_id = ?,
             redeemed_registration_id = ?,
             matched_guardian_account_id = ?
         WHERE id = ?`,
      )
        .bind(orderId, registrationId, guardianSession.guardianAccountId, meta.trialBookingId)
        .run();
    }

    const emailPayload = meta.waitlisted
      ? waitlistConfirmationEmail({
          name: body.account.fullName,
          programName: meta.programName,
          siteUrl: env.SITE_URL,
        })
      : registrationConfirmationEmail({
          guardianName: body.account.fullName,
          studentName: line.participant.fullName,
          programName: meta.programName,
          registrationId,
          siteUrl: env.SITE_URL,
        });

    await sendMailChannelsEmail(env, {
      to: { email: signedInEmail, name: body.account.fullName },
      from: { email: env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev", name: "Sunnah Skills" },
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    }).catch(() => {});

    if (env.EMAIL_TO?.trim()) {
      const adminEmail = adminNewRegistrationEmail({
        guardianName: body.account.fullName,
        guardianEmail: signedInEmail,
        studentName: line.participant.fullName,
        programName: meta.programName,
        registrationId,
        siteUrl: env.SITE_URL,
      });
      await sendMailChannelsEmail(env, {
        to: { email: env.EMAIL_TO.trim() },
        from: { email: env.EMAIL_FROM ?? "noreply@sunnahskills.pages.dev", name: "Sunnah Skills" },
        subject: adminEmail.subject,
        text: adminEmail.text,
        html: adminEmail.html,
      }).catch(() => {});
    }
  }

  const superseded = await supersedeOlderPendingOrders(env, guardianSession.guardianAccountId, orderId);

  return json({
    ok: true,
    enrollmentOrderId: orderId,
    registrationIds,
    summary: {
      waitlisted: allWaitlisted,
      totalCents,
      dueTodayCents,
      dueLaterCents,
      laterPaymentDate: allWaitlisted ? null : computeLaterPaymentDateIso(semester),
      trialCreditCents,
      siblingDiscountCents,
      promoDiscountCents,
      prorationApplied: Boolean(prorationCode),
      waiverVersion: waiver.version_label,
      supersededOrderIds: superseded.supersededOrderIds,
      skippedSupersedeOrderIds: superseded.skippedOrderIds,
    },
  });
}
