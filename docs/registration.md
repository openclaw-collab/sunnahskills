# Registration System

## Overview

Registration is now **auth-first** for the live BJJ launch path. Guardians start at `/register`, sign in or create an account, manage saved students, and then continue into the shared 5-step wizard (`RegistrationWizard`).

The live checkout path is **order-first**, not registration-first:

1. `POST /api/register/cart` creates the `enrollment_order`, linked `registrations`, and saved-student updates.
2. `POST /api/payments/create-order-intent` creates the Stripe `PaymentIntent` for the amount due today.

`POST /api/register` still exists for older/non-BJJ flows, but it is no longer the live frontend path for BJJ.

## Routes & enrollment status

| Slug | URL | Enrollment | Payment (when open) |
|---|---|---|---|
| `bjj` | `/programs/bjj/register` | **Open** — guardian-authenticated wizard | Order-based PaymentIntent |
| `archery` | `/programs/archery/register` | **Coming soon** — waitlist screen | — |
| `outdoor` | `/programs/outdoor/register` | **Coming soon** — waitlist screen | — |
| `bullyproofing` | `/programs/bullyproofing/register` | **Coming soon** — waitlist screen | — |

`/register` is the guardian hub. Unauthenticated visitors are prompted to:

- sign in with account number
- request a magic-link sign-in email
- create a guardian account

Authenticated guardians can:

- review account info
- add or remove saved students
- continue into BJJ registration from the same hub

Non-BJJ `/programs/{slug}/register` URLs render a short **waitlist** message with links to **Contact** and the program detail page.

**Server:** `POST /api/register` returns **403** for non-BJJ slugs even if called directly.

## Family cart (`/registration/cart`)

- **Add to cart** (BJJ only): on the **Details** step, use **Add to cart** / **View cart** next to **Continue**. Lines are stored in `localStorage` (`client/src/lib/familyCart.ts`). Guardian email must match across lines.
- **Checkout:** One **waivers + signature** block covers **all** lines in the order. Submit calls:
  1. `POST /api/register/cart` — creates `enrollment_orders`, linked `registrations`, per-line `payment_choice` (`full` | `plan`), kids/sibling math via `shared/orderPricing.ts`.
  2. `POST /api/payments/create-order-intent` — Stripe **Customer** + **PaymentIntent** for “pay today” (`setup_future_usage=off_session` for the later balance). Webhook fan-out: `functions/api/payments/webhook.ts` reads `metadata.enrollment_order_id` + `registration_ids`.
- **Installments:** Remaining balance is stored on the order. Checkout shows the **exact** second amount and date (after promo codes) and requires agreement before card entry. **Operations:** run `POST /api/payments/collect-order-balance` (Bearer `CRON_SECRET`) on a schedule so the second **off-session** charge is attempted on or after `later_payment_date`.

## Wizard steps

```
Step 1: Guardian Info
Step 2: Student Info
Step 3: Program Details  ← program-specific fields + sibling discount selector
Step 4: Waivers
Step 5: Payment
```

### Step 1 — Guardian Info (`StepGuardianInfo.tsx`)

Fields: full name · email · phone · relationship (select) · emergency contact name · emergency contact phone · optional notes.

For authenticated BJJ guardians, account data pre-fills this step from `/api/guardian/me`.

### Step 2 — Student Info (`StepStudentInfo.tsx`)

Fields: full name · preferred name · date of birth (auto-computes age) · gender (radio) · skill level (radio) · medical notes / allergies (textarea).

Authenticated guardians can also pick from saved students returned by `/api/guardian/students`.

### Step 3 — Program Details (`StepProgramDetails.tsx`)

Branched by `program.slug`:

**BJJ:**
- **Class track** (radio): Girls 5–10 · Boys 7–13 · Teens+ Women 11+ — Tuesday · Teens+ Women 11+ — Thursday · Teens+ Men 14+  
  (Tuesday vs Thursday women sessions are **separate enrollments**; both = double tuition.)
- **Session** (`Pick your session`) when more than one row exists for that track in `/api/programs`
- **Tuition payment** (radio): Pay in full today · Pay part today (remainder on the semester date; charged automatically to the same card after checkout)
- Trial class first? (Yes / No) — radio
- Optional notes textarea
- Sibling enrollment (0 / 1 / 2+) — shared radio (10% off **additional** siblings’ **kids** lines — see `shared/pricing.ts`; server must recompute)

### Required-fields matrix (high level)

| Step | Required |
|------|----------|
| Guardian | Full name, email, phone, relationship, emergency name & phone |
| Student | Full name, DOB, gender, skill level |
| BJJ details | `bjjTrack`, `trialClass`, `sessionId`, `priceId` (when catalog loaded) |
| Waivers | Liability, medical, terms checkboxes + typed signature + date |
| Payment | Stripe confirmation (after waivers) |

**Archery:**
- Dominant hand (Right / Left) — radio
- Prior archery experience (Never / Some experience / Practiced before) — radio
- Preferred session date (SelectField from static schedule data)
- Optional notes textarea
- Sibling enrollment

**Outdoor Workshops:**
- Workshop date selection (SelectField)
- Gear readiness checklist (CheckboxGroup)
- Optional notes textarea
- Sibling enrollment

**Bullyproofing:**
- Primary concern (Being bullied / Exhibiting bullying behaviour / General confidence building) — radio
- Age group (6–9 / 10–13 / 14+) — radio
- Optional notes textarea
- Sibling enrollment

### Step 4 — Waivers (`StepWaivers.tsx`)

Checkboxes: liability waiver · photo/media consent · medical treatment consent · terms agreement.
Typed legal signature field + date field.

The UI collects all four checkboxes. Validation requires the liability waiver, medical consent, terms agreement, typed signature, and a valid date. The server re-checks the same fields before writing records.

### Step 5 — Payment (`StepPayment.tsx`)

Shows `OrderSummaryCard` (pricing breakdown + discount code input), then Stripe `PaymentElement`.

For the live BJJ path, the wizard reaches payment by:

1. calling `POST /api/register/cart`
2. calling `POST /api/payments/create-order-intent`
3. rendering Stripe Elements with the returned `clientSecret`
4. confirming the payment through `stripe.confirmPayment()`

## Registration draft persistence

`useRegistration.ts` saves draft to `localStorage` under key `ss-reg-draft-{slug}` on every `updateDraft` call. On load, it checks for an existing draft and surfaces a `ResumeBanner` component with "Resume" / "Start fresh" options.

## Draft type

```typescript
type RegistrationDraft = {
  guardian: GuardianInfo;
  student: StudentInfo;
  programDetails: {
    sessionId: number | null;
    priceId: number | null;
    siblingCount: 0 | 1 | 2;
    programSpecific: ProgramSpecificData;  // BjjSpecific | ArcherySpecific | ...
  };
  waivers: WaiverInfo;
  payment: { discountCode: string };
};
```

## Step validation

`useStepValidation(stepId, draft)` returns `{ errors, touch, isValid, validateAndTouch }`. Each step calls `validateAndTouch()` on "Next" — if invalid, all fields are marked touched and errors display with red borders + helper text. Validation currently covers the guardian, student, program detail, and waiver steps.

## Capacity / waitlist

The live BJJ order flow checks `program_sessions.capacity` vs `enrolled_count` before finalizing payable registrations:

- If `enrolled_count < capacity` → normal registration, order continues to payment
- If full → waitlist registration, status = `waitlisted`, returns `{ waitlisted: true, position }`
- Frontend redirects to `/registration/waitlist?pos=N&program=...`
- Waitlisted submissions still persist guardians, students, and waivers, and they trigger a dedicated waitlist confirmation email.

## Payment: order-first BJJ checkout (`create-order-intent.ts`)

`POST /api/payments/create-order-intent` is the authoritative BJJ payment setup endpoint.

It:

1. loads the `enrollment_order` plus linked `registrations`
2. recomputes tuition from D1 pricing and `shared/orderPricing.ts`
3. applies sibling math and promo discounts server-side
4. creates or reuses a Stripe `Customer`
5. creates a Stripe `PaymentIntent` for the amount due today
6. stores `stripe_payment_intent_id`, adjusted totals, later-payment date, and metadata back on the order
7. inserts the first `payments` row with `payment_type = 'order_deposit'`

If the line uses `payment_choice = 'plan'`, the remainder is stored on the order and later collected by `POST /api/payments/collect-order-balance`.

## Webhook (`webhook.ts`)

The webhook updates order + payment + registration state from Stripe events.

Key behaviors:

- `payment_intent.succeeded` marks the order paid or partially paid, updates linked registrations, and clears manual-review fields
- `payment_intent.payment_failed` marks the order for manual review and stores the latest Stripe error
- successful first payments can leave a later balance on the order
- later-charge failures are not silent; they land in admin-visible manual-review fields

## Email notifications

On successful registration:
- **Guardian** receives registration confirmation with summary (program, student name, date)
- **Admin** (`EMAIL_TO`) receives new registration notification

Templates are in `functions/_utils/emailTemplates.ts`.

## Post-payment pages

| Route | Shows |
|---|---|
| `/registration/success?rid=N` | Clay checkmark, registration ID badge, 3-step "what happens next" timeline |
| `/registration/waitlist?pos=N&program=X` | Waitlist position, expected timeline, program alternatives |
| `/registration/cancel` | Payment cancelled, option to retry |
| `/registration/pending` | Async payment pending (bank redirects etc.) |
