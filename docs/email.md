# Email Setup (MailChannels)

## How it works

The app sends transactional emails via [MailChannels](https://www.mailchannels.com/). This is natively supported by Cloudflare Workers without any API key — MailChannels has a partnership with Cloudflare that allows Workers to send email for free through their API.

The email utility is in `functions/_utils/email.ts`.

## Configuration

Set these in `wrangler.toml` under `[vars]` (non-sensitive):

```toml
[vars]
EMAIL_FROM = "noreply@sunnahskills.pages.dev"
EMAIL_TO = "mysunnahskill@gmail.com"
```

- `EMAIL_FROM` — the sender address (must be a domain you control or a `*.pages.dev` domain)
- `EMAIL_TO` — admin/notification recipient

## Email triggers

| Event | Recipients |
|---|---|
| New registration submitted | Guardian (confirmation) + Admin (notification) |
| Payment confirmed (webhook) | Guardian (receipt) |
| Waitlisted | Guardian (waitlist position + next steps) |

## Templates

HTML templates live in `functions/_utils/emailTemplates.ts`. Each function returns an HTML string:

| Function | Subject |
|---|---|
| `registrationConfirmationEmail(data)` | "Registration Confirmed — {program}" |
| `paymentReceiptEmail(data)` | "Payment Received — {program}" |
| `waitlistEmail(data)` | "You're on the waitlist — {program}" |
| `adminNotificationEmail(data)` | "New Registration: {student} — {program}" |

## Sending email

```typescript
import { sendEmail } from "../_utils/email";

await sendEmail(env, {
  to: guardian.email,
  subject: "Registration Confirmed",
  html: registrationConfirmationEmail({ ... }),
});
```

The `sendEmail` function POSTs to `https://api.mailchannels.net/tx/v1/send`.

## SPF / DKIM (production requirement)

For emails sent from a custom domain (not `*.pages.dev`), you must add SPF and DKIM records to your DNS:

**SPF:** Add to your domain's DNS:
```
TXT  @  "v=spf1 include:relay.mailchannels.net ~all"
```

**DKIM:** Follow [MailChannels DKIM instructions](https://support.mailchannels.com/hc/en-us/articles/16918954360845).

Without SPF/DKIM, emails from custom domains will land in spam or be rejected.

## Local development

MailChannels only works from Cloudflare Workers. For local development with `wrangler pages dev`, emails will fail to send but the registration flow continues normally. To test email locally, temporarily stub `sendEmail` to `console.log` the payload.
