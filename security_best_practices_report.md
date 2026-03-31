# Security Best Practices Report

Date: 2026-03-30
Scope: React/Vite frontend, Cloudflare Pages Functions backend, D1-backed auth/payment/admin flows

## Executive Summary

The highest-risk issues are concentrated in the Stakeholder Studio sharing flow. The current implementation uses a predictable non-cryptographic session ID generator even though the session ID acts as the access token, and unprotected Studio sessions can be fetched and mutated by anyone who has or guesses the ID. I also found one unauthenticated payment reconciliation endpoint that exposes order/payment status by sequential order ID, and one guardian sign-in endpoint that allows account enumeration by email address.

## Critical / High

### 1. Predictable Studio session IDs are used as access tokens

- Rule ID: JS-SECRETS-SESSION-001
- Severity: High
- Location:
  - [sessions.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions.ts:23)
  - [sessions.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions.ts:44)
  - [sessions.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions.ts:57)
  - [security.md](/Users/muadhsambul/Downloads/sunnah-prot/docs/security.md:108)
- Evidence:
  - Studio sessions are created with a custom `uuidv4()` that uses `Math.random()`:
    - `const r = (Math.random() * 16) | 0;`
  - The session `id` is returned as the share token:
    - `const id = uuidv4();`
    - `const shareUrl = \`${origin}/?studio=${id}\`;`
  - Project docs state the session `id` doubles as the access token and is security-relevant.
- Impact:
  - If session IDs are guessable, an attacker can discover or brute-force share URLs and access unprotected Studio sessions.
- Fix:
  - Replace the custom generator with `crypto.randomUUID()` and stop using `Math.random()` for any externally exposed session identifier.
- Mitigation:
  - Require authentication or a separate random bearer token even for “unprotected” sessions.
- False positive notes:
  - If Studio is only used internally, exposure is lower, but the share URLs are still treated as access tokens in the docs and should be cryptographically strong.

### 2. Unprotected Studio sessions can be read and overwritten by anyone with the session ID

- Rule ID: JS-AUTHZ-RESOURCE-001
- Severity: High
- Location:
  - [sessions/[id].ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions/[id].ts:54)
  - [sessions/[id].ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions/[id].ts:70)
  - [uploads.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/uploads.ts:45)
  - [uploads.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/uploads.ts:60)
- Evidence:
  - `GET /api/studio/sessions/:id` only blocks when `row.protected === 1`.
  - `PATCH /api/studio/sessions/:id` also only blocks when `row.protected === 1`.
  - `POST /api/studio/uploads` allows uploads for any session where `protected !== 1`.
  - There is no separate capability token or admin check for unprotected sessions.
- Impact:
  - Anyone who gets or guesses an unprotected Studio session ID can read its state, overwrite edits/comments/theme, and replace uploaded assets.
- Fix:
  - Make all Studio session mutation endpoints require a separate unpredictable auth token or explicit admin-auth creation flow.
  - At minimum, distinguish “viewable by link” from “mutable by link.”
- Mitigation:
  - Restrict Studio to admin-created sessions only and default every session to password-protected.
- False positive notes:
  - If this “anyone with the link can edit” behavior is intentional, it should still be documented as a deliberate shared-edit model and protected by stronger non-guessable tokens.

### 3. Payment reconciliation endpoint is unauthenticated and exposes order/payment state by sequential order ID

- Rule ID: EXPRESS-INPUT-001
- Severity: High
- Location:
  - [reconcile-order.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/payments/reconcile-order.ts:31)
  - [reconcile-order.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/payments/reconcile-order.ts:42)
  - [reconcile-order.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/payments/reconcile-order.ts:61)
  - [reconcile-order.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/payments/reconcile-order.ts:73)
- Evidence:
  - The endpoint accepts `enrollmentOrderId` from the request body.
  - There is no guardian or admin authentication check before loading the order.
  - For any valid order ID, it returns `paymentStatus`, `orderStatus`, and the `paymentIntentId`.
  - If the Stripe payment has succeeded, it will trigger finalization for that order.
- Impact:
  - An attacker can enumerate sequential order IDs and learn payment state for other users, and may trigger side effects on orders that are pending finalization.
- Fix:
  - Require authenticated guardian ownership or a short-lived signed reconciliation token bound to the order.
  - Avoid returning `paymentIntentId` to unauthenticated callers.
- Mitigation:
  - If the endpoint must stay public, require both a signed nonce and a Stripe-returned confirmation token tied to the order.
- False positive notes:
  - If this route is only called from the success page today, that reduces accidental exposure but does not create a real authorization boundary.

## Medium

### 4. Guardian magic-link request endpoint leaks whether an email has an account

- Rule ID: EXPRESS-AUTH-ENUM-001
- Severity: Medium
- Location:
  - [request-link.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/guardian/request-link.ts:30)
  - [request-link.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/guardian/request-link.ts:34)
  - [request-link.ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/guardian/request-link.ts:85)
- Evidence:
  - Existing accounts reach the success path and return:
    - `We sent your sign-in link to that email address.`
  - Nonexistent accounts return:
    - `We couldn't find an account with that email yet. Create your account first.`
    - with HTTP `404`
- Impact:
  - Attackers can confirm whether a guardian email exists in the system, which is useful for credential stuffing, phishing, and privacy violations.
- Fix:
  - Return a uniform success message regardless of whether the account exists.
  - Perform the email lookup and send the link only when applicable, but do not reveal that distinction to the caller.
- Mitigation:
  - Add rate limiting for this endpoint and log unusual lookup volume.
- False positive notes:
  - If the product intentionally prefers usability over privacy here, this should be an explicit documented tradeoff.

## Low / Defense in Depth

### 5. Studio auth cookies are validated with a substring check and not marked `Secure`

- Rule ID: NEXT-COOKIE-001
- Severity: Low
- Location:
  - [sessions/[id].ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions/[id].ts:49)
  - [sessions/[id].ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions/[id].ts:153)
  - [sessions/[id].ts](/Users/muadhsambul/Downloads/sunnah-prot/functions/api/studio/sessions/[id].ts:163)
- Evidence:
  - Cookie auth check:
    - `return cookie.includes(\`studio_auth_${sessionId}=1\`);`
  - Cookie set without `Secure` even in production:
    - `studio_auth_${params.id}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
- Impact:
  - The substring check is brittle and could produce edge-case parsing mistakes.
  - Lack of `Secure` weakens cookie confidentiality on non-TLS paths or misconfigured environments.
- Fix:
  - Parse cookies with the shared cookie helper instead of substring matching.
  - Set `Secure` conditionally for HTTPS production environments, matching the admin/guardian session cookie behavior.
- Mitigation:
  - Limit Studio exposure to HTTPS-only origins.
- False positive notes:
  - If Studio is only used behind trusted HTTPS origins, practical impact is lower, but the implementation still falls short of the project’s own auth cookie standard.

## Recommended Next Order

1. Replace Studio session ID generation with `crypto.randomUUID()` and tighten Studio mutation auth.
2. Lock down `/api/payments/reconcile-order` so it is not callable by arbitrary unauthenticated users.
3. Make guardian sign-in requests return a uniform response for existing and non-existing emails.
4. Clean up Studio cookie parsing and cookie flags.
