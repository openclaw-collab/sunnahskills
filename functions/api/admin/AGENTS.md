<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# admin

## Purpose
Admin-only API routes for dashboard operations. All routes require valid admin session.

## Key Files

| File | Route | Description |
|------|-------|-------------|
| `registrations.ts` | /api/admin/registrations | List/filter registrations |
| `registrations/[id].ts` | /api/admin/registrations/:id | Get/update single registration |
| `payments.ts` | /api/admin/payments | Payment list and summary |
| `programs.ts` | /api/admin/programs | Program CRUD |
| `sessions.ts` | /api/admin/sessions | Session scheduling |
| `discounts.ts` | /api/admin/discounts | Promo code CRUD |
| `contacts.ts` | /api/admin/contacts | Contact submissions |
| `export.ts` | /api/admin/export | CSV export |

## Authentication

All routes use `adminAuth()` utility:
```typescript
const auth = await adminAuth(request, env);
if (!auth.valid) return auth.response;
```

## Common Operations

### Registrations
- GET: List with filters (status, program, date range)
- GET /:id: Full registration details
- PATCH /:id: Update status, notes

### Payments
- GET: Summary stats + recent payments
- Filter by status, date range

### Programs/Sessions
- Full CRUD operations
- Capacity management
- Pricing updates

## For AI Agents

### Working In This Directory
- Always validate session first
- Use transactions for multi-table operations
- Return consistent error formats
- Support pagination for list endpoints

### Error Handling
```typescript
return new Response(JSON.stringify({ error: 'message' }), {
  status: 400,
  headers: { 'Content-Type': 'application/json' }
});
```

<!-- MANUAL: -->
