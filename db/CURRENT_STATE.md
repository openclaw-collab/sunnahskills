# Current Database Truth

This file is the human-readable anchor for the latest database state in the repo.

## Canonical Files

- [`/Users/muadhsambul/Downloads/sunnah prot/db/schema.sql`](/Users/muadhsambul/Downloads/sunnah%20prot/db/schema.sql)
  Full latest schema snapshot. This should always represent the current end-state structure after all migrations.
- [`/Users/muadhsambul/Downloads/sunnah prot/db/seed.sql`](/Users/muadhsambul/Downloads/sunnah%20prot/db/seed.sql)
  Current launch seed for public catalog data and default waiver content.
- [`/Users/muadhsambul/Downloads/sunnah prot/db/admin-seed.sql`](/Users/muadhsambul/Downloads/sunnah%20prot/db/admin-seed.sql)
  Current admin bootstrap rows for real environments. Password hashes live here; plaintext passwords are handed off separately.
- [`/Users/muadhsambul/Downloads/sunnah prot/db/migrations/`](/Users/muadhsambul/Downloads/sunnah%20prot/db/migrations)
  Historical upgrade steps for existing databases.

## Current Migration Chain

Apply in this order for an existing database:

1. `001_registration_accounts_orders.sql`
2. `002_enrollment_order_installments.sql`
3. `003_order_manual_review.sql`
4. `004_program_price_metadata.sql`
5. `005_family_member_trials_and_proration.sql`

## Launch Data Truth

Current BJJ launch data is captured in `seed.sql`:

- Spring 2026 semester starts `2026-03-31`
- Spring 2026 semester ends `2026-06-27`
- `13` weeks/classes-per-single-day track
- deferred second payment date: `2026-05-12`
- kids pricing: `1200` cents per class
- men pricing: `1400` cents per class
- women Tuesday: `2000` cents per class
- women Thursday: `2000` cents per class
- registration fee: `0`

Current admin bootstrap rows are captured in `admin-seed.sql`.

## Family / Trial / Proration Tables

The latest schema now includes:

- `guardian_accounts` with account completion fields
- `saved_students` with `participant_type` and `is_account_holder`
- `waiver_documents`
- `trial_bookings`
- `proration_codes`
- enriched `enrollment_orders` waiver/trial/proration metadata

## Technique / Studio Truth

These systems are still part of the live schema and codebase:

- `technique_sequences`
- `studio_sessions`

Important:

- `technique_sequences` is not seeded by `seed.sql`
- `studio_sessions` is not seeded by `seed.sql`
- both are content/runtime tables, not catalog seed tables
- an empty table here does **not** mean the feature is missing

As of this check:

- the technique sequence builder code still exists at [`/Users/muadhsambul/Downloads/sunnah prot/client/src/pages/admin/AdminSequences.tsx`](/Users/muadhsambul/Downloads/sunnah%20prot/client/src/pages/admin/AdminSequences.tsx)
- the admin API still exists at [`/Users/muadhsambul/Downloads/sunnah prot/functions/api/admin/sequences.ts`](/Users/muadhsambul/Downloads/sunnah%20prot/functions/api/admin/sequences.ts)
- the public techniques API still exists at [`/Users/muadhsambul/Downloads/sunnah prot/functions/api/techniques.ts`](/Users/muadhsambul/Downloads/sunnah%20prot/functions/api/techniques.ts)
- the schema still contains `technique_sequences`
- the production-bound remote D1 still reports both `technique_sequences` and `studio_sessions` as real tables
- the local Miniflare DB currently reports `0` rows in `technique_sequences`
- the local Miniflare DB currently reports `0` rows in `studio_sessions`

## Working Rule Going Forward

When database shape or launch catalog data changes:

1. update the relevant migration if the change must upgrade existing DBs
2. update `schema.sql` to the latest end-state
3. update `seed.sql` if the launch baseline changed
4. update this file if the operational truth changed

That keeps us from relying on memory or reconstructing intent from scattered SQL later.
