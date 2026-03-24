# Architecture

## Overview

Sunnah Skills is a **React SPA** served as static assets from **Cloudflare Pages**, with backend logic handled by **Cloudflare Pages Functions** (Cloudflare Workers runtime). Persistent data lives in **Cloudflare D1** (SQLite). Payments are processed by **Stripe**. Transactional email is sent via **MailChannels**.

```
Browser
  │
  ├── Static Assets (React/Vite build)
  │     Cloudflare Pages CDN (dist/)
  │
  └── API Requests (/api/*)
        Cloudflare Pages Functions (functions/)
              │
              ├── D1 (SQLite)  ──  sunnahskills-admin-v2
              ├── Stripe API   ──  payments, subscriptions, webhooks
              └── MailChannels ──  transactional email
```

## Registration & payments (current)

- **Programs:** Only **BJJ** is `enrollmentStatus: "open"` in `programConfig`; others are coming soon (waitlist UI + `403` from `register` API).
- **D1:** `db/migrations/001_registration_accounts_orders.sql` plus `002_enrollment_order_installments.sql` — `guardian_accounts`, magic tokens, sessions, `saved_students`, **`enrollment_orders`** (installment fields), **`semesters`**, linked `registrations` / `payments`, and order metadata for webhooks.
- **Checkout model:** Family cart (`/registration/cart`), `POST /api/register/cart` → `enrollment_orders` + linked `registrations`; waivers once at checkout; Stripe invoicing / installments with webhooks updating D1 — see `docs/NEXT_AGENT.md` for ops (e.g. `collect-order-balance`).
- **Pricing (single source):** Line math for kids/sibling, pay-today vs plan split, and semester dates live in **`shared/orderPricing.ts`** (used by payment endpoints and mirrored in **`OrderSummaryCard`** via `GET /api/programs`, which includes **`active_semester`** per program for public estimates).
- **Kids pricing:** $12.50/class × classes in semester + **10%** off each additional sibling’s **kids** lines — low-level cents helpers in `shared/pricing.ts`; server always recomputes.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Build tool | Vite |
| Routing | Wouter |
| Data fetching | TanStack Query v5 |
| UI base | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS |
| Animations | GSAP + ScrollTrigger |
| 3D (GrappleMap) | Three.js + @react-three/fiber |
| Forms | React Hook Form + Zod |
| Backend runtime | Cloudflare Pages Functions (Workers) |
| Database | Cloudflare D1 (SQLite) |
| Payments | Stripe Elements + Stripe API |
| Email | MailChannels (via Cloudflare Workers) |
| Auth (admin) | bcrypt + D1 session tokens, HttpOnly cookie |
| Auth (studio) | URL token + bcrypt password gate, HttpOnly cookie |
| Testing | Vitest + @testing-library/react |
| Language | TypeScript throughout |

## Frontend structure

### Providers (App.tsx)

```
QueryClientProvider (TanStack Query)
  └── TooltipProvider
        └── StudioProvider  ← Stakeholder Studio context
              ├── Toaster
              ├── Router    ← all pages + Navigation + Footer
              └── StudioPanel  ← Studio overlay UI
```

`StudioProvider` boots in either local mode (`?studio=1`) or shared session mode (`?studio=<UUID>`), applies the active theme, and polls shared sessions every 10 seconds.

### Design system (`components/brand/`)

All brand UI is extracted into reusable primitives:

| Component | Purpose |
|---|---|
| `ClayButton` | Primary CTA, clay (#CE5833) fill |
| `OutlineButton` | Secondary action |
| `MagneticButton` | Magnetic hover effect CTA |
| `DarkCard` | Dark charcoal surface card |
| `PremiumCard` | Cream/light card with shadow |
| `TelemetryCard` | Data/metric display card |
| `SectionHeader` | Page/section title with eyebrow label |
| `StatusDot` | Colored enrollment status indicator |
| `ClayButton`, `OutlineButton`, `MagneticButton` | Brand CTA variants with different emphasis levels |

### Brand palette (Tailwind)

| Token | Hex | Use |
|---|---|---|
| `cream` | `#F5F0E8` | Page background |
| `charcoal` | `#1A1A1A` | Dark surfaces, primary text |
| `moss` | `#3D5A3E` | Accent, section dividers |
| `clay` | `#CE5833` | CTAs, highlights |

### Typography

| Font | Use |
|---|---|
| Outfit | Headings |
| Plus Jakarta Sans | Body text |
| Cormorant Garamond | Serif accent (quotes, pullouts) |
| JetBrains Mono | Labels, mono code |

## Backend structure (`functions/`)

All API endpoints are Cloudflare Pages Functions. They receive a `context` with:
- `context.env.DB` — D1 binding
- `context.env.STRIPE_SECRET_KEY` — Stripe secret
- `context.env.STRIPE_WEBHOOK_SECRET` — Webhook secret
- `context.env.EMAIL_FROM`, `context.env.EMAIL_TO` — Email config
- `context.env.SITE_URL` — Full domain

### Utility modules (`functions/_utils/`)

| File | Purpose |
|---|---|
| `adminAuth.ts` | Reads `admin_session` cookie → validates against `admin_sessions` in D1 |
| `guardianAuth.ts` | Guardian/family session cookie + account lookup for `functions/api/guardian/*` |
| `cookies.ts` | `setCookie` / `getCookie` helpers with HttpOnly/Secure/SameSite |
| `email.ts` | Sends via MailChannels (POST `https://api.mailchannels.net/tx/v1/send`) |
| `emailTemplates.ts` | HTML templates: registration confirmation, payment receipt, waitlist, admin notification |

### Shared modules (`shared/` — imported by Functions + Vite client)

| File | Purpose |
|---|---|
| `orderPricing.ts` | Line tuition, kids/sibling rules, pay-today vs plan split, semester date helpers (same math as payments) |
| `pricing.ts` | Low-level cents helpers for kids lines and sibling discount |
| `registration-options.ts` | Canonical select options for registration Zod/UI |
| `schema.ts` / `types.ts` | Cross-boundary Zod + types |

## Data flow: Registration + Payment

### Path A — Single-student wizard (per program)

```
User fills wizard (client)
  │
  ├── Draft saved to localStorage (key: ss-reg-draft-{slug})
  │
  └── Waivers step → "Submit & Pay"
        │
        ├── POST /api/register
        │     ├── Validates payload (Zod)
        │     ├── Checks session capacity → returns { waitlisted: true, position } if full
        │     ├── Inserts: guardians, students, registrations, waivers
        │     └── Returns { registrationId }
        │
        ├── POST /api/payments/create-intent  (typical for BJJ one-time / fallback)
        │     ├── Loads `semesters` + `program_prices`; uses shared/orderPricing.ts
        │     ├── Creates Stripe PaymentIntent server-side
        │     └── Returns { clientSecret, paymentIntentId }
        │
        ├── POST /api/payments/create-subscription  (optional recurring path)
        │     ├── If subscriptions not configured → { error: "subscriptions_not_configured" } → client falls back to create-intent
        │     └── Else returns { clientSecret } from invoice payment intent
        │
        └── Stripe Elements confirmPayment() (client)
              ├── On success → /registration/success?rid=N
              └── Webhook → POST /api/payments/webhook → D1 + MailChannels
```

### Path B — Family cart (BJJ, multi-line)

```
Cart lines in localStorage (familyCart) + /registration/cart
  │
  ├── POST /api/register/cart — one guardian, N lines, waivers once
  │     └── Creates enrollment_orders row + linked registrations
  │
  ├── POST /api/payments/create-order-intent
  │     ├── Totals from shared/orderPricing.ts per line; Stripe Customer + PaymentIntent (due today)
  │     └── Returns { clientSecret, dueTodayCents, dueLaterCents, laterPaymentDate, ... }
  │
  ├── Optional: POST /api/payments/collect-order-balance (Bearer CRON_SECRET) for second installment
  │
  └── Webhook updates order + registrations consistently
```

**Public catalog:** `GET /api/programs` returns programs, sessions, prices, and **`active_semester`** per program (for `OrderSummaryCard` and schedule-aware UI).

## Data flow: Admin

```
Admin visits /admin
  └── POST /api/auth/login (email + password)
        ├── bcrypt.compare against admin_users.password_hash
        ├── Inserts admin_sessions row (token = UUID, 7-day TTL)
        └── Sets HttpOnly cookie "admin_session"

All /api/admin/* routes
  └── adminAuth() utility
        ├── Reads "admin_session" cookie
        ├── Validates token in admin_sessions (checks expires_at)
        └── Returns 401 if invalid
```

## Data flow: Stakeholder Studio

```
Stakeholder receives URL: https://site.com/?studio=<UUID>
  │
  └── StudioProvider detects ?studio param
        ├── If UUID → "session" mode → GET /api/studio/sessions/:id
        │     ├── Password-protected → shows PasswordGate (POST cookie)
        │     └── Loads session: edits, comments, uploads, positions, theme
        │
        ├── Polls /api/studio/sessions/:id every 10s for multi-user sync
        │
        └── On any change → debounced PATCH /api/studio/sessions/:id
              └── Persists edits_json, comments_json, positions_json, custom_theme_json to D1
```

## Deployment

Deployed to Cloudflare Pages. The `main` branch is production and `prototype` creates preview deployments.

Build command: `npm run build`  
Build output: `dist/`  
Functions directory: `functions/`  
D1 binding: `DB` → `sunnahskills-admin-v2` (`fc0a958f-4bfe-487f-845f-bce49d4715d5`)

See [`cloudflare-deploy.md`](cloudflare-deploy.md) for the full deployment guide.
