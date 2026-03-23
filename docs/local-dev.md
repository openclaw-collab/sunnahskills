# Local Development

## Prerequisites

- Node.js 18+
- npm 9+
- Cloudflare account (for D1 local access via Wrangler)

```bash
npm install
```

## Option 1: Vite dev server only (frontend only)

```bash
npm run dev
```

Starts on `http://localhost:5173`. 

**Limitation:** API calls to `/api/*` will fail — there are no Pages Functions running. Use this only for pure UI work.

## Option 2: Full local stack (frontend + Functions + D1)

This is the recommended approach for working on registration, admin, or payments.

### 1. Build the frontend

```bash
npm run build
```

### 2. Set up local D1

If you haven't already:

```bash
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/schema.sql
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/seed.sql
```

### 3. Create a local `.dev.vars` file

Wrangler reads this file for local secrets (equivalent to Cloudflare secrets in production):

```bash
# .dev.vars (do not commit this file)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 4. Run wrangler dev

```bash
npx wrangler pages dev dist --d1=DB
```

This starts the full Cloudflare Pages local emulator on `http://localhost:8788`:
- Static assets served from `dist/`
- Pages Functions from `functions/`
- D1 from local SQLite (`.wrangler/state/v3/d1/`)

### 5. Stripe webhooks locally

In a separate terminal:

```bash
stripe listen --forward-to http://localhost:8788/api/payments/webhook
```

This requires the [Stripe CLI](https://stripe.com/docs/stripe-cli). The webhook secret printed by `stripe listen` should match your `STRIPE_WEBHOOK_SECRET` in `.dev.vars`.

## Environment variables summary

| Variable | Where to set locally |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `.env` in project root (Vite) |
| `STRIPE_SECRET_KEY` | `.dev.vars` (Wrangler) |
| `STRIPE_WEBHOOK_SECRET` | `.dev.vars` (Wrangler) |
| `SITE_URL` | `.dev.vars` / `wrangler.toml` — default worker origin `http://localhost:8788`. For **guardian magic links** that should open the Vite app, set `SITE_URL=http://localhost:5173` while testing email links (verify route must match where you want users to land). |
| `EMAIL_FROM` / `EMAIL_TO` | `wrangler.toml` [vars] — already set |

## Running tests

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
```

Tests use Vitest and `@testing-library/react`. Test files are in `client/src/__tests__/`.

## Typecheck

```bash
npm run typecheck
```

This runs `tsc --noEmit` against the full project. Fix any TypeScript errors before deploying.

## Build for production

```bash
npm run build
```

Output goes to `dist/`. The Cloudflare Pages build pipeline also runs this command automatically on push to `prototype`.

## Common issues

**`wrangler` not found:** Run `npx wrangler` or install globally: `npm install -g wrangler`

**D1 binding error locally:** Make sure your `wrangler.toml` `database_id` is correct. Local D1 doesn't require the remote ID to match, but the binding name `DB` must match what `wrangler pages dev --d1=DB` specifies.

**Stripe Elements not loading:** `VITE_STRIPE_PUBLISHABLE_KEY` must be set in `.env` before running `npm run build`. Vite embeds it at build time.

**Email not sending locally:** MailChannels only works from deployed Cloudflare Workers. Email is silently skipped in local dev — this is expected.
