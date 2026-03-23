# Admin Dashboard

## Access

URL: `/admin`

Login with the admin email + password seeded into `admin_users`. Authentication uses bcrypt and a D1-backed session token stored in an HttpOnly cookie `admin_session`.

Default session lifetime: **7 days**.

## First-time admin setup

There is no self-registration. Add admin users by inserting a bcrypt hash into D1:

```bash
# Generate a hash locally (Node.js)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(h => console.log(h));"

# Insert into D1
npx wrangler d1 execute sunnahskills-admin-v2 --command \
  "INSERT INTO admin_users (email, password_hash, name, role) VALUES ('admin@example.com', '\$2a\$10\$...hash...', 'Admin', 'admin');"
```

## Dashboard panels (`components/admin/`)

| Panel | Route | Purpose |
|---|---|---|
| `AdminOverview` | default view | Summary counts: registrations, revenue, open waitlist |
| `RegistrationsTable` | Registrations tab | Full list with filters (program, status, search) |
| `RegistrationDetail` | Drawer | Individual registration: guardian, student, waivers, payment, admin notes, status controls |
| `PaymentsSummary` | Payments tab | Revenue by program, payment status breakdown |
| `PricingManager` | Pricing tab | View/edit `program_prices` tiers **and** active **`semesters`** (classes in semester, price/class, reg fee, later-payment date) via `GET`/`PATCH` `/api/admin/semesters` |
| `SessionManager` | Sessions tab | View/edit `program_sessions` — capacity, dates, status |
| `DiscountsManager` | Discounts tab | Create/deactivate promo codes |
| `ContactsTable` | Contacts tab | Submitted contact form messages |
| `AdminSequences` | `/admin/sequences` | Sequence builder for GrappleMap catalog entries |

## Admin API routes (`functions/api/admin/`)

All routes require a valid `admin_session` cookie (checked by `adminAuth` utility).

| Endpoint | Method | Notes |
|---|---|---|
| `/api/auth/login` | `POST` | Validates email+password, sets cookie |
| `/api/auth/logout` | `POST` | Deletes session row, clears cookie |
| `/api/auth/me` | `GET` | Returns current admin user info |
| `/api/admin/registrations` | `GET` | List all registrations (query: `program`, `status`, `search`, `limit`, `offset`) |
| `/api/admin/registrations/:id` | `GET` | Single registration with guardian + student + waivers + payment |
| `/api/admin/registrations/:id` | `PATCH` | Update status or admin notes |
| `/api/admin/payments` | `GET` | Payment list + aggregate by program |
| `/api/admin/programs` | `GET` | Program catalog |
| `/api/admin/programs` | `PATCH` | Update program status or metadata |
| `/api/admin/sessions` | `PATCH` | Update session visibility/status |
| `/api/admin/sessions/:id` | `PATCH` | Update session (capacity, dates, status) |
| `/api/admin/positions` | `GET` | Static GrappleMap positions catalog |
| `/api/admin/sequences` | `GET` | GrappleMap sequence catalog from static assets |
| `/api/admin/sequences` | `POST` | Sequence creation stub (returns not supported) |
| `/api/admin/discounts` | `GET` | All discount codes |
| `/api/admin/discounts` | `POST` | Create new discount code |
| `/api/admin/discounts/:id` | `PATCH` | Activate / deactivate |
| `/api/admin/contacts` | `GET` | Contact form submissions |
| `/api/admin/export` | `GET` | CSV export of registrations (query params: `program`, `status`, `from`, `to`) |
| `/api/admin/semesters` | `GET` | List semester rows (pricing inputs for BJJ / catalog) |
| `/api/admin/semesters` | `PATCH` | Update semester fields (admin UI in Pricing tab) |

## Registration status flow

```
draft → submitted → pending_payment → paid → active
                 ↘ waitlisted
                              ↘ cancelled / refunded
```

Admin can manually move registrations to any status via the detail drawer.

## Payment status values

`unpaid` · `pending` · `paid` · `failed` · `refunded` · `partially_refunded`

## Export

The export endpoint returns a CSV with columns: registration ID, student name, guardian name, guardian email, program, session, status, payment status, amount, created date.

Query parameters:
- `program` — filter by program slug
- `status` — filter by enrollment status
- `from` / `to` — ISO date range filter
