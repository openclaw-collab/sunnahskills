# Sunnah Skills — Youth Programs Platform

Production-grade youth martial arts & outdoor program website with integrated registration, Stripe payments, admin dashboard, and a Stakeholder Studio review tool.

**Live:** [prototype.sunnahskills.pages.dev](https://prototype.sunnahskills.pages.dev)  
**Repo:** [github.com/openclaw-collab/sunnahskills](https://github.com/openclaw-collab/sunnahskills) — branch `prototype`  
**Stack:** React 18 + Vite · Cloudflare Pages Functions · Cloudflare D1 (SQLite) · Stripe Elements · MailChannels · Wouter · TanStack Query · Tailwind CSS · shadcn/ui

---

## Quick start

```bash
npm install
npm run dev          # Vite dev server on http://localhost:5173
npm run typecheck    # TypeScript check
npm run build        # Production build → dist/
npm test             # Vitest unit tests
```

For full local testing with D1 database and Pages Functions:

```bash
npx wrangler pages dev dist --d1=DB    # serve built dist with local D1
```

See [`docs/local-dev.md`](docs/local-dev.md) for the full local setup.

---

## Project structure

```
├── client/src/
│   ├── App.tsx                        # Routes (Wouter) + providers
│   ├── components/
│   │   ├── brand/                     # Design system: ClayButton, DarkCard, PremiumCard, etc.
│   │   ├── registration/              # Multi-step wizard + all form steps
│   │   ├── payment/                   # Stripe Elements wrapper
│   │   ├── admin/                     # Admin dashboard panels
│   │   ├── grapplemap/                # GrappleMap 3D viewer (Three.js)
│   │   ├── Navigation.tsx
│   │   └── Footer.tsx
│   ├── pages/
│   │   ├── Home.tsx                   # Homepage
│   │   ├── About.tsx                  # About the Academy (7 sections)
│   │   ├── Schedule.tsx               # Class schedule (weekly/monthly)
│   │   ├── Programs.tsx               # Programs listing
│   │   ├── programs/                  # Individual program detail pages
│   │   ├── registration/              # Registration wizard pages per program
│   │   ├── admin/                     # Admin login + dashboard
│   │   ├── Contact.tsx
│   │   ├── Testimonials.tsx
│   │   └── TechniqueLibrary.tsx       # GrappleMap browser
│   ├── hooks/
│   │   ├── useRegistration.ts         # Draft state + localStorage persistence
│   │   └── useStepValidation.ts       # Per-step field validation
│   ├── lib/
│   │   ├── programConfig.ts           # Program catalog (slugs, types, copy)
│   │   └── stripe.ts                  # Stripe.js + appearance theme
│   └── studio/                        # Stakeholder Studio (see docs/studio.md)
├── functions/
│   ├── _utils/                        # Auth helpers, email, cookies
│   └── api/
│       ├── register.ts                # POST /api/register
│       ├── programs.ts                # GET  /api/programs
│       ├── payments/
│       │   ├── create-intent.ts       # POST /api/payments/create-intent
│       │   ├── create-subscription.ts # POST /api/payments/create-subscription
│       │   └── webhook.ts             # POST /api/payments/webhook
│       ├── admin/                     # Admin API routes (auth-gated)
│       ├── auth/                      # Login / logout / me
│       └── studio/                    # Studio session sync API
├── db/
│   ├── schema.sql                     # Full D1 schema (source of truth)
│   └── seed.sql                       # Initial program/session seed data
├── docs/                              # Extended documentation
│   ├── architecture.md
│   ├── registration.md
│   ├── studio.md
│   ├── admin.md
│   ├── stripe.md
│   ├── email.md
│   ├── d1-setup.md
│   ├── cloudflare-deploy.md
│   └── local-dev.md
├── wrangler.toml                      # Cloudflare Pages config (D1 binding)
├── .env.example                       # Environment variable reference
└── sunnahskills.html                  # Design reference (original static mockup)
```

---

## All routes

### Public

| Route | Component | Notes |
|---|---|---|
| `/` | `Home.tsx` | Hero, features, philosophy, programs grid, testimonials |
| `/about` | `About.tsx` | 7-section about page |
| `/programs` | `Programs.tsx` | 4 program cards |
| `/programs/bjj` | `BJJProgram.tsx` | BJJ detail page |
| `/programs/archery` | `ArcheryProgram.tsx` | Archery detail |
| `/programs/outdoor` | `OutdoorWorkshopsProgram.tsx` | Outdoor detail |
| `/programs/bullyproofing` | `BullyproofingProgram.tsx` | Bullyproofing detail |
| `/programs/bjj/register` | `BJJRegistration.tsx` | Registration wizard |
| `/programs/archery/register` | `ArcheryRegistration.tsx` | Registration wizard |
| `/programs/outdoor/register` | `OutdoorRegistration.tsx` | Registration wizard |
| `/programs/bullyproofing/register` | `BullyproofingRegistration.tsx` | Registration wizard |
| `/registration/success?rid=N` | `RegistrationSuccess.tsx` | Post-payment confirmation |
| `/registration/waitlist?pos=N&program=...` | `RegistrationWaitlist.tsx` | Session-full waitlist |
| `/registration/cancel` | `RegistrationCancel.tsx` | Payment cancelled |
| `/registration/pending` | `RegistrationPending.tsx` | Async payment pending |
| `/schedule` | `Schedule.tsx` | Weekly/monthly toggle calendar |
| `/techniques` | `TechniqueLibrary.tsx` | GrappleMap 3D browser |
| `/testimonials` | `Testimonials.tsx` | Testimonials page |
| `/contact` | `Contact.tsx` | Contact form |

### Admin (auth-gated)

| Route | Notes |
|---|---|
| `/admin` | Login (bcrypt + D1 session cookie) |
| `/admin/dashboard` | Full dashboard: registrations, payments, pricing, sessions, discounts, contacts, export |

### Studio (review tool)

| URL param | Behaviour |
|---|---|
| `?studio=1` | Local Studio mode (localStorage only) |
| `?studio=<UUID>` | Shared session mode (synced via D1) |

---

## Environment variables

Copy `.env.example`. For Cloudflare, set secrets via `wrangler secret put` or the Pages dashboard.

| Variable | Where | Notes |
|---|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Vite build env | Client-side Stripe key (`pk_test_...` or `pk_live_...`) |
| `STRIPE_SECRET_KEY` | Cloudflare secret | Server-side Stripe key (`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Cloudflare secret | Webhook signing secret (`whsec_...`) |
| `SITE_URL` | `wrangler.toml` [vars] | Full domain, e.g. `https://prototype.sunnahskills.pages.dev` |
| `EMAIL_FROM` | `wrangler.toml` [vars] | Sender address for MailChannels |
| `EMAIL_TO` | `wrangler.toml` [vars] | Admin notification recipient |

D1 is configured in `wrangler.toml` — no env variable needed beyond the binding:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sunnahskills-admin-v2"
database_id = "fc0a958f-4bfe-487f-845f-bce49d4715d5"
```

---

## Key docs

### Architecture & development
- **[docs/architecture.md](docs/architecture.md)** — System overview, tech stack, all data flows
- **[docs/frontend.md](docs/frontend.md)** — React architecture, design system, routing, Stripe client, testing
- **[docs/backend.md](docs/backend.md)** — Pages Functions, D1 access patterns, Stripe server-side, error conventions
- **[docs/security.md](docs/security.md)** — Auth model, payment security, PII storage, known gaps
- **[docs/roadmap.md](docs/roadmap.md)** — Planned features, known gaps, technical debt

### Feature guides
- **[docs/registration.md](docs/registration.md)** — Full registration + payment flow, per-program fields
- **[docs/studio.md](docs/studio.md)** — Stakeholder Studio setup and usage
- **[docs/admin.md](docs/admin.md)** — Admin dashboard setup and usage
- **[docs/technique-library.md](docs/technique-library.md)** — Technique Library (GrappleMap) current state + future roadmap

### Setup & deployment
- **[docs/local-dev.md](docs/local-dev.md)** — Full local dev with wrangler + D1 + Stripe CLI
- **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md)** — Deployment guide
- **[docs/d1-setup.md](docs/d1-setup.md)** — D1 database setup + migration
- **[docs/stripe.md](docs/stripe.md)** — Stripe keys, webhook, subscriptions
- **[docs/email.md](docs/email.md)** — MailChannels email setup
