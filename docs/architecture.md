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
| `cookies.ts` | `setCookie` / `getCookie` helpers with HttpOnly/Secure/SameSite |
| `email.ts` | Sends via MailChannels (POST `https://api.mailchannels.net/tx/v1/send`) |
| `emailTemplates.ts` | HTML templates: registration confirmation, payment receipt, waitlist, admin notification |

## Data flow: Registration + Payment

```
User fills wizard (client)
  │
  ├── Draft saved to localStorage (key: ss-reg-draft-{slug})
  │
  └── Step 5 "Submit & Pay"
        │
        ├── POST /api/register
        │     ├── Validates payload (Zod)
        │     ├── Checks session capacity → returns { waitlisted: true, position } if full
        │     ├── Inserts: guardians, students, registrations, waivers
        │     └── Returns { registrationId }
        │
        ├── POST /api/payments/create-intent  (one-time programs)
        │     ├── Calculates total (price + reg fee - sibling discount - promo code)
        │     ├── Creates Stripe PaymentIntent server-side
        │     └── Returns { clientSecret }
        │
        ├── POST /api/payments/create-subscription  (recurring: BJJ)
        │     ├── Creates/retrieves Stripe Customer by email
        │     ├── Applies sibling coupon if siblingCount > 0
        │     ├── Creates Stripe Subscription (payment_behavior: default_incomplete)
        │     └── Returns { clientSecret } from latest_invoice.payment_intent
        │
        └── Stripe Elements confirmPayment() (client)
              │
              ├── On success → redirects to /registration/success?rid=N
              └── On webhook (invoice.paid / payment_intent.succeeded)
                    POST /api/payments/webhook
                          └── Updates payment status in D1
                              Sends confirmation email via MailChannels
```

## Data flow: Admin

```
Admin visits /admin
  └── POST /api/auth/login (email + password)
        ├── bcrypt.compare against admin_users.password_hash
        ├── Inserts admin_sessions row (token = 32-byte hex, 24h TTL)
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
        ├── Polls /api/studio/sessions/:id every 5s for multi-user sync
        │
        └── On any change → debounced PATCH /api/studio/sessions/:id
              └── Persists edits_json, comments_json, positions_json, custom_theme_json to D1
```

## Deployment

Deployed to Cloudflare Pages. The `prototype` branch auto-deploys.

Build command: `npm run build`  
Build output: `dist/`  
Functions directory: `functions/`  
D1 binding: `DB` → `sunnahskills-admin-v2` (`fc0a958f-4bfe-487f-845f-bce49d4715d5`)

See [`cloudflare-deploy.md`](cloudflare-deploy.md) for the full deployment guide.
