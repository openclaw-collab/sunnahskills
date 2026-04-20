# Archery Cart Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move archery registration into the authenticated Family & Member Account cart checkout path, with no private-offer flow and a $125 four-session price.

**Architecture:** Reuse the existing guardian session, saved participants, family cart, `/registration/cart`, `/api/register/cart`, and `/api/payments/create-order-intent` order-first checkout. Add archery as a cart line type with eye dominance and a waiver-specific registration flow, while preserving existing BJJ behavior and leaving discount-code plumbing available.

**Tech Stack:** React 18, TypeScript, Wouter, TanStack Query, Vitest, React Testing Library, Cloudflare Pages Functions, D1, Stripe PaymentIntents.

---

## Files

- Modify `client/src/lib/familyCart.ts`: add `programSlug` and archery-specific cart metadata.
- Modify `client/src/pages/registration/ArcheryRegistration.tsx`: replace shared wizard wrapper with account-gated cart builder.
- Modify `client/src/pages/registration/CartPage.tsx`: display mixed BJJ/archery line labels, validate/fetch archery waiver when needed, and validate discounts against each line program.
- Modify `functions/api/register/cart.ts`: accept BJJ and archery cart lines, create registrations under the line program id, apply fixed $125 archery pricing, and store eye-dominance metadata.
- Modify `functions/api/payments/create-order-intent.ts`: set Stripe metadata program id to `multi` or the real line program set, not hardcoded `bjj`.
- Modify `client/src/__tests__/integration/registration-flow.test.tsx`: cover archery account/cart behavior.
- Modify `functions/__tests__/register-cart.test.ts`: cover archery cart API behavior.
- Modify docs only if needed after implementation.

## Tasks

### Task 1: Cart Types and Archery Page RED/GREEN

- [ ] Write a frontend test that renders `/programs/archery/register` with an authenticated complete guardian account, selects a saved participant, chooses eye dominance after showing the YouTube link, adds archery to cart, and expects `/registration/cart` navigation.
- [ ] Run the test and verify it fails because `ArcheryRegistration` still renders `ProgramRegistrationPage`.
- [ ] Extend `FamilyCartLine` with `programSlug: "bjj" | "archery"` and archery-specific fields: `eyeDominance`, `dominantHand`, `experience`, `notes`.
- [ ] Replace `ArcheryRegistration` with an account-gated cart builder modeled after `BJJRegistration`, but with no age/gender filtering, no private offers, fixed `$125` copy, eye dominance options, and the video link `https://www.youtube.com/watch?v=zzotW5QE4gQ`.
- [ ] Run the frontend test and verify it passes.

### Task 2: Cart Review UI RED/GREEN

- [ ] Write a CartPage test that loads a cart with an archery line and expects the line to show `Traditional Archery`, `$125`, and eye dominance metadata.
- [ ] Run the test and verify it fails because cart display assumes BJJ tracks.
- [ ] Update CartPage display helpers so BJJ lines keep BJJ track labels and archery lines show `Traditional Archery · Four-session series`, eye dominance, and full-payment copy.
- [ ] Fetch the archery waiver when the cart contains any archery line; keep the current registration waiver for BJJ-only carts.
- [ ] Run the CartPage test and verify it passes.

### Task 3: Cart API RED/GREEN

- [ ] Write a function test for `POST /api/register/cart` with a signed-in guardian and one archery line. Expect an `enrollment_order`, a registration with `program_id = "archery"`, total/due-today `12500`, and stored `eyeDominance`.
- [ ] Run the test and verify it fails because the API schema only accepts BJJ lines and inserts `program_id = 'bjj'`.
- [ ] Update the schema to allow line `programSlug`, BJJ-specific details for BJJ, and archery-specific details for archery.
- [ ] Branch line validation: keep BJJ age/gender/track checks; for archery require only a valid participant, active archery program, active/visible archery session if selected, and eye dominance.
- [ ] Compute archery cart pricing as exactly `12500` cents, full due today, no payment plan, no sibling discount.
- [ ] Insert archery registrations with `program_id = "archery"` and program-specific JSON containing eye dominance, dominant hand, experience, notes, and discount metadata.
- [ ] Run the function test and verify it passes.

### Task 4: Payment Metadata, Verification, Commit, Push

- [ ] Update `create-order-intent` metadata so mixed carts do not claim `program_id=bjj`.
- [ ] Run focused frontend and function tests.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Stage only task files, commit to `main`, and push `origin main`.

## Self-Review

- Public program pages are intentionally not redesigned.
- Private offer UI is removed from the archery registration path by no longer using `ProgramRegistrationPage`.
- Discount-code plumbing is not removed.
- The old `POST /api/register` archery path may remain for backward compatibility/tests, but live route uses the account cart.
