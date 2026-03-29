import { z } from "zod";
import { sendMailChannelsEmail } from "../../_utils/email";
import { adminNewRegistrationEmail, registrationConfirmationEmail, waitlistConfirmationEmail } from "../../_utils/emailTemplates";
import { promoDiscountForSubtotal, resolveDiscountCode } from "../../_utils/discounts";
import { getGuardianFromRequest } from "../../_utils/guardianAuth";
import { BJJ_TRACK_BY_KEY, isBjjTrackKey, isEligibleForBjjTrack, normalizeGenderLabel } from "../../../shared/bjjCatalog";
import {
  computeLaterPaymentDateIso,
  computeLineTuitionCents,
  siblingDiscountEligibleForLine,
  splitPaymentPlan,
  type SemesterRow,
} from "../../../shared/orderPricing";
import { siblingDiscountForLineCents } from "../../../shared/pricing";

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
  participant: participantSchema,
  paymentChoice: z.enum(["full", "plan"]),
  discountCode: z.string().trim().max(64).optional().default(""),
  programDetails: z.object({
    sessionId: z.number().int().positive().nullable().optional(),
    priceId: z.number().int().positive().nullable().optional(),
    programSpecific: z.object({
      bjjTrack: z.string().trim().min(1),
      notes: z.string().trim().max(1500).optional().default(""),
    }),
  }),
});

const payloadSchema = z.object({
  account: accountSchema,
  lines: z.array(lineSchema).min(1).max(12),
  prorationCode: z.string().trim().max(64).optional().default(""),
  waivers: z.object({
    waiverId: z.number().int().positive(),
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
  return value.trim().replace(/[^\d+()\-\s]/g, "").replace(/\s+/g, " ");
}

function sanitizeText(value: string, maxLength = 1500) {
  return compactWhitespace(value).slice(0, maxLength);
}

function isValidPastDate(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= Date.now();
}

function isWomenTrack(track: string) {
  return isBjjTrackKey(track) && BJJ_TRACK_BY_KEY[track].marketingGroup === "women";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizedName(value: string) {
  return compactWhitespace(value).toLowerCase();
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

async function insertGuardianRecord(env: Env, account: z.infer<typeof accountSchema>) {
  const result = await env.DB.prepare(
    `INSERT INTO guardians (full_name, email, phone, emergency_contact_name, emergency_contact_phone, relationship, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      compactWhitespace(account.fullName),
      account.email.trim().toLowerCase(),
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

async function insertStudentRecord(env: Env, guardianId: number, participant: z.infer<typeof participantSchema>) {
  const age = computeAge(participant.dateOfBirth);
  const result = await env.DB.prepare(
    `INSERT INTO students (
      guardian_id, full_name, preferred_name, date_of_birth, age, gender, prior_experience, skill_level, medical_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  )
    .bind(
      guardianId,
      compactWhitespace(participant.fullName),
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

async function insertRegistrationRecord(
  env: Env,
  args: {
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
    discountCode: string | null;
    promoDiscountCents: number;
  },
) {
  const result = await env.DB.prepare(
    `INSERT INTO registrations (
      guardian_id, student_id, program_id, session_id, price_id, status, preferred_start_date, schedule_choice,
      program_specific_data, enrollment_order_id, payment_choice, line_subtotal_cents, sibling_discount_applied,
      created_at, updated_at
    ) VALUES (?, ?, 'bjj', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  )
    .bind(
      args.guardianId,
      args.studentId,
      args.sessionId,
      args.priceId,
      args.status,
      todayIso(),
      args.track,
      JSON.stringify({
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
  if (body.prorationCode?.trim() && !prorationCode) {
    return json({ error: "That discount code is invalid or already used." }, { status: 400 });
  }

  const duplicateKeys = new Set<string>();
  for (const line of body.lines) {
    const duplicateKey = `${normalizedName(line.participant.fullName)}|${line.participant.dateOfBirth}|${line.programDetails.programSpecific.bjjTrack}`;
    if (duplicateKeys.has(duplicateKey)) {
      return json({ error: "This participant already has that exact BJJ enrollment in the cart." }, { status: 400 });
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

  const lineMeta: Array<{
    waitlisted: boolean;
    sessionId: number | null;
    priceId: number | null;
    track: string;
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
    const participantAge = computeAge(line.participant.dateOfBirth);
    if (participantAge == null) return json({ error: "Date of birth must be valid.", line: index }, { status: 400 });
    if (!isValidPastDate(line.participant.dateOfBirth)) {
      return json({ error: "Date of birth must be in the past.", line: index }, { status: 400 });
    }

    const track = line.programDetails.programSpecific.bjjTrack;
    if (!isBjjTrackKey(track)) return json({ error: "Choose a valid BJJ track.", line: index }, { status: 400 });
    if (!isEligibleForBjjTrack(track, participantAge, line.participant.gender)) {
      return json({ error: "That participant is not eligible for the selected BJJ track.", line: index }, { status: 400 });
    }

    const priceRow = line.programDetails.priceId
      ? await env.DB.prepare(
          `SELECT id, amount, registration_fee, frequency, metadata
           FROM program_prices
           WHERE id = ? AND program_id = 'bjj' AND active = 1
           LIMIT 1`,
        )
          .bind(line.programDetails.priceId)
          .first<{ id: number; amount: number | null; registration_fee: number | null; frequency: string | null; metadata: string | null }>()
      : null;
    if (!priceRow?.id || !line.programDetails.sessionId) {
      return json({ error: "Track pricing or session selection is missing.", line: index }, { status: 400 });
    }

    const session = await env.DB.prepare(
      `SELECT id, age_group, capacity, enrolled_count
       FROM program_sessions
       WHERE id = ? AND program_id = 'bjj'
       LIMIT 1`,
    )
      .bind(line.programDetails.sessionId)
      .first<{ id: number; age_group: string | null; capacity: number | null; enrolled_count: number | null }>();
    if (!session?.id || session.age_group !== track) {
      return json({ error: "Selected session does not match the chosen track.", line: index }, { status: 400 });
    }

    const waitlisted =
      session.capacity != null && Number(session.enrolled_count ?? 0) >= Number(session.capacity);

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
      waitlisted,
      sessionId: session.id,
      priceId: priceRow.id,
      track,
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

  const womenOnlyOrder = lineMeta.length > 0 && lineMeta.every((line) => isWomenTrack(line.track));
  if (!womenOnlyOrder && !body.waivers.photoConsent) {
    return json({ error: "You must accept the media waiver requirement." }, { status: 400 });
  }

  await syncGuardianAccount(env, guardianSession.guardianAccountId, body.account);
  const guardianId = await insertGuardianRecord(env, body.account);
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
        programId: "bjj",
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
    const studentId = await insertStudentRecord(env, guardianId, line.participant);
    const registrationId = await insertRegistrationRecord(env, {
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
      notes: line.programDetails.programSpecific.notes,
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
          programName: "Brazilian Jiu-Jitsu",
          siteUrl: env.SITE_URL,
        })
      : registrationConfirmationEmail({
          guardianName: body.account.fullName,
          studentName: line.participant.fullName,
          programName: "Brazilian Jiu-Jitsu",
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
        programName: "Brazilian Jiu-Jitsu",
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
    },
  });
}
