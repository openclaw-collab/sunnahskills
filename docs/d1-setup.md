# D1 Database Setup

## Current database

| Field | Value |
|---|---|
| Database name | `sunnahskills-admin-v2` |
| Database ID | `fc0a958f-4bfe-487f-845f-bce49d4715d5` |
| Binding | `DB` (set in `wrangler.toml`) |

The binding name `DB` is how Pages Functions access the database: `context.env.DB`.

## Apply schema

The full schema lives in `db/schema.sql`. Apply it to the remote database:

```bash
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/schema.sql --remote
```

Apply locally (for `wrangler pages dev`):

```bash
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/schema.sql
```

## Seed initial data

```bash
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/seed.sql --remote
```

The seed inserts the 4 programs (BJJ, Archery, Outdoor, Bullyproofing) and default sessions/prices.

## Schema tables

| Table | Purpose |
|---|---|
| `contacts` | Contact form submissions |
| `admin_users` | Admin accounts (email + bcrypt password hash) |
| `admin_sessions` | Session tokens for admin auth (HttpOnly cookie) |
| `programs` | Program catalog (BJJ, Archery, etc.) |
| `program_prices` | Prices per program + age group (admin-editable) |
| `program_sessions` | Class sessions with capacity and schedule |
| `guardians` | Parent/guardian info per registration |
| `students` | Student info linked to guardian |
| `registrations` | Core enrollment record |
| `waivers` | Consent records linked to registration |
| `payments` | Payment records (Stripe IDs, amounts, status) |
| `discounts` | Promo codes (percentage, fixed, sibling) |
| `waitlist` | Waitlist entries for full sessions |
| `studio_sessions` | Stakeholder Studio shared review sessions |

## Useful D1 commands

```bash
# List all tables
npx wrangler d1 execute sunnahskills-admin-v2 --command "SELECT name FROM sqlite_master WHERE type='table';" --remote

# Check registrations
npx wrangler d1 execute sunnahskills-admin-v2 --command "SELECT * FROM registrations ORDER BY created_at DESC LIMIT 10;" --remote

# Check admin users exist
npx wrangler d1 execute sunnahskills-admin-v2 --command "SELECT id, email, name, role FROM admin_users;" --remote

# View program prices
npx wrangler d1 execute sunnahskills-admin-v2 --command "SELECT * FROM program_prices;" --remote
```

## Adding a new admin user

```bash
# 1. Generate bcrypt hash (Node.js)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourSecurePassword123', 10).then(h => console.log(h));"

# 2. Insert user
npx wrangler d1 execute sunnahskills-admin-v2 --command \
  "INSERT INTO admin_users (email, password_hash, name, role) VALUES ('admin@sunnahskills.com', '\$2a\$10\$...', 'Admin Name', 'admin');" --remote
```

## Creating a new D1 database (if starting fresh)

```bash
npx wrangler d1 create sunnahskills-admin-v2
# Copy the new database_id into wrangler.toml
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/schema.sql --remote
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/seed.sql --remote
```

## Migrations

There is no automated migration runner. To add a new column or table:

1. Add the `ALTER TABLE` or `CREATE TABLE` statement to a new file, e.g. `db/migrations/001_add_column.sql`
2. Apply it: `npx wrangler d1 execute sunnahskills-admin-v2 --file=db/migrations/001_add_column.sql --remote`
3. Update `db/schema.sql` to keep it as the source of truth

## Local D1 for development

Wrangler creates a local SQLite copy at `.wrangler/state/v3/d1/`. It is persisted across `wrangler pages dev` runs. To reset local data:

```bash
rm -rf .wrangler/state/v3/d1/
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/schema.sql
npx wrangler d1 execute sunnahskills-admin-v2 --file=db/seed.sql
```
