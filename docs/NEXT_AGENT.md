# Handoff for the next agent

## Current focus (2026-03)

- **Registration:** BJJ only is open for live checkout; other programs use `enrollmentStatus: "coming_soon"` in `client/src/lib/programConfig.ts` and a waitlist screen on `/programs/{slug}/register`. Server gate: `functions/api/register.ts`.
- **Schedule:** `client/src/pages/Schedule.tsx` uses normalized data in `client/src/lib/scheduleCalendarData.ts` — week time-grid + month grid, filters, Tuesday overlap copy.
- **Guardian auth:** `functions/api/guardian/*` + D1 tables from `db/migrations/001_registration_accounts_orders.sql`. Magic link + account number flows; rate limiting should be hardened (see `docs/security.md`).
- **Family cart:** `POST /api/register/cart`, `POST /api/payments/create-order-intent`, optional `POST /api/payments/collect-order-balance` (cron + `CRON_SECRET`). Pricing: `shared/orderPricing.ts`; single-reg `create-intent` uses the same helpers + `semesters`.
- **Merged product spec:** The authoritative merged plan lives in your Cursor plans folder as `bjj_registration_merged_full.plan.md` (do not edit the plan file in-repo). This repo is the implementation source of truth.

## Suggested next milestones

1. **Stripe Invoices (Option D)** — current cart path uses PaymentIntents + saved PM + cron for the second charge; optional migration to hosted **Invoices** if product prefers.
2. **Guardian session + cart** — tie `enrollment_orders.guardian_account_id` to logged-in guardian when auth is required for checkout.
3. **Program hero imagery** — `programConfig.heroImage` points at `/programs/*`; optional: replace `ProgramVisual` abstract heroes with photo + scrim on program pages.
4. **Live Stripe** — follow `docs/stripe.md`; use `stripe listen` locally; owner secrets for production.

## Git

Product branch name for handoff commits: **`prototype`** (per merged plan §22).
