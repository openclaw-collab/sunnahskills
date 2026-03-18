## Sunnah Skills — Youth Programs Platform

React + Cloudflare Pages Functions + D1 (SQLite) registration + payments platform, redesigned to match `sunnahskills.html` (cream/charcoal/moss/clay) with in-app Stripe Elements checkout, admin dashboard, and GrappleMap technique library.

## Local development

- **Install**:

```bash
npm install
```

- **Dev server** (frontend + Pages Functions locally via Vite):

```bash
npm run dev
```

- **Tests / typecheck / build**:

```bash
npm test
npm run typecheck
npm run build
```

## Cloudflare setup (D1 + deploy)

See:
- `docs/cloudflare-deploy.md`
- `docs/d1-setup.md`
- `docs/stripe.md`
- `docs/email.md`

## Key routes

- **Public**
  - `/` — Homepage
  - `/programs/*` — Program pages
  - `/programs/:slug/register` — Registration wizard (`bjj`, `archery`, `outdoor`, `bullyproofing`)
  - `/registration/*` — Success/cancel/pending/waitlist
  - `/techniques` — GrappleMap technique browser
  - `/contact` — Contact form

- **Admin**
  - `/admin` — Login
  - `/admin/dashboard` — Dashboard (registrations, payments, discounts, pricing, sessions, contacts, export)

## Environment variables

Use `.env.example` as reference. For Cloudflare, set secrets in the Pages project (or via `wrangler secret put`).

