<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# admin

## Purpose
Admin dashboard panel components. Provides CRUD operations for registrations, payments, pricing, sessions, and discounts.

## Key Files

| File | Description |
|------|-------------|
| `AdminOverview.tsx` | Dashboard overview with stats |
| `RegistrationsTable.tsx` | List of all registrations |
| `RegistrationDetail.tsx` | Single registration view/edit |
| `PaymentsSummary.tsx` | Payment analytics and list |
| `PricingManager.tsx` | Program pricing configuration |
| `SessionManager.tsx` | Session scheduling and capacity |
| `DiscountsManager.tsx` | Promo code management |
| `ContactsTable.tsx` | Contact form submissions |

## Admin Dashboard Structure

### Tabs
1. **Overview** - Key metrics and recent activity
2. **Registrations** - All registrations with filtering
3. **Payments** - Payment status and history
4. **Pricing** - Program price management
5. **Sessions** - Session capacity and scheduling
6. **Discounts** - Promo codes
7. **Contacts** - Contact form submissions

## Authentication

- Login at `/admin` → POST `/api/auth/login`
- Session cookie `admin_session` (HttpOnly, Secure)
- All `/api/admin/*` routes verify session via `adminAuth()`
- Session expires after 24 hours

## For AI Agents

### Working In This Directory
- All admin components require authentication
- Use TanStack Query for data fetching
- Support inline editing where appropriate
- Confirm destructive actions

### API Pattern
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['admin', 'registrations'],
  queryFn: () => fetch('/api/admin/registrations', {
    credentials: 'include'
  }).then(r => r.json())
});
```

### Security Notes
- Never expose admin endpoints without auth
- Validate all inputs server-side
- Log admin actions
- Use prepared statements for D1 queries

<!-- MANUAL: -->
