# Registration System

## Overview

Each program has its own registration route that wraps a shared 5-step wizard (`RegistrationWizard`). The wizard is program-aware: field sets, pricing logic, and payment type (one-time vs. subscription) all vary by program slug.

## Routes & enrollment status

| Slug | URL | Enrollment | Payment (when open) |
|---|---|---|---|
| `bjj` | `/programs/bjj/register` | **Open** — full wizard | Subscription if configured, else PaymentIntent fallback |
| `archery` | `/programs/archery/register` | **Coming soon** — waitlist screen | — |
| `outdoor` | `/programs/outdoor/register` | **Coming soon** — waitlist screen | — |
| `bullyproofing` | `/programs/bullyproofing/register` | **Coming soon** — waitlist screen | — |

Non-BJJ `/programs/{slug}/register` URLs render a short **waitlist** message with links to **Contact** and the program detail page. The `/register` hub still lists all programs.

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

Validation: full name, email, phone, and relationship are required.

### Step 2 — Student Info (`StepStudentInfo.tsx`)

Fields: full name · preferred name · date of birth (auto-computes age) · gender (radio) · skill level (radio) · medical notes / allergies (textarea).

Validation: full name and date of birth are required. The age field is derived from the DOB.

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

On submit: calls `POST /api/register`, then `create-subscription` for BJJ or `create-intent` for one-time programs, and finally `stripe.confirmPayment()`.

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

`POST /api/register` checks `program_sessions.capacity` vs `enrolled_count`:

- If `enrolled_count < capacity` → normal registration, status = `submitted`
- If full → waitlist registration, status = `waitlisted`, returns `{ waitlisted: true, position }`
- Frontend redirects to `/registration/waitlist?pos=N&program=...`
- Waitlisted submissions still persist guardians, students, and waivers, and they trigger a dedicated waitlist confirmation email.

## Payment: one-time (`create-intent.ts`)

1. Looks up `program_prices` row for the selected `priceId`
2. Calculates: `total = amount + registration_fee - discountAmount`
3. Sibling discount: 10% off if `siblingCount > 0`
4. Validates promo code against `discounts` table if provided
5. Creates Stripe `PaymentIntent` server-side
6. Inserts `payments` row with status `pending`
7. Returns `{ clientSecret, paymentIntentId }`

Server-side validation now also rejects malformed `registrationId`, invalid sibling counts, and non-positive totals.

## Payment: subscription (`create-subscription.ts`)

For BJJ (recurring):

1. Creates or retrieves Stripe `Customer` by guardian email
2. Looks up `stripe_price_id` from `program_prices.metadata` JSON
3. If `siblingCount > 0`: creates/retrieves a Stripe Coupon for 10% off (`SIBLING_10PCT`)
4. Applies any valid promo code from the `discounts` table by creating a one-time Stripe coupon
5. Creates Stripe `Subscription` with `payment_behavior: "default_incomplete"`, expands `latest_invoice.payment_intent`
6. Inserts `payments` row with `payment_type: "subscription"` and `stripe_subscription_id`
7. Returns `{ clientSecret }` from the subscription's payment intent

If `STRIPE_SECRET_KEY` is not set, or no `stripe_price_id` is configured in `program_prices.metadata`, the subscription endpoint returns `{ error: "subscriptions_not_configured" }` and the client falls back to a one-time payment intent.

## Webhook (`webhook.ts`)

Handles `payment_intent.succeeded` and `invoice.paid`:
- Updates `payments.status` to `paid`
- Updates `registrations.status` to `active`
- Increments `program_sessions.enrolled_count` when a registration is tied to a session
- Sends confirmation email via MailChannels
- Ignores duplicate `payment_intent.succeeded` deliveries once a payment is already marked `paid`
- Marks subscription invoices `failed` on `invoice.payment_failed`

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
