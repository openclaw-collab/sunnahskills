# Registration System

## Overview

Each program has its own registration route that wraps a shared 5-step wizard (`RegistrationWizard`). The wizard is program-aware: field sets, pricing logic, and payment type (one-time vs. subscription) all vary by program slug.

## Routes

| Slug | URL | Payment type |
|---|---|---|
| `bjj` | `/programs/bjj/register` | Recurring subscription (monthly) |
| `archery` | `/programs/archery/register` | Seasonal one-time |
| `outdoor` | `/programs/outdoor/register` | Per-workshop one-time |
| `bullyproofing` | `/programs/bullyproofing/register` | Workshop / package one-time |

## Wizard steps

```
Step 1: Guardian Info
Step 2: Student Info
Step 3: Program Details  ← program-specific fields
Step 4: Waivers & Consent
Step 5: Payment (Stripe Elements)
```

### Step 1 — Guardian Info (`StepGuardianInfo.tsx`)

Fields: full name · email · phone · emergency contact name · emergency contact phone · relationship (select).

Validation: all required, email format, US phone format.

### Step 2 — Student Info (`StepStudentInfo.tsx`)

Fields: full name · preferred name · date of birth (auto-computes age) · gender (radio) · skill level (radio) · medical notes / allergies (textarea).

Validation: name required, DOB required, gender required.

### Step 3 — Program Details (`StepProgramDetails.tsx`)

Branched by `program.slug`:

**BJJ:**
- Gender group (Boys / Girls) — radio
- Age group (Kids 5–9 / Juniors 10–14 / Teens 15–17) — radio
- Want a trial class first? (Yes / No) — radio
- Sibling enrollment (0 / 1 / 2+) — shared radio

**Archery:**
- Dominant hand (Right / Left / Not sure) — radio
- Prior archery experience (radio)
- Session selection (SelectField from DB sessions)
- Sibling enrollment

**Outdoor Workshops:**
- Workshop date selection (SelectField)
- Equipment acknowledgment (checkbox)
- Gear readiness checklist (CheckboxGroup)
- Sibling enrollment

**Bullyproofing:**
- Age group (5–9 / 10–14 / 15–17) — radio
- Primary concern (radio: Confidence / Bullying / Self-defence / General fitness)
- Additional parent notes (one textarea per step)
- Sibling enrollment

### Step 4 — Waivers (`StepWaivers.tsx`)

Checkboxes: liability waiver · photo/media consent · medical treatment consent · terms agreement.
Typed legal signature field + date auto-fill.

All four checkboxes are required to proceed.

### Step 5 — Payment (`StepPayment.tsx`)

Shows `OrderSummaryCard` (pricing breakdown + promo code input), then Stripe `PaymentElement`.

On submit: calls `create-intent` or `create-subscription` depending on program type, then `stripe.confirmPayment()`.

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
  promoCode?: string;
};
```

## Step validation

`useStepValidation(stepId, draft)` returns `{ errors, touch, isValid, validateAndTouch }`. Each step calls `validateAndTouch()` on "Next" — if invalid, all fields are marked touched and errors display with red borders + helper text.

## Capacity / waitlist

`POST /api/register` checks `program_sessions.capacity` vs `enrolled_count`:

- If `enrolled_count < capacity` → normal registration, status = `submitted`
- If full → waitlist registration, status = `waitlisted`, returns `{ waitlisted: true, position }`
- Frontend redirects to `/registration/waitlist?pos=N&program=...`

## Payment: one-time (`create-intent.ts`)

1. Looks up `program_prices` row for the selected `priceId`
2. Calculates: `total = amount + registration_fee - discountAmount`
3. Sibling discount: 10% off if `siblingCount > 0`
4. Validates promo code against `discounts` table if provided
5. Creates Stripe `PaymentIntent` server-side
6. Inserts `payments` row with status `pending`
7. Returns `{ clientSecret }`

## Payment: subscription (`create-subscription.ts`)

For BJJ (recurring):

1. Creates or retrieves Stripe `Customer` by guardian email
2. Looks up `stripe_price_id` from `program_prices.metadata` JSON
3. If `siblingCount > 0`: creates/retrieves a Stripe Coupon for 10% off (`SIBLING_10PCT`)
4. Creates Stripe `Subscription` with `payment_behavior: "default_incomplete"`, expands `latest_invoice.payment_intent`
5. Inserts `payments` row with `payment_type: "subscription"` and `stripe_subscription_id`
6. Returns `{ clientSecret }` from the subscription's payment intent

If `STRIPE_SECRET_KEY` is not set, returns `{ subscriptions_not_configured: true }` and falls back to a one-time payment intent.

## Webhook (`webhook.ts`)

Handles `payment_intent.succeeded` and `invoice.paid`:
- Updates `payments.status` to `paid`
- Updates `registrations.status` to `active`
- Sends confirmation email via MailChannels

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
