<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# shared

## Purpose
Shared TypeScript types and Zod schemas used by both frontend and backend. Ensures type safety across the client-server boundary.

## Key Files

| File | Description |
|------|-------------|
| `types.ts` | Core TypeScript interfaces (Program, Registration, Student, etc.) |
| `schema.ts` | Zod validation schemas for API payloads |
| `schema.frontend.ts` | Frontend-specific schema extensions |

## Exports Overview

### types.ts
- `Program`, `ProgramSession` - Program definitions
- `Registration`, `RegistrationInput` - Registration data
- `Guardian`, `Student` - Person entities
- `PaymentIntent`, `PaymentStatus` - Payment types
- `AdminUser`, `AdminSession` - Admin auth types
- `StudioSession`, `StudioEdit` - Studio types

### schema.ts
- `registrationSchema` - Zod schema for registration payload
- `paymentIntentSchema` - Schema for payment creation
- `contactSchema` - Contact form validation
- `loginSchema` - Admin login validation
- `discountCodeSchema` - Promo code validation

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
import { Registration, registrationSchema } from '../../shared/types';
const data: Registration = { ... };

// Backend
import { registrationSchema } from '../../shared/schema';
const result = registrationSchema.safeParse(body);
```

<!-- MANUAL: -->
