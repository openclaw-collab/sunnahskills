<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# _utils

## Purpose
Shared utility modules for Cloudflare Pages Functions. Auth helpers, email service, cookies, and email templates.

## Key Files

| File | Description |
|------|-------------|
| `adminAuth.ts` | Session validation from `admin_session` cookie |
| `guardianAuth.ts` | Guardian/family session cookie + account validation for `/api/guardian/*` |
| `cookies.ts` | Cookie parsing and setting helpers |
| `email.ts` | MailChannels email sending integration |
| `emailTemplates.ts` | HTML email templates |

## API Reference

### adminAuth.ts
```typescript
async function createAdminSession(env: Env, adminUserId: number): Promise<{ token: string; expiresAtIso: string; cookie: string }>
async function getAdminFromRequest(env: Env, request: Request): Promise<{ adminUserId: number; email: string; name: string | null; role: string } | null>
function clearAdminSessionCookie(): string
```
- Reads `admin_session` cookie
- Validates against `admin_sessions` table
- Checks `expires_at` timestamp
- Returns the admin user on success, `null` on failure

### cookies.ts
```typescript
function setCookie(name: string, value: string, options: CookieOptions): string
function getCookie(request: Request, name: string): string | undefined
function deleteCookie(name: string): string
```
- Supports `HttpOnly`, `Secure`, `SameSite=Lax | Strict | None`, `Path`, and `Max-Age`
- Max-Age support

### email.ts
```typescript
async function sendMailChannelsEmail(env: Env, message: { to; from; replyTo?; subject; text; html }): Promise<void>
```
- POSTs to `https://api.mailchannels.net/tx/v1/send`
- Uses MailChannels (free via Cloudflare)
- Supports HTML and text bodies

### emailTemplates.ts
- `registrationConfirmationEmail(...)`
- `adminNewRegistrationEmail(...)`
- `paymentReceiptEmail(...)`
- `waitlistEmail(...)`

## For AI Agents

### Working In This Directory
- Import from `../_utils/module` in API routes
- All utilities are pure functions (no side effects)
- Handle errors gracefully

### Usage Pattern
```typescript
import { getAdminFromRequest } from './adminAuth';
import { sendMailChannelsEmail } from './email';

export default async function handler(request, context) {
  const admin = await getAdminFromRequest(context.env, request);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  await sendMailChannelsEmail(context.env, { to, from, subject, text, html });
}
```

<!-- MANUAL: -->
