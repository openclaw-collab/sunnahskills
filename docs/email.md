# Email Setup (Resend)

## How it works

The app sends transactional emails via [Resend](https://resend.com/).
The sender utility lives in `functions/_utils/email.ts`.

## Configuration

Set non-sensitive values in `wrangler.toml` under `[vars]`:

```toml
[vars]
EMAIL_FROM = "admin@sunnahskills.com"
EMAIL_TO = "mysunnahskill@gmail.com"
```

- `EMAIL_FROM` — sender address shown to families
- `EMAIL_TO` — admin notification recipient

Set the API key as a Pages secret:

```bash
wrangler pages secret put RESEND_API_KEY --project-name sunnahskills --env production
wrangler pages secret put RESEND_API_KEY --project-name sunnahskills --env preview
```

Optional override for endpoint (normally not needed):

- `RESEND_API_URL` (defaults to `https://api.resend.com/emails`)

## Domain requirements

Before production sends can succeed:

1. Verify `sunnahskills.com` in Resend Domains.
2. Add the DNS records Resend provides (SPF/DKIM).
3. Keep `EMAIL_FROM` aligned with the verified domain.

## Email triggers

| Event | Recipients |
|---|---|
| Guardian signup / sign-in link | Guardian |
| Free trial booking confirmation | Guardian |
| Registration submitted | Guardian + Admin |
| Payment confirmed (webhook) | Guardian + Admin |
| Waitlist confirmation | Guardian |

## Local development

Without `RESEND_API_KEY`, the API still returns success for core registration/trial creation but `emailSent` is `false` and the UI shows a warning.
