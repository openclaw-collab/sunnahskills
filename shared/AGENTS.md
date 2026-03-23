<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# shared

## Purpose
Shared TypeScript types, Zod schemas, **pricing**, and registration option literals used by the **Vite client** and **Cloudflare Functions** (import via `@shared/*` / relative paths).

## Key Files

| File | Description |
|------|-------------|
| `orderPricing.ts` | Line tuition, kids/sibling, plan split, semester dates — shared with payment endpoints + `OrderSummaryCard` |
| `pricing.ts` | Cents helpers for kids lines and sibling discount |
| `registration-options.ts` | Canonical arrays for registration UI + server Zod |
| `types.ts` | Core TypeScript aliases derived from `schema.ts` |
| `schema.ts` | Zod validation schemas for API payloads |
| `schema.frontend.ts` | Frontend-specific schema extensions |

## Exports Overview

### types.ts
- `RegistrationStatus`, `PaymentStatus`
- `Guardian`, `Student`, `Registration`, `Waiver`, `Payment`, `Discount`
- `AdminUser`, `Contact`

### schema.ts
- `registrationSchema` - Zod schema for registration payload
- `guardianSchema`, `studentSchema`, `registrationSchema`, `waiverSchema`
- `paymentSchema`, `discountSchema`, `adminUserSchema`, `contactSchema`
- `registrationStatusEnum`, `paymentStatusEnum`

## For AI Agents

### Working In This Directory
- Keep types in sync with `db/schema.sql`
- Zod schemas should match TypeScript interfaces
- Export all types from files
- Import in both client and functions code

### Common Patterns
- Use `z.infer<typeof schema>` to derive TypeScript types from Zod
- Co-locate related schemas (input, output, partial)
- Use `.optional()`, `.nullable()` for optional fields
- Add `.describe()` for documentation

## Usage

```typescript
// Frontend
import type { Registration } from '../../shared/types';
import { registrationSchema } from '../../shared/schema';
const data: Registration = { ... };

// Backend
import { registrationSchema } from '../../shared/schema';
const result = registrationSchema.safeParse(body);
```

<!-- MANUAL: -->
