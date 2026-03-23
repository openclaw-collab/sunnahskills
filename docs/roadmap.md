# Future Roadmap

This document describes planned improvements, known gaps, and future feature directions. Items are grouped by area and roughly ordered by priority within each group.

---

## Payments & Revenue

### Activate Stripe live keys
- Switch from `sk_test_` / `pk_test_` to `sk_live_` / `pk_live_` keys in Cloudflare secrets
- Register a live Stripe webhook endpoint
- Test with real cards before opening enrollment

### Wire Stripe Price IDs for BJJ subscriptions
- Currently `create-subscription.ts` falls back to one-time payment if `stripe_price_id` is absent from `program_prices.metadata`
- Create Products and Prices in Stripe dashboard for each BJJ age group
- Update `program_prices.metadata` in D1 with the real Price IDs

### Deposit support
- Allow partial payment (deposit) at registration, with balance due later
- Requires new `payment_type: 'deposit'` in `payments` table and a follow-up invoice flow

### Payment links (admin-initiated)
- Admin generates a Stripe Payment Link for a specific registration and sends it manually
- Useful for edge cases (guardian couldn't complete online checkout)

### Refund workflow
- Admin-initiated refunds from the dashboard (Stripe Refund API call)
- Update `payments.status` to `refunded` / `partially_refunded`
- Trigger refund confirmation email to guardian

### Revenue reporting
- Monthly revenue chart per program in `PaymentsSummary`
- Export revenue CSV with date range filter

---

## Registration & Enrollment

### Email sequence automation
- 24h reminder email if registration is `submitted` but not `paid`
- Session start reminder 3 days before `program_sessions.start_date`
- Requires a Cloudflare Cron Trigger or D1 Workflows

### Guardian portal (self-service)
- Allow guardians to log in (magic link or password) to:
  - View their registrations
  - Download receipts
  - Update emergency contacts
  - Cancel/request refund

### Sibling linkage
- Currently `sibling_registration_id` exists in `registrations` schema but is not set
- When a guardian registers two students in the same session, link the registration rows
- Enables sibling-aware capacity counting and discount verification

### Waitlist promotion
- When a registered student cancels, automatically notify the first waitlisted family
- Implement via Cloudflare Queue triggered by `registrations.status` → `cancelled`

### Program capacity management
- Admin UI for setting and adjusting session capacity
- Visual capacity bar in `SessionManager`
- Auto-close registration when `enrolled_count >= capacity`

### Trial class flow (BJJ)
- Currently `trial_class: true` is stored in `program_specific_data` but not processed differently
- Create a separate `trial` registration status
- No payment required for trial; follow up with enrollment offer email

---

## Admin Dashboard

### Rate limiting on login
- Add Cloudflare WAF rule: max 5 requests/minute per IP on `POST /api/auth/login`
- This is the most important missing security control

### Audit log
- Record all admin actions (status changes, payment overrides, discount creation) to a new `admin_audit_log` table
- Display in a read-only tab in the dashboard

### Role-based access
- Currently only one role (`admin`) exists
- Add `viewer` role (read-only, no status changes) for assistant staff

### Bulk actions
- Select multiple registrations → bulk status update, bulk email
- Export selected registrations to CSV

### Dashboard metrics
- Registration trend chart (daily/weekly enrollments)
- Program breakdown doughnut chart
- Waitlist size by session

---

## Stakeholder Studio

### Enable R2 image uploads
- Enable R2 in Cloudflare dashboard
- Create `sunnahskills-studio-uploads` bucket
- Uncomment `[[r2_buckets]]` in `wrangler.toml`
- Deploy — image uploads will move from base64 D1 storage to proper R2 object storage

### Studio session expiry
- Add `expires_at` to `studio_sessions` and auto-delete sessions older than 30 days
- Prevents D1 bloat from abandoned review sessions

### Studio version history
- Record each PATCH to `studio_sessions` as an append-only change log
- Allow reviewers to see who changed what and when
- Roll back to a previous state

### Apply changes workflow
- Developer UI to mark studio change entries as `applied` / `rejected` with notes
- Prevents re-applying the same change twice

---

## Content & UX

### CMS integration
- Program descriptions, pricing copy, and schedule data are currently hardcoded in `programConfig.ts` and page files
- Move to a lightweight headless CMS (e.g., Sanity, Contentful) so staff can update content without code changes

### Image optimisation
- Program heroes and cards use **local** assets: `client/public/programs/*` and optional duplicates at repo root (`bjj.png`, `archery.png`, `outdoor.jpg`, `bully.jpeg`) — see `programConfig.heroImage`
- Optional: Cloudflare Images or R2 + image worker for responsive `srcset` / transforms
- `ProgramVisual` and `ProgramPageHeroMedia` use `loading="lazy"` on card variants; hero uses `fetchPriority="high"` where set

### Testimonials from DB
- `Testimonials.tsx` uses hardcoded data
- Add a `testimonials` table to D1 and an admin UI to manage entries

### Homepage GrappleMap
- **Done:** Home curriculum section embeds live `TechniqueViewer` (default sequence path)
- Optional: swap default sequence, add explicit “featured technique” CMS

### About + Schedule from CMS
- Both pages use static in-file data
- Move to D1 or a CMS so content can be updated without a deploy

---

## Infrastructure & Operations

### D1 backups
- Enable **D1 point-in-time recovery** in the Cloudflare dashboard (paid feature)
- This is the highest-priority ops item — without it, a bad migration or accidental delete is unrecoverable

### Custom domain
- Configure a custom domain (e.g., `sunnahskills.com`) in Cloudflare Pages
- Update `SITE_URL` in `wrangler.toml`
- Update Stripe webhook endpoint URL

### Branch preview environments
- Cloudflare Pages already creates preview deployments for all branches
- Use a separate `sunnahskills-admin-dev` D1 database for preview environments to avoid polluting production data

### Logging & observability
- Add Cloudflare Workers Logpush to export function logs to a log aggregator (Datadog, Logtail, etc.)
- Set up an uptime monitor on the registration flow (e.g., Checkly synthetic test)

### Content Security Policy
- Add a `_headers` file at the project root with a strict `Content-Security-Policy` header
- Start permissive and tighten over time

---

## Technical Debt

| Item | Location | Notes |
|---|---|---|
| `priorExperience` in `students` schema | `db/schema.sql` | Column exists but is always inserted as `null`; remove or repurpose |
| Hardcoded sibling discount (10%) | `create-intent.ts`, `create-subscription.ts` | Should be configurable per program in `program_prices.metadata` |
| Program config duplication | `lib/programConfig.ts` vs `programs` D1 table | Two sources of truth for program metadata — consolidate |
| No pagination on admin lists | `admin/registrations.ts` | Returns all rows; add `LIMIT`/`OFFSET` with total count |
| Missing `discount_code` use tracking | `create-intent.ts` | Promo codes are validated but `current_uses` is not incremented on use |
| Studio polling interval | `StudioProvider.tsx` | 5-second polling is a blunt instrument; replace with SSE or WebSocket when Durable Objects are available |
