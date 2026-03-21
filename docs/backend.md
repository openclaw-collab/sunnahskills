# Backend Architecture

## Overview

The backend is implemented as **Cloudflare Pages Functions** — individual TypeScript files under `functions/` that are compiled to Cloudflare Workers and run at the edge. There is no Express server, no Node.js process, and no traditional server runtime.

Each file under `functions/api/` maps to an API route. Cloudflare Pages handles routing automatically based on the file path. Functions receive a standard `Request` and return a standard `Response` (Web Platform APIs).

## Runtime environment

| Capability | Notes |
|---|---|
| Runtime | Cloudflare Workers (V8 isolates) |
| Language | TypeScript → compiled by Wrangler |
| Module format | ES Modules (`export async function onRequest...`) |
| Request/Response | Web Platform standard (`Request`, `Response`, `Headers`) |
| Async | `async/await` throughout |
| No Node APIs | `fs`, `path`, `crypto` (Node) unavailable — use Web Crypto API (`crypto.randomUUID()`, etc.) |

## Route mapping

Cloudflare Pages Functions use file-based routing under `functions/`. A file at `functions/api/register.ts` handles requests to `/api/register`.

| File | HTTP Method | Route |
|---|---|---|
| `functions/api/contact.ts` | POST | `/api/contact` |
| `functions/api/programs.ts` | GET | `/api/programs` |
| `functions/api/register.ts` | POST | `/api/register` |
| `functions/api/waitlist.ts` | POST | `/api/waitlist` |
| `functions/api/payments/create-intent.ts` | POST | `/api/payments/create-intent` |
| `functions/api/payments/create-subscription.ts` | POST | `/api/payments/create-subscription` |
| `functions/api/payments/webhook.ts` | POST | `/api/payments/webhook` |
| `functions/api/discounts/validate.ts` | POST | `/api/discounts/validate` |
| `functions/api/auth/login.ts` | POST | `/api/auth/login` |
| `functions/api/auth/logout.ts` | POST | `/api/auth/logout` |
| `functions/api/auth/me.ts` | GET | `/api/auth/me` |
| `functions/api/admin/registrations.ts` | GET | `/api/admin/registrations` |
| `functions/api/admin/registrations/[id].ts` | GET, PATCH | `/api/admin/registrations/:id` |
| `functions/api/admin/payments.ts` | GET | `/api/admin/payments` |
| `functions/api/admin/programs.ts` | GET, PATCH | `/api/admin/programs` |
| `functions/api/admin/sessions.ts` | PATCH | `/api/admin/sessions` |
| `functions/api/admin/discounts.ts` | GET, POST, PATCH | `/api/admin/discounts` |
| `functions/api/admin/contacts.ts` | GET | `/api/admin/contacts` |
| `functions/api/admin/export.ts` | GET | `/api/admin/export` |
| `functions/api/admin/positions.ts` | GET | `/api/admin/positions` |
| `functions/api/admin/sequences.ts` | GET, POST | `/api/admin/sequences` |
| `functions/api/studio/sessions.ts` | POST | `/api/studio/sessions` |
| `functions/api/studio/sessions/[id].ts` | GET, POST, PATCH | `/api/studio/sessions/:id` |
| `functions/api/studio/uploads.ts` | POST | `/api/studio/uploads` |

## Function signature

Every function file exports one or more named handler functions:

```typescript
interface Env {
  DB: D1Database;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  SITE_URL?: string;
  STUDIO_UPLOADS?: R2Bucket;   // optional, only when R2 is enabled
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  // ...
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

// For dynamic routes ([id].ts), params are available:
export async function onRequestGet({ request, env, params }: { request: Request; env: Env; params: { id: string } }) {
  const id = params.id;
  // ...
}
```

Method-specific handlers: `onRequestGet`, `onRequestPost`, `onRequestPatch`, `onRequestDelete`. Use `onRequest` to handle all methods and branch on `request.method`.

## Utility modules (`functions/_utils/`)

### `adminAuth.ts`

Admin session management. Two key exports:

- `createAdminSession(env, adminUserId)` — generates a `crypto.randomUUID()` token, inserts into `admin_sessions` with 7-day TTL, returns the token + a serialized `HttpOnly Secure SameSite=Lax` cookie string.
- `getAdminFromRequest(env, request)` — reads `admin_session` cookie, validates against D1, returns admin user object or `null`. Expired sessions are deleted on access.
- `clearAdminSessionCookie()` — returns a `maxAge=0` cookie to clear the session.

Usage pattern in admin routes:

```typescript
const admin = await getAdminFromRequest(env, request);
if (!admin) return json({ error: "Unauthorized" }, { status: 401 });
```

### `cookies.ts`

- `parseCookieHeader(header)` — parses `Cookie:` header into a `Record<string, string>`
- `serializeCookie(name, value, options)` — builds a `Set-Cookie` header value with `httpOnly`, `secure`, `sameSite`, `path`, `maxAge`

### `email.ts`

`sendMailChannelsEmail(env, { to, from, replyTo, subject, text, html })` — POSTs to MailChannels API. Email errors are always caught and never bubble up to block the main request flow.

### `emailTemplates.ts`

Pure functions returning `{ subject, text, html }` objects:

- `registrationConfirmationEmail({ guardianName, studentName, programName, registrationId, siteUrl })`
- `adminNewRegistrationEmail({ guardianName, guardianEmail, studentName, programName, registrationId, siteUrl })`
- `paymentReceiptEmail({ ... })`
- `waitlistEmail({ ... })`

## D1 database access

The D1 binding is available as `env.DB` (type `D1Database`). All queries use the prepared statement API:

```typescript
// Single row
const row = await env.DB.prepare("SELECT * FROM programs WHERE slug = ?")
  .bind(slug)
  .first();

// Multiple rows
const { results } = await env.DB.prepare("SELECT * FROM registrations ORDER BY created_at DESC")
  .all();

// Mutation (INSERT / UPDATE / DELETE)
const result = await env.DB.prepare("INSERT INTO guardians (full_name, email) VALUES (?, ?)")
  .bind(fullName, email)
  .run();
const newId = result.meta?.last_row_id as number;
```

**Important:** D1 uses SQLite types. Booleans are stored as `INTEGER` (0/1). JSON objects are stored as `TEXT` (use `JSON.stringify`/`JSON.parse`). Dates are stored as `TEXT` in ISO 8601 format or SQLite `datetime('now')`.

## Validation with Zod

All POST endpoints validate request bodies with Zod before touching the database:

```typescript
import { z } from "zod";

const schema = z.object({
  programSlug: z.enum(["bjj", "archery", "outdoor", "bullyproofing"]),
  guardian: z.object({ fullName: z.string().min(1), email: z.string().email() }),
});

const parsed = schema.safeParse(await request.json().catch(() => null));
if (!parsed.success) {
  return json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
}
const body = parsed.data;
```

## Stripe integration (server-side)

The payment code uses both patterns:

- `create-intent.ts` calls the Stripe REST API directly with `fetch`
- `create-subscription.ts` and `webhook.ts` use the Stripe SDK for subscription and event handling

```typescript
const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ amount: "5000", currency: "usd" }),
});
```

Webhook verification uses the Stripe SDK with the raw request body and `STRIPE_WEBHOOK_SECRET`.

### Payment flow

```
POST /api/payments/create-intent
  1. Look up registrations + program_prices from D1
  2. Calculate total (amount + registration_fee - sibling_discount - promo_discount)
  3. Create Stripe PaymentIntent via REST API
  4. Insert payments row (status: 'pending', payment_type: 'one_time')
  5. Update registrations.status → 'pending_payment'
  6. Return { clientSecret, paymentIntentId }

POST /api/payments/create-subscription (BJJ only)
  1. Create/retrieve Stripe Customer by email
  2. Look up stripe_price_id from program_prices.metadata JSON
  3. Create/retrieve sibling Coupon (SIBLING_10PCT) if siblingCount > 0
  4. Create Stripe Subscription (payment_behavior: 'default_incomplete')
  5. Expand latest_invoice.payment_intent to get clientSecret
  6. Insert payments row (payment_type: 'subscription')
  7. Return { clientSecret }
  8. If subscriptions are not configured, return `{ error: "subscriptions_not_configured" }` and let the client fall back to a one-time intent

POST /api/payments/webhook
  1. Verify Stripe-Signature header
  2. Handle payment_intent.succeeded → payments.status = 'paid', registrations.status = 'active'
  3. Handle invoice.paid → same
  4. Send confirmation email
```

## Error handling conventions

All functions follow this response pattern:

```typescript
function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

// Success
return json({ ok: true, registrationId: 42 });

// Client error
return json({ error: "Invalid payload", issues: [...] }, { status: 400 });

// Auth error
return json({ error: "Unauthorized" }, { status: 401 });

// Not found
return json({ error: "Registration not found" }, { status: 404 });

// Server error
return json({ error: "DB not configured" }, { status: 500 });
```

Email and non-critical operations are always wrapped in `try/catch` and swallowed — they should never cause the primary response to fail.

## Environment variables

The `Env` interface is declared inline in each function file. All bindings and vars come from the Workers execution context:

| Binding/Var | Type | Required |
|---|---|---|
| `DB` | `D1Database` | Yes |
| `STRIPE_SECRET_KEY` | `string` | For payments |
| `STRIPE_WEBHOOK_SECRET` | `string` | For webhook |
| `EMAIL_FROM` | `string` | For email |
| `EMAIL_TO` | `string` | For admin email |
| `SITE_URL` | `string` | For email links |
| `STUDIO_UPLOADS` | `R2Bucket` | Optional (Studio images) |

Missing optional bindings cause graceful degradation (e.g., Stripe not configured → returns `subscriptions_not_configured` code instead of 500).

## Execution model notes

- **No shared state between requests** — every request is a fresh isolate execution. Do not use module-level mutable variables as a cache.
- **No `setTimeout` / `setInterval`** — Workers have a CPU time limit (~50ms for free tier, higher for paid). Long operations should use Durable Objects or Queues (not currently used).
- **D1 is eventually consistent** — writes from one request may not be immediately visible to concurrent reads in other requests. Not an issue at current scale.
- **Cold starts are rare** on Cloudflare but possible. Functions should be fast to initialize.
