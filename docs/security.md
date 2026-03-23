# Security

## Threat model

This is a youth program registration platform. The primary concerns are:

1. **Unauthorized admin access** — malicious actors viewing or modifying registration data
2. **Payment manipulation** — clients spoofing payment amounts or statuses
3. **Data integrity** — invalid or malicious registration payloads corrupting D1
4. **PII exposure** — guardian emails, phone numbers, and student data leaking
5. **Studio abuse** — unauthorized editing of stakeholder review sessions

---

## Admin authentication

### How it works

- Passwords are stored as **bcrypt hashes** (`bcryptjs`, cost factor 10) in `admin_users.password_hash`
- On login, `bcrypt.compare(plaintext, hash)` is run server-side in the Function
- On success, a **session token** (`crypto.randomUUID()` — 128-bit random) is inserted into `admin_sessions` with a 7-day expiry
- The token is sent to the browser as an **HttpOnly, Secure, SameSite=Lax cookie** (`admin_session`)
- Every admin API request calls `getAdminFromRequest()` which reads the cookie, validates the token in D1, and checks expiry
- Expired tokens are **deleted on access** (no background cleanup needed)

### What this protects against

| Threat | Mitigation |
|---|---|
| Password brute force | bcrypt cost factor 10 (~100ms/hash); no rate limiting currently (see roadmap) |
| Session token theft (XSS) | HttpOnly cookie — JavaScript cannot read it |
| CSRF | SameSite=Lax prevents cross-site form submissions; token validation provides additional layer |
| Session fixation | Token is generated server-side at login time |
| Expired sessions | Expiry checked on every request; expired rows deleted |

### Gaps / known limitations

- **No rate limiting** on `/api/auth/login` — brute-force of passwords is possible if an email is known. Mitigation: add Cloudflare WAF rate limiting rule on `/api/auth/login` (5 req/min per IP).
- **No MFA** — admin accounts have only one factor. Acceptable for current scale.
- **No account lockout** — repeated failed logins do not lock the account.

---

## Payment security

### Server-side amount calculation

**Client-submitted totals are never trusted.** The payment flow works as follows:

1. Client submits `POST /api/payments/create-intent` with `registrationId` and optional `discountCode` and `siblingCount`
2. The server looks up the actual price from `program_prices` in D1 using `registrationId`
3. Discounts are validated server-side against the `discounts` table (checks: `active`, `valid_from`, `valid_until`, `max_uses`, program scope)
4. Sibling discount is applied server-side before creating the PaymentIntent
5. The Stripe PaymentIntent is created with the **server-calculated amount**

A client that manipulates the request body cannot reduce the payment amount — the server always recomputes the total from authoritative database values.

### Stripe webhook verification

`POST /api/payments/webhook` verifies the `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET` before processing any event. Unverified requests are rejected with 400. This prevents:

- Fake `payment_intent.succeeded` events that would mark unpaid registrations as paid
- Replay attacks (Stripe includes a timestamp in the signature)

### Payment status source of truth

Payment status (`paid`, `failed`, etc.) is only updated via:
1. The Stripe webhook handler (verified, as above)
2. Manually by an admin via the dashboard API (admin-auth gated)

The client never directly writes payment status.

---

## Input validation

All POST endpoints validate request bodies with **Zod** before any database operation:

- Required fields are explicitly typed and enforced
- Email fields use `z.string().email()`
- Enum fields use `z.enum([...])` to prevent unexpected values
- `safeParse` is used so validation failures return structured 400 errors, not unhandled exceptions

SQL injection is prevented by using D1's **prepared statement API** with `.bind()` for all user-supplied values. No string interpolation in SQL queries.

---

## Studio authentication

### Session access control

- Studio sessions can be **password-protected** (`studio_sessions.protected = 1`)
- The password is stored as a **bcrypt hash** in `studio_sessions.password_hash`
- On password submission, `bcrypt.compare()` runs server-side
- On success, an HttpOnly cookie `studio_auth_<sessionId>=1` is set
- Subsequent `GET /api/studio/sessions/:id` requests check for this cookie

### URL token design

- The session `id` (UUID) doubles as the access token
- Guessing a valid session ID requires 2^122 attempts (UUID v4)
- This is sufficient for low-sensitivity stakeholder review sessions

### What Studio can and cannot do

- Studio edits are stored in `studio_sessions` — they are **not** automatically applied to production code
- The export JSON is a design review artifact for the developer to review and manually apply
- Studio cannot modify D1 tables outside of `studio_sessions`
- Image uploads go to R2 (or as base64 in D1) — they are not deployed to production automatically

---

## Data storage

### PII in D1

The following tables contain Personally Identifiable Information:

| Table | PII fields |
|---|---|
| `guardians` | `full_name`, `email`, `phone`, `emergency_contact_name`, `emergency_contact_phone` |
| `students` | `full_name`, `preferred_name`, `date_of_birth`, `medical_notes` |
| `contacts` | `name`, `email`, `message` |
| `admin_users` | `email` |

D1 is a managed Cloudflare service with encryption at rest. Access is only possible via the D1 API (authenticated with your Cloudflare API token) or via the Pages Functions binding.

### What is NOT stored

- Full card numbers — Stripe tokenizes payment methods. The app only stores Stripe IDs (`stripe_payment_intent_id`, `stripe_subscription_id`) and amounts.
- Passwords in plaintext — only bcrypt hashes
- Stripe secret key in code — only in Cloudflare secrets / wrangler env

---

## CORS

Because the frontend and backend are served from the same origin (`*.pages.dev` or custom domain), CORS is not needed and not configured. API routes do not set `Access-Control-Allow-Origin` headers.

If a separate frontend domain is ever used, CORS will need to be added explicitly to each Function.

---

## Secrets management

| Secret | Storage |
|---|---|
| `STRIPE_SECRET_KEY` | Cloudflare Pages secret (encrypted at rest, not visible in dashboard after set) |
| `STRIPE_WEBHOOK_SECRET` | Cloudflare Pages secret |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Cloudflare Pages environment variable (public, OK) |
| Admin bcrypt hashes | D1 database (encrypted at rest by Cloudflare) |
| Studio bcrypt hashes | D1 database |

**Never store secrets in:**
- `wrangler.toml` `[vars]` — these are committed to git and not encrypted
- Client-side code or `.env` files committed to the repo
- Code comments

---

## Known gaps and recommended hardening (roadmap)

| Gap | Recommendation | Priority |
|---|---|---|
| No rate limiting on login | Cloudflare WAF rule: 5 req/min per IP on `/api/auth/login` | High |
| No CSRF token on forms | SameSite=Lax provides basic protection; add explicit CSRF token for stricter posture | Medium |
| No content security policy (CSP) | Add `Content-Security-Policy` header in `_headers` file | Medium |
| Registration PII not purged | Add a data retention policy + cleanup job (D1 Queues or cron trigger) | Medium |
| Studio sessions not expiring | Add `expires_at` to `studio_sessions` and delete stale sessions | Low |
| No audit log | Admin actions (status changes, manual payment overrides) are not logged | Medium |
| D1 backups | Enable D1 point-in-time recovery in Cloudflare dashboard | High |

---

## Guardian (family) authentication

- Magic links: opaque token stored hashed in D1; **~30 minute** expiry; generic success message to avoid email enumeration.
- Sessions: HttpOnly cookies (see `functions/_utils/guardianAuth.ts`).
- **Rate limiting:** not yet enforced in code — add per-IP / per-email limits on `POST /api/guardian/request-link` and `POST /api/guardian/signup` (e.g. Cloudflare WAF or D1 sliding window) before production traffic.

---

## Dependency security

Run `npm audit` regularly to check for known vulnerabilities in dependencies:

```bash
npm audit
npm audit fix
```

Key packages to watch:
- `bcryptjs` — password hashing
- `stripe` — not used as SDK (calls REST directly) but ensure API version stays current
- `zod` — input validation

Cloudflare Workers runtime is managed by Cloudflare and patched automatically.
