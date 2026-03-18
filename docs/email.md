## Email (MailChannels)

This project sends transactional emails via MailChannels HTTP API.

### Where emails are sent

- Registration confirmation + admin notification: `functions/api/register.ts`
- Payment receipt + admin notification: `functions/api/payments/webhook.ts`
- Waitlist confirmation + admin notification: `functions/api/waitlist.ts`

Templates:

- `functions/_utils/emailTemplates.ts`

### Required vars

- `EMAIL_FROM` (e.g. `noreply@sunnahskills.pages.dev`)
- `EMAIL_TO` (admin inbox)
- `SITE_URL`

### Notes

Email sending is **best-effort** (it will not fail the registration/payment flow if MailChannels errors).

