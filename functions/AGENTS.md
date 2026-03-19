<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# functions

## Purpose
Cloudflare Pages Functions (Workers runtime) providing API endpoints. All backend logic lives here including authentication, payments, registrations, and admin operations.

## Key Files

| File | Description |
|------|-------------|
| `api/register.ts` | POST /api/register - Main registration endpoint |
| `api/programs.ts` | GET /api/programs - List available programs |
| `api/contact.ts` | POST /api/contact - Contact form submission |
| `api/waitlist.ts` | POST /api/waitlist - Add to waitlist |
| `api/admin.ts` | Main admin API handler |
| `api/discounts/validate.ts` | POST /api/discounts/validate - Validate promo codes |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `_utils/` | Shared utility modules (see `_utils/AGENTS.md`) |
| `api/auth/` | Authentication endpoints (login/logout/me) (see `api/auth/AGENTS.md`) |
| `api/payments/` | Stripe payment endpoints (see `api/payments/AGENTS.md`) |
| `api/admin/` | Admin-only API routes (see `api/admin/AGENTS.md`) |
| `api/studio/` | Stakeholder Studio sync API (see `api/studio/AGENTS.md`) |
| `api/discounts/` | Discount/promo code validation (see `api/discounts/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Files export a default function handling the request
- Function signature: `export default async function handler(request: Request, context: EventContext)`
- Access D1 via `context.env.DB`
- Access secrets via `context.env.SECRET_NAME`
- Return standard `Response` objects
- Use `url.pathname` to handle multiple methods in one file

### Testing Requirements
- Test via curl or browser against local wrangler dev server
- Use `npx wrangler pages dev dist --d1=DB` for local testing
- Check D1 with `npx wrangler d1 execute DB --command="SELECT ..."`

### Common Patterns
- Import utils from `../_utils/`
- Validate input with Zod schemas
- Use `corsHeaders()` for CORS preflight
- Return JSON with `JSON.stringify({ ... })`
- Handle errors with try/catch + console.error

## API Endpoint Map

| Endpoint | File | Purpose |
|----------|------|---------|
| `/api/register` | `api/register.ts` | Create registration |
| `/api/programs` | `api/programs.ts` | Get programs |
| `/api/contact` | `api/contact.ts` | Submit contact form |
| `/api/waitlist` | `api/waitlist.ts` | Join waitlist |
| `/api/auth/*` | `api/auth/*.ts` | Login/logout/session |
| `/api/payments/*` | `api/payments/*.ts` | Stripe operations |
| `/api/admin/*` | `api/admin/*.ts` | Admin operations |
| `/api/studio/*` | `api/studio/*.ts` | Studio sessions |
| `/api/discounts/validate` | `api/discounts/validate.ts` | Validate discounts |

## Dependencies

### Internal
- `_utils/adminAuth.ts` - Session validation
- `_utils/cookies.ts` - Cookie helpers
- `_utils/email.ts` - MailChannels integration
- `_utils/emailTemplates.ts` - HTML email templates
- `shared/schema.ts` - Zod schemas

### External
- Cloudflare Workers runtime APIs
- D1 database binding (`context.env.DB`)
- Stripe SDK (server-side)

<!-- MANUAL: -->
