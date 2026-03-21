<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# db

## Purpose
Cloudflare D1 (SQLite) database schema and seed data. Single source of truth for database structure.

## Key Files

| File | Description |
|------|-------------|
| `schema.sql` | Complete D1 schema - all tables, indexes, foreign keys |
| `seed.sql` | Initial seed data for programs and sessions |

## Schema Overview

### Core Tables
- `programs` - Program definitions (BJJ, Archery, Outdoor, Bullyproofing)
- `program_sessions` - Session instances with capacity and pricing
- `registrations` - Student registrations linked to programs
- `guardians` - Parent/guardian information
- `students` - Student information
- `waivers` - Signed liability waivers
- `waitlist` - Waitlist entries for full sessions

### Payment Tables
- `payments` - Payment records with Stripe IDs
- `stripe_customers` - Stripe customer mappings
- `stripe_subscriptions` - BJJ subscription records
- `discount_codes` - Promo codes for registration

### Admin Tables
- `admin_users` - Admin login credentials (bcrypt hashed)
- `admin_sessions` - Session tokens for authentication
- `contacts` - Contact form submissions

### Studio Tables
- `studio_sessions` - Stakeholder Studio shared sessions

## For AI Agents

### Working In This Directory
- `schema.sql` is the source of truth - always edit this file first
- Apply changes with `npx wrangler d1 execute DB --file=./db/schema.sql`
- For local dev: `npx wrangler d1 execute DB --local --file=./db/schema.sql`
- Seed data goes in `seed.sql`

### Testing Requirements
- Verify schema changes don't break existing queries
- Test migrations on local D1 before applying to production
- Backup production data before schema changes

### Common Patterns
- Use INTEGER for boolean (0/1)
- Use DATETIME for timestamps
- Foreign keys with ON DELETE CASCADE where appropriate
- Indexes on frequently queried columns
- Default values for non-nullable fields

## D1 Binding

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "sunnahskills-admin-v2"
database_id = "fc0a958f-4bfe-487f-845f-bce49d4715d5"
```

Access in Functions: `context.env.DB.prepare("...").bind(...).run()`

<!-- MANUAL: -->
