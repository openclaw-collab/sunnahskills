# Handoff for the next agent

## Current codebase (2026-03)

- **Registration:** BJJ only is open for live checkout; others use `enrollmentStatus: "coming_soon"` in `client/src/lib/programConfig.ts` and waitlist flows. Server gate: `functions/api/register.ts` (single) and `functions/api/register/cart.ts` (family cart).
- **Schedule:** `client/src/pages/Schedule.tsx` + `client/src/lib/scheduleCalendarData.ts` — week time-grid + month grid, filters, Tuesday overlap copy.
- **Guardian auth:** `functions/api/guardian/*` + `functions/_utils/guardianAuth.ts` + D1 tables from `db/migrations/001_registration_accounts_orders.sql`. Magic link + account number; rate limiting still recommended (`docs/security.md`).
- **Family cart:** `/registration/cart` → `POST /api/register/cart`, `POST /api/payments/create-order-intent`, optional `POST /api/payments/collect-order-balance` (cron + `CRON_SECRET`). Pricing: **`shared/orderPricing.ts`** (also used by `create-intent.ts` + **`OrderSummaryCard`** via `GET /api/programs` **`active_semester`**).
- **Program UI:** Photos from `client/public/programs/*` + `programConfig.heroImage`; `ProgramVisual` + `ProgramPageHeroMedia` (not abstract placeholders).
- **GrappleMap:** Vendored at repo root **`GrappleMap/`** (including `GrappleMap.txt`); ignore only `preview/node_modules`, `**/dist`, `.playwright-mcp` per `GrappleMap/.gitignore`.
- **Merged product spec:** Cursor plan `bjj_registration_merged_full.plan.md` (do not commit the plan file unless copying to `docs/`). **This repo is the implementation source of truth.**

## Suggested next milestones

1. **Stripe Invoices (Option D)** — cart path uses PaymentIntents + saved PM + optional cron for second charge; migrate to hosted **Invoices** if product prefers.
2. **Guardian session + cart** — tie `enrollment_orders.guardian_account_id` to logged-in guardian when checkout requires auth.
3. **Live Stripe** — follow `docs/stripe.md`; `stripe listen` locally; owner secrets for production.

## Git

Product branch for handoff commits: **`main`** for production and **`prototype`** for preview validation.
