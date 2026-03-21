<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# shared

## Purpose
Shared TypeScript types and Zod schemas used by both frontend and backend. Ensures type safety across the client-server boundary.

## Key Files

| File | Description |
|------|-------------|
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
