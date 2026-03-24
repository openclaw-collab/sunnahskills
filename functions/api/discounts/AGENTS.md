<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# discounts

## Purpose
Promo code validation endpoint for registration discounts.

## Key Files

| File | Route | Description |
|------|-------|-------------|
| `validate.ts` | POST /api/discounts/validate | Validate promo code |

## Validation Logic

```typescript
POST /api/discounts/validate
  ├── Check code exists in discount_codes
  ├── Verify code is active
  ├── Check usage limit not exceeded
  ├── Verify not expired
  └── Return { valid: true, amount, type } or { valid: false, reason }
```

## Discount Types

- `fixed` - Fixed amount off (e.g., $50 off)
- `percentage` - Percentage off (e.g., 10% off)
- `sibling` - Automatic sibling discount (applied server-side)

## Schema

```sql
CREATE TABLE discount_codes (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'fixed' | 'percentage'
  amount INTEGER NOT NULL, -- cents for fixed, percent for percentage
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  expires_at DATETIME,
  is_active INTEGER DEFAULT 1
);
```

## For AI Agents

### Working In This Directory
- Case-insensitive code matching
- Increment use count atomically
- Return clear error messages
- Support both public and admin-created codes

<!-- MANUAL: -->
