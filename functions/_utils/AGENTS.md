<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# _utils

## Purpose
Shared utility modules for Cloudflare Pages Functions. Auth helpers, email service, cookies, and email templates.

## Key Files

| File | Description |
|------|-------------|
| `adminAuth.ts` | Session validation from `admin_session` cookie |
| `cookies.ts` | Cookie parsing and setting helpers |
| `email.ts` | MailChannels email sending integration |
| `emailTemplates.ts` | HTML email templates |

## API Reference

### adminAuth.ts
```typescript
async function adminAuth(request: Request, env: Env): Promise<
  { valid: true; adminId: number } |
  { valid: false; response: Response }
>
```
- Reads `admin_session` cookie
- Validates against `admin_sessions` table
- Checks `expires_at` timestamp
- Returns adminId on success, 401 Response on failure

### cookies.ts
```typescript
function setCookie(name: string, value: string, options: CookieOptions): string
function getCookie(request: Request, name: string): string | undefined
function deleteCookie(name: string): string
```
- Defaults: HttpOnly, Secure, SameSite=Strict
- Max-Age support

### email.ts
```typescript
async function sendEmail(options: EmailOptions): Promise<Response>
```
- POSTs to `https://api.mailchannels.net/tx/v1/send`
- Uses MailChannels (free via Cloudflare)
- Supports HTML and text bodies

### emailTemplates.ts
- `registrationConfirmation(registration)`
- `paymentReceipt(payment, registration)`
- `waitlistConfirmation(position, program)`
- `adminNotification(registration)`

## For AI Agents

### Working In This Directory
- Import from `../_utils/module` in API routes
- All utilities are pure functions (no side effects)
- Handle errors gracefully

### Usage Pattern
```typescript
import { adminAuth } from '../_utils/adminAuth';
import { sendEmail } from '../_utils/email';

export default async function handler(request, context) {
  const auth = await adminAuth(request, context.env);
  if (!auth.valid) return auth.response;

  await sendEmail({ to, subject, html });
}
```

<!-- MANUAL: -->
