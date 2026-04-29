# Registration Hub Oakville Admin Ops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove weak program-card undertext, correct Oakville BJJ address/schedule, and modernize admin registration/payment filtering so staff can quickly answer who registered, where, and what is paid.

**Architecture:** Keep the public/guardian UX changes small and separate from the admin operations work. Oakville remains a location dimension on the existing BJJ program; update D1 seed/migration data plus hardcoded fallback copy. Admin filtering should be server-backed, with the registrations and payments tables owning their filter state and using consistent lifecycle labels from `paymentLifecycle`.

**Tech Stack:** React 18, TypeScript, Wouter, Tailwind, shadcn/Radix select/input/checkbox, Cloudflare Pages Functions, D1 SQL, Vitest, React Testing Library.

---

## File Structure

**Public registration hub**
- Modify: `client/src/pages/RegistrationHub.tsx`
  - Replace the two text-heavy program buttons with compact action tiles.
  - Remove the undertext strings:
    - `Age and gender tracks · semester checkout`
    - `Four-session series · $130 first registration / $125 additional family registrations`
- Create: `client/src/__tests__/pages/RegistrationHub.programCards.test.tsx`
  - Verifies the cards render the program names and do not render the removed undertext.

**Registration pricing language**
- Modify: `client/src/components/registration/OrderSummaryCard.tsx`
  - Never show parent-facing per-class math such as `13 classes × $12.00`.
  - Show semester tuition totals and installment schedule only.
- Modify: `client/src/pages/registration/BJJRegistration.tsx`
  - Any BJJ line preview text must use semester-total language.
- Modify: `client/src/__tests__/components/registration/OrderSummaryCard.test.tsx`
  - Verifies no per-class wording appears when BJJ preview pricing is rendered.
- Modify: `client/src/__tests__/integration/registration-flow.test.tsx`
  - Verifies the registration flow surfaces semester pricing language, not per-class language.

**Oakville location and sessions**
- Create: `db/migrations/014_update_oakville_bjj_location_schedule.sql`
  - Update Oakville address to `2200 Speers Road, Oakville`.
  - Move Oakville BJJ kids sessions from Tuesday `17:00-18:00` to Monday and Wednesday `14:30-15:30`.
  - Set Oakville BJJ visible session start date to `2026-05-15`.
  - Keep one BJJ program and location-specific sessions.
- Modify: `db/seed.sql`
  - Keep fresh/local database seed data aligned with production migration.
- Modify: `client/src/pages/programs/BJJProgram.tsx`
  - Update Oakville address and schedule text shown on `/programs/bjj`.
- Modify: `client/src/pages/registration/BJJRegistration.tsx`
  - Update fallback Oakville address for `/programs/bjj/register`.
- Modify: `client/src/__tests__/integration/mocks/handlers.ts`
  - Update Oakville mock location/session data.
- Modify: `functions/__tests__/programs-location.test.ts`
  - Assert Oakville location address and Monday/Wednesday session schedule are returned.

**Admin operations filtering**
- Create: `client/src/components/admin/AdminFilterBar.tsx`
  - Shared filter controls for program, location, track, status, payment state, review state, search, and superseded toggle.
- Create: `client/src/components/admin/adminFilterOptions.ts`
  - Central option lists and URL builders.
- Modify: `client/src/components/admin/RegistrationsTable.tsx`
  - Add location/session columns and server-backed filters.
  - Replace the explanatory “Reading this table” block with a compact summary strip and direct filter controls.
- Modify: `client/src/components/admin/PaymentsSummary.tsx`
  - Add filters and local refresh against `/api/admin/orders`.
  - Surface paid/full, half-paid, failed, pending, review-required, and superseded as first-class filters.
- Modify: `client/src/pages/admin/AdminDashboard.tsx`
  - Keep initial load behavior but let table components refresh their own filtered data after mount.
  - Pass `programs` and `locations` metadata when available, or let filter components fetch `/api/admin/programs` and `/api/programs`.
- Modify: `functions/api/admin/registrations.ts`
  - Add query params: `locationId`, `paymentState`, `registrationStatus`, `dateFrom`, `dateTo`, `sort`.
  - Return `location_id`, `location_name`, `session_name`, `session_day_of_week`, `session_start_time`, `session_end_time`.
- Modify: `functions/api/admin/orders.ts`
  - Add query params: `programId`, `locationId`, `paymentState`, `review`, `q`, `dateFrom`, `dateTo`, `sort`.
  - Return program/location rollups for each order.
- Modify: `client/src/__tests__/components/admin/RegistrationsTable.test.tsx`
  - Verify filter URL construction and row display.
- Modify: `client/src/__tests__/components/admin/PaymentsSummary.test.tsx`
  - Verify payment filters and summary labels.
- Modify: `functions/__tests__/admin.test.ts`
  - Verify SQL contains and binds the new filters.
- Modify: `client/src/__tests__/integration/admin-dashboard.test.tsx`
  - Verify admin can filter registrations/payments by location and payment state.

---

### Task 1: Registration Hub Program Cards

**Files:**
- Modify: `client/src/pages/RegistrationHub.tsx`
- Create: `client/src/__tests__/pages/RegistrationHub.programCards.test.tsx`

- [ ] **Step 1: Write the failing component test**

Create `client/src/__tests__/pages/RegistrationHub.programCards.test.tsx`:

```tsx
import React from "react";
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Router } from "wouter";
import { render } from "@/__tests__/test-utils";
import RegistrationHub from "@/pages/RegistrationHub";

function renderHub() {
  function useLocation() {
    return ["/register", () => undefined] as [string, (to: string) => void];
  }

  return render(
    <Router hook={useLocation}>
      <RegistrationHub />
    </Router>,
  );
}

describe("RegistrationHub program cards", () => {
  it("shows clean program cards without explanatory undertext", async () => {
    renderHub();

    expect(await screen.findByText("Brazilian Jiu-Jitsu")).toBeInTheDocument();
    expect(screen.getByText("Traditional Archery")).toBeInTheDocument();
    expect(screen.queryByText(/Age and gender tracks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Four-session series/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- --run client/src/__tests__/pages/RegistrationHub.programCards.test.tsx
```

Expected: FAIL because the old undertext still appears.

- [ ] **Step 3: Replace the two text-heavy buttons with clean cards**

In `client/src/pages/RegistrationHub.tsx`, replace the current two program buttons inside the `Available programs` grid with:

```tsx
<button
  type="button"
  disabled={participants.length === 0}
  onClick={() => navigate("/programs/bjj/register")}
  className="group flex items-center justify-between rounded-2xl border border-moss/15 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-moss/40 hover:bg-moss/5 disabled:cursor-not-allowed disabled:opacity-50"
>
  <div>
    <div className="text-sm font-medium text-charcoal">Brazilian Jiu-Jitsu</div>
    <div className="mt-1 text-xs text-charcoal/50">Mississauga + Oakville</div>
  </div>
  <span className="rounded-full border border-moss/20 bg-moss/8 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.16em] text-moss">
    Register
  </span>
</button>
<button
  type="button"
  disabled={participants.length === 0}
  onClick={() => navigate("/programs/archery/register")}
  className="group flex items-center justify-between rounded-2xl border border-clay/20 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-clay/40 hover:bg-clay/5 disabled:cursor-not-allowed disabled:opacity-50"
>
  <div>
    <div className="text-sm font-medium text-charcoal">Traditional Archery</div>
    <div className="mt-1 text-xs text-charcoal/50">Open registration</div>
  </div>
  <span className="rounded-full border border-clay/20 bg-clay/8 px-3 py-1 text-[10px] font-mono-label uppercase tracking-[0.16em] text-clay">
    Register
  </span>
</button>
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- --run client/src/__tests__/pages/RegistrationHub.programCards.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/RegistrationHub.tsx client/src/__tests__/pages/RegistrationHub.programCards.test.tsx
git commit -m "Refine registration hub program cards"
```

---

### Task 2: Oakville Address and Monday/Wednesday Schedule

**Files:**
- Create: `db/migrations/014_update_oakville_bjj_location_schedule.sql`
- Modify: `db/seed.sql`
- Modify: `client/src/pages/programs/BJJProgram.tsx`
- Modify: `client/src/pages/registration/BJJRegistration.tsx`
- Modify: `client/src/__tests__/integration/mocks/handlers.ts`
- Modify: `functions/__tests__/programs-location.test.ts`

- [ ] **Step 1: Write the failing function test**

Modify `functions/__tests__/programs-location.test.ts` so the Oakville assertion includes the address and Monday/Wednesday sessions:

```ts
expect(data.locations.find((location: any) => location.id === "oakville")?.address).toBe("2200 Speers Road, Oakville");
const oakvilleSessions = data.programs[0].sessions.filter((session: any) => session.location_id === "oakville");
expect(oakvilleSessions.map((session: any) => `${session.day_of_week} ${session.start_time}-${session.end_time}`)).toEqual([
  "Monday 14:30-15:30",
  "Wednesday 14:30-15:30",
]);
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:functions -- --run functions/__tests__/programs-location.test.ts
```

Expected: FAIL because current test/mock data still has Oakville as `Oakville, ON` and Tuesday `17:00-18:00`.

- [ ] **Step 3: Add the production data migration**

Create `db/migrations/014_update_oakville_bjj_location_schedule.sql`:

```sql
UPDATE locations
SET address = '2200 Speers Road, Oakville'
WHERE id = 'oakville';

UPDATE program_sessions
SET
  name = CASE
    WHEN age_group = 'girls-5-10' THEN 'Oakville Girls 5-10 - Monday'
    WHEN age_group = 'boys-7-13' THEN 'Oakville Boys 7-13 - Monday'
    ELSE name
  END,
  day_of_week = 'Monday',
  start_time = '14:30',
  end_time = '15:30',
  status = 'active',
  visible = 1
WHERE program_id = 'bjj'
  AND location_id = 'oakville'
  AND day_of_week = 'Tuesday'
  AND start_time = '17:00'
  AND end_time = '18:00'
  AND age_group IN ('girls-5-10', 'boys-7-13');

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Girls 5-10 - Wednesday', NULL, 'Wednesday', '14:30', '15:30',
       'girls-5-10', 'female', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND location_id = 'oakville'
    AND age_group = 'girls-5-10'
    AND day_of_week = 'Wednesday'
    AND start_time = '14:30'
    AND end_time = '15:30'
);

INSERT INTO program_sessions (
  program_id, location_id, name, season, day_of_week, start_time, end_time,
  age_group, gender_group, capacity, status, visible
)
SELECT 'bjj', 'oakville', 'Oakville Boys 7-13 - Wednesday', NULL, 'Wednesday', '14:30', '15:30',
       'boys-7-13', 'male', 16, 'active', 1
WHERE NOT EXISTS (
  SELECT 1 FROM program_sessions
  WHERE program_id = 'bjj'
    AND location_id = 'oakville'
    AND age_group = 'boys-7-13'
    AND day_of_week = 'Wednesday'
    AND start_time = '14:30'
    AND end_time = '15:30'
);
```

- [ ] **Step 4: Align seed and frontend fallback copy**

Make these concrete text/data updates:

```ts
// client/src/pages/programs/BJJProgram.tsx
address: "2200 Speers Road",
summary: "Kids BJJ launch classes for girls and boys.",

const OAKVILLE_TRACK_SCHEDULES: Record<string, string> = {
  "girls-5-10": "Monday and Wednesday 2:30 to 3:30 PM",
  "boys-7-13": "Monday and Wednesday 2:30 to 3:30 PM",
};
```

```ts
// client/src/pages/registration/BJJRegistration.tsx fallback locations
{ id: "oakville", display_name: "Oakville", city: "Oakville", address: "2200 Speers Road, Oakville", status: "active" },
```

```ts
// client/src/__tests__/integration/mocks/handlers.ts location fixture
{ id: "oakville", display_name: "Oakville", city: "Oakville", address: "2200 Speers Road, Oakville", status: "active" },
```

In `db/seed.sql`, update the Oakville location row and Oakville session rows to match the migration exactly.

- [ ] **Step 5: Run function tests**

Run:

```bash
npm run test:functions -- --run functions/__tests__/programs-location.test.ts
```

Expected: PASS.

- [ ] **Step 6: Apply the migration to production after code review**

Run:

```bash
npx wrangler d1 execute sunnahskills-admin-v3 --remote --file=db/migrations/014_update_oakville_bjj_location_schedule.sql
```

Expected: Wrangler reports success and rows written.

- [ ] **Step 7: Verify production data directly**

Run:

```bash
npx wrangler d1 execute sunnahskills-admin-v3 --remote --command "SELECT id, display_name, address FROM locations WHERE id = 'oakville'; SELECT id, name, day_of_week, start_time, end_time, age_group, visible FROM program_sessions WHERE program_id = 'bjj' AND location_id = 'oakville' ORDER BY age_group, day_of_week;"
```

Expected:
- Oakville address is `2200 Speers Road, Oakville`.
- Oakville BJJ sessions include Monday and Wednesday at `14:30-15:30`.
- No visible Oakville Tuesday `17:00-18:00` session remains.

- [ ] **Step 8: Commit**

```bash
git add db/migrations/014_update_oakville_bjj_location_schedule.sql db/seed.sql client/src/pages/programs/BJJProgram.tsx client/src/pages/registration/BJJRegistration.tsx client/src/__tests__/integration/mocks/handlers.ts functions/__tests__/programs-location.test.ts
git commit -m "Update Oakville BJJ address and schedule"
```

---

### Task 3: Parent-Facing Semester Pricing Language

**Files:**
- Modify: `client/src/components/registration/OrderSummaryCard.tsx`
- Modify: `client/src/pages/registration/BJJRegistration.tsx`
- Modify: `client/src/__tests__/components/registration/OrderSummaryCard.test.tsx`
- Modify: `client/src/__tests__/integration/registration-flow.test.tsx`

- [ ] **Step 1: Write the failing order summary test**

In `client/src/__tests__/components/registration/OrderSummaryCard.test.tsx`, add a BJJ preview test that asserts semester wording and rejects per-class wording:

```tsx
it("shows BJJ semester totals without per-class math", async () => {
  render(
    <OrderSummaryCard
      program={PROGRAMS.bjj}
      siblingCount={0}
      discountCode=""
      onDiscountCodeChange={() => undefined}
      selectedPriceId={1}
      bjjLinePreview={{
        track: "boys-7-13",
        paymentChoice: "full",
        priceId: 1,
      }}
    />,
  );

  expect(await screen.findByText(/Semester tuition/i)).toBeInTheDocument();
  expect(screen.queryByText(/classes\s*×/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/per class/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/sessions\s*×/i)).not.toBeInTheDocument();
});
```

If this test file does not already mock `useProgramsCatalog`, add this mock at the top:

```tsx
vi.mock("@/hooks/useProgramsCatalog", () => ({
  useProgramsCatalog: () => ({
    isLoading: false,
    data: {
      programs: [
        {
          slug: "bjj",
          active_semester: {
            classes_in_semester: 13,
            price_per_class_cents: 1200,
            registration_fee_cents: 0,
            later_payment_date: "2026-05-12",
            start_date: "2026-03-31",
            end_date: "2026-06-27",
          },
          prices: [
            {
              id: 1,
              age_group: "boys-7-13",
              amount: 1200,
              registration_fee: 0,
              frequency: "semester",
              metadata: null,
            },
          ],
        },
      ],
    },
  }),
}));
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- --run client/src/__tests__/components/registration/OrderSummaryCard.test.tsx
```

Expected: FAIL because `OrderSummaryCard` currently renders `classes × $...` or `sessions × tier rate`.

- [ ] **Step 3: Replace per-class display copy with semester-total display copy**

In `client/src/components/registration/OrderSummaryCard.tsx`, replace the BJJ tuition sublabel:

```tsx
<div className="font-mono-label text-[9px] uppercase tracking-[0.15em] text-cream/40 mt-0.5">
  Semester total
</div>
```

Also change the top selected-tier label from:

```tsx
{showBjjEstimate && bjjBreakdown ? "Selected tier (estimate)" : price.label}
```

to:

```tsx
{showBjjEstimate && bjjBreakdown ? "Semester tuition estimate" : price.label}
```

Keep `bjjBreakdown.perClassCents`, `classesN`, and the backend formulas intact. This is a display-only change: calculation can still use per-class values internally, but parent-facing registration UI must not show per-class math.

- [ ] **Step 4: Check BJJ registration preview copy**

In `client/src/pages/registration/BJJRegistration.tsx`, search for any visible text using:

```bash
rg -n "per class|classes ×|sessions ×|class rate|price per" client/src/pages/registration/BJJRegistration.tsx
```

If a visible pricing line exists, replace it with:

```tsx
Semester tuition: {money(cartLinePreview.afterSiblingCents)}
```

For payment-plan copy, use:

```tsx
Pay today {money(paymentSplit.dueTodayCents)} · second installment {money(paymentSplit.dueLaterCents)}
```

Do not show `cartLinePreview.perClassCents` or `cartLinePreview.classesN` in visible parent-facing copy.

- [ ] **Step 5: Add integration guard**

In `client/src/__tests__/integration/registration-flow.test.tsx`, add an assertion in the BJJ registration test after a BJJ track/price is selected:

```tsx
expect(screen.queryByText(/classes\s*×/i)).not.toBeInTheDocument();
expect(screen.queryByText(/per class/i)).not.toBeInTheDocument();
expect(screen.getByText(/semester tuition/i)).toBeInTheDocument();
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm test -- --run \
  client/src/__tests__/components/registration/OrderSummaryCard.test.tsx \
  client/src/__tests__/integration/registration-flow.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/registration/OrderSummaryCard.tsx client/src/pages/registration/BJJRegistration.tsx client/src/__tests__/components/registration/OrderSummaryCard.test.tsx client/src/__tests__/integration/registration-flow.test.tsx
git commit -m "Show semester pricing in registration"
```

---

### Task 4: Shared Admin Filter Controls

**Files:**
- Create: `client/src/components/admin/adminFilterOptions.ts`
- Create: `client/src/components/admin/AdminFilterBar.tsx`
- Create: `client/src/__tests__/components/admin/AdminFilterBar.test.tsx`

- [ ] **Step 1: Write the failing filter-bar test**

Create `client/src/__tests__/components/admin/AdminFilterBar.test.tsx`:

```tsx
import React from "react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/__tests__/test-utils";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";

describe("AdminFilterBar", () => {
  it("emits program, location, payment state, and search filters", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <AdminFilterBar
        value={{
          programId: "all",
          locationId: "all",
          track: "all",
          registrationStatus: "all",
          paymentState: "all",
          review: "all",
          q: "",
          includeSuperseded: false,
          dateFrom: "",
          dateTo: "",
          sort: "newest",
        }}
        programs={[{ id: "bjj", name: "Brazilian Jiu-Jitsu", slug: "bjj" }]}
        locations={[{ id: "oakville", display_name: "Oakville" }]}
        tracks={[{ value: "boys-7-13", label: "Boys 7-13" }]}
        mode="registrations"
        onChange={onChange}
        onRefresh={() => undefined}
        refreshing={false}
      />,
    );

    await user.type(screen.getByPlaceholderText(/parent, student, email, order/i), "hassan");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ q: "hassan" }));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- --run client/src/__tests__/components/admin/AdminFilterBar.test.tsx
```

Expected: FAIL because `AdminFilterBar` does not exist.

- [ ] **Step 3: Create filter option helpers**

Create `client/src/components/admin/adminFilterOptions.ts`:

```ts
export type AdminFilterState = {
  programId: string;
  locationId: string;
  track: string;
  registrationStatus: string;
  paymentState: string;
  review: string;
  q: string;
  includeSuperseded: boolean;
  dateFrom: string;
  dateTo: string;
  sort: "newest" | "oldest" | "student" | "guardian" | "amount_desc" | "amount_asc";
};

export type AdminProgramOption = { id: string; name: string; slug: string };
export type AdminLocationOption = { id: string; display_name: string };
export type AdminTrackOption = { value: string; label: string };

export const DEFAULT_ADMIN_FILTERS: AdminFilterState = {
  programId: "all",
  locationId: "all",
  track: "all",
  registrationStatus: "all",
  paymentState: "all",
  review: "all",
  q: "",
  includeSuperseded: false,
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

export const PAYMENT_STATE_OPTIONS = [
  { value: "all", label: "All payments" },
  { value: "paid_full", label: "Paid in full" },
  { value: "paid_partial", label: "Half paid" },
  { value: "pending", label: "Unpaid / pending" },
  { value: "failed", label: "Failed" },
  { value: "superseded", label: "Superseded" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export function buildAdminQuery(basePath: string, filters: AdminFilterState) {
  const sp = new URLSearchParams();
  if (filters.programId !== "all") sp.set("programId", filters.programId);
  if (filters.locationId !== "all") sp.set("locationId", filters.locationId);
  if (filters.track !== "all") sp.set("track", filters.track);
  if (filters.registrationStatus !== "all") sp.set("registrationStatus", filters.registrationStatus);
  if (filters.paymentState !== "all") sp.set("paymentState", filters.paymentState);
  if (filters.review !== "all") sp.set("review", filters.review);
  if (filters.q.trim()) sp.set("q", filters.q.trim());
  if (filters.includeSuperseded) sp.set("includeSuperseded", "1");
  if (filters.dateFrom) sp.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) sp.set("dateTo", filters.dateTo);
  if (filters.sort !== "newest") sp.set("sort", filters.sort);
  const qs = sp.toString();
  return `${basePath}${qs ? `?${qs}` : ""}`;
}
```

- [ ] **Step 4: Create `AdminFilterBar`**

Create `client/src/components/admin/AdminFilterBar.tsx`:

```tsx
import React from "react";
import { RefreshCw } from "lucide-react";
import { ClayButton } from "@/components/brand/ClayButton";
import { OutlineButton } from "@/components/brand/OutlineButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_ADMIN_FILTERS,
  PAYMENT_STATE_OPTIONS,
  type AdminFilterState,
  type AdminLocationOption,
  type AdminProgramOption,
  type AdminTrackOption,
} from "@/components/admin/adminFilterOptions";

type Props = {
  value: AdminFilterState;
  programs: AdminProgramOption[];
  locations: AdminLocationOption[];
  tracks: AdminTrackOption[];
  mode: "registrations" | "payments";
  refreshing: boolean;
  onChange: (next: AdminFilterState) => void;
  onRefresh: () => void;
};

export function AdminFilterBar({ value, programs, locations, tracks, mode, refreshing, onChange, onRefresh }: Props) {
  const patch = (partial: Partial<AdminFilterState>) => onChange({ ...value, ...partial });

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-cream/45 p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Select value={value.programId} onValueChange={(programId) => patch({ programId, track: "all" })}>
          <SelectTrigger className="bg-white border-charcoal/10"><SelectValue placeholder="All programs" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All programs</SelectItem>
            {programs.map((program) => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={value.locationId} onValueChange={(locationId) => patch({ locationId })}>
          <SelectTrigger className="bg-white border-charcoal/10"><SelectValue placeholder="All locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((location) => <SelectItem key={location.id} value={location.id}>{location.display_name}</SelectItem>)}
          </SelectContent>
        </Select>
        {mode === "registrations" ? (
          <Select value={value.track} onValueChange={(track) => patch({ track })}>
            <SelectTrigger className="bg-white border-charcoal/10"><SelectValue placeholder="All tracks" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tracks</SelectItem>
              {tracks.map((track) => <SelectItem key={track.value} value={track.value}>{track.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Select value={value.review} onValueChange={(review) => patch({ review })}>
            <SelectTrigger className="bg-white border-charcoal/10"><SelectValue placeholder="Review state" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All review states</SelectItem>
              <SelectItem value="none">No review</SelectItem>
              <SelectItem value="required">Needs review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={value.paymentState} onValueChange={(paymentState) => patch({ paymentState })}>
          <SelectTrigger className="bg-white border-charcoal/10"><SelectValue placeholder="Payment state" /></SelectTrigger>
          <SelectContent>
            {PAYMENT_STATE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={value.sort} onValueChange={(sort) => patch({ sort: sort as AdminFilterState["sort"] })}>
          <SelectTrigger className="bg-white border-charcoal/10"><SelectValue placeholder="Sort" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="student">Student A-Z</SelectItem>
            <SelectItem value="guardian">Guardian A-Z</SelectItem>
            <SelectItem value="amount_desc">Amount high-low</SelectItem>
            <SelectItem value="amount_asc">Amount low-high</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={value.q}
          onChange={(event) => patch({ q: event.target.value })}
          placeholder="Parent, student, email, order..."
          className="bg-white border-charcoal/10"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-3 py-2 text-[11px] font-mono-label uppercase tracking-[0.14em] text-charcoal/65">
          <Checkbox checked={value.includeSuperseded} onCheckedChange={(checked) => patch({ includeSuperseded: checked === true })} />
          Show superseded
        </label>
        <div className="flex gap-2">
          <OutlineButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={() => onChange(DEFAULT_ADMIN_FILTERS)}>
            Reset
          </OutlineButton>
          <ClayButton className="px-4 py-2 text-[11px] uppercase tracking-[0.18em]" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            {refreshing ? "Refreshing" : "Refresh"}
          </ClayButton>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run the filter-bar test**

Run:

```bash
npm test -- --run client/src/__tests__/components/admin/AdminFilterBar.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/admin/adminFilterOptions.ts client/src/components/admin/AdminFilterBar.tsx client/src/__tests__/components/admin/AdminFilterBar.test.tsx
git commit -m "Add shared admin filter controls"
```

---

### Task 5: Server-Backed Registration Filters

**Files:**
- Modify: `functions/api/admin/registrations.ts`
- Modify: `functions/__tests__/admin.test.ts`
- Modify: `client/src/components/admin/RegistrationsTable.tsx`
- Modify: `client/src/__tests__/components/admin/RegistrationsTable.test.tsx`

- [ ] **Step 1: Add failing function tests for location and payment filters**

In `functions/__tests__/admin.test.ts`, under `GET /api/admin/registrations`, add:

```ts
it("filters registrations by locationId and paymentState", async () => {
  const mockDb = env.DB as any;
  mockDb.setMockData("registrations", []);

  const request = createMockRequest("GET", "https://example.com/api/admin/registrations?locationId=oakville&paymentState=paid_partial");
  await registrationsListHandler({ request, env });

  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("COALESCE(ps.location_id, 'mississauga') = ?"));
  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("paid_cents > 0"));
  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("paid_cents < o.total_cents"));
});
```

- [ ] **Step 2: Run the function test to verify it fails**

Run:

```bash
npm run test:functions -- --run functions/__tests__/admin.test.ts
```

Expected: FAIL because the endpoint does not support `locationId` or `paymentState`.

- [ ] **Step 3: Update registrations SQL**

In `functions/api/admin/registrations.ts`:

```ts
const locationId = url.searchParams.get("locationId");
const registrationStatus = url.searchParams.get("registrationStatus") ?? url.searchParams.get("status");
const paymentState = url.searchParams.get("paymentState");
const dateFrom = url.searchParams.get("dateFrom");
const dateTo = url.searchParams.get("dateTo");
const sort = url.searchParams.get("sort") ?? "newest";
```

Add filters:

```ts
if (locationId) {
  where.push("COALESCE(ps.location_id, 'mississauga') = ?");
  binds.push(locationId);
}
if (registrationStatus) {
  where.push("r.status = ?");
  binds.push(registrationStatus);
}
if (dateFrom) {
  where.push("date(r.created_at) >= date(?)");
  binds.push(dateFrom);
}
if (dateTo) {
  where.push("date(r.created_at) <= date(?)");
  binds.push(dateTo);
}
```

Wrap the existing SELECT in a CTE so payment lifecycle can be filtered:

```sql
WITH registration_rows AS (
  SELECT
    r.id as registration_id,
    r.status as registration_status,
    r.created_at as created_at,
    r.program_specific_data,
    p.name as program_name,
    p.slug as program_slug,
    ps.age_group as track,
    ps.id as session_id,
    ps.name as session_name,
    ps.day_of_week as session_day_of_week,
    ps.start_time as session_start_time,
    ps.end_time as session_end_time,
    COALESCE(ps.location_id, 'mississauga') as location_id,
    COALESCE(l.display_name, 'Mississauga') as location_name,
    g.full_name as guardian_name,
    g.email as guardian_email,
    g.phone as guardian_phone,
    s.full_name as student_name,
    s.date_of_birth as student_dob,
    s.gender as student_gender,
    pay.status as payment_status,
    pay.amount as payment_amount,
    pay.stripe_payment_intent_id,
    pay.receipt_url,
    o.id as order_id,
    o.status as order_status,
    o.manual_review_reason as order_manual_review_reason,
    o.total_cents as order_total_cents,
    o.amount_due_today_cents as order_amount_due_today_cents,
    o.later_amount_cents as order_later_amount_cents,
    o.later_payment_date as order_later_payment_date,
    COALESCE((SELECT SUM(CASE WHEN p2.status = 'paid' THEN p2.amount ELSE 0 END)
      FROM payments p2 WHERE p2.enrollment_order_id = o.id), 0) as paid_cents
  FROM registrations r
  JOIN programs p ON p.id = r.program_id
  LEFT JOIN program_sessions ps ON ps.id = r.session_id
  LEFT JOIN locations l ON l.id = COALESCE(ps.location_id, 'mississauga')
  JOIN guardians g ON g.id = r.guardian_id
  JOIN students s ON s.id = r.student_id
  LEFT JOIN payments pay ON pay.registration_id = r.id
  LEFT JOIN enrollment_orders o ON o.id = r.enrollment_order_id
  ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
)
SELECT *
FROM registration_rows
${paymentWhere.length ? `WHERE ${paymentWhere.join(" AND ")}` : ""}
${orderBy}
LIMIT 250
```

Build `paymentWhere` before the SQL:

```ts
const paymentWhere: string[] = [];
if (paymentState === "paid_full") paymentWhere.push("paid_cents >= COALESCE(order_total_cents, payment_amount, 0) AND COALESCE(order_total_cents, payment_amount, 0) > 0");
if (paymentState === "paid_partial") paymentWhere.push("paid_cents > 0 AND paid_cents < COALESCE(order_total_cents, payment_amount, 0)");
if (paymentState === "pending") paymentWhere.push("(paid_cents = 0 OR paid_cents IS NULL) AND COALESCE(order_status, registration_status) NOT IN ('cancelled', 'superseded')");
if (paymentState === "failed") paymentWhere.push("payment_status IN ('failed', 'requires_payment_method')");
if (paymentState === "superseded") paymentWhere.push("order_status = 'superseded'");
if (paymentState === "cancelled") paymentWhere.push("registration_status = 'cancelled' OR order_status = 'cancelled'");
```

Build `orderBy`:

```ts
const orderBy =
  sort === "oldest" ? "ORDER BY created_at ASC" :
  sort === "student" ? "ORDER BY student_name COLLATE NOCASE ASC, created_at DESC" :
  sort === "guardian" ? "ORDER BY guardian_name COLLATE NOCASE ASC, created_at DESC" :
  sort === "amount_desc" ? "ORDER BY COALESCE(order_total_cents, payment_amount, 0) DESC, created_at DESC" :
  sort === "amount_asc" ? "ORDER BY COALESCE(order_total_cents, payment_amount, 0) ASC, created_at DESC" :
  "ORDER BY created_at DESC";
```

- [ ] **Step 4: Update `RegistrationsTable` to use `AdminFilterBar`**

In `client/src/components/admin/RegistrationsTable.tsx`, replace independent filter state with:

```tsx
const [filters, setFilters] = useState<AdminFilterState>(DEFAULT_ADMIN_FILTERS);
const queryUrl = useMemo(() => buildAdminQuery("/api/admin/registrations", filters), [filters]);
```

Render:

```tsx
<AdminFilterBar
  value={filters}
  programs={programs}
  locations={locations}
  tracks={tracks.map((value) => ({ value, label: value.replace(/-/g, " ") }))}
  mode="registrations"
  refreshing={loading}
  onChange={setFilters}
  onRefresh={refresh}
/>
```

Add these columns to the table:

```tsx
<th className="text-left py-3 pr-4">Location / Session</th>
```

and row cell:

```tsx
<td className="py-3 pr-4">
  <div className="text-charcoal">{r.location_name ?? "Mississauga"}</div>
  <div className="mt-1 text-xs text-charcoal/55">
    {[r.session_day_of_week, r.session_start_time && r.session_end_time ? `${r.session_start_time}-${r.session_end_time}` : null]
      .filter(Boolean)
      .join(" · ") || r.session_name || "No session"}
  </div>
</td>
```

- [ ] **Step 5: Update registration table tests**

In `client/src/__tests__/components/admin/RegistrationsTable.test.tsx`, update the refresh test to select location/payment filters and expect:

```ts
expect(lastCall).toContain("locationId=oakville");
expect(lastCall).toContain("paymentState=paid_partial");
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run test:functions -- --run functions/__tests__/admin.test.ts
npm test -- --run client/src/__tests__/components/admin/RegistrationsTable.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add functions/api/admin/registrations.ts functions/__tests__/admin.test.ts client/src/components/admin/RegistrationsTable.tsx client/src/__tests__/components/admin/RegistrationsTable.test.tsx
git commit -m "Modernize admin registration filtering"
```

---

### Task 6: Server-Backed Payments Filters

**Files:**
- Modify: `functions/api/admin/orders.ts`
- Modify: `functions/__tests__/admin.test.ts`
- Modify: `client/src/components/admin/PaymentsSummary.tsx`
- Modify: `client/src/__tests__/components/admin/PaymentsSummary.test.tsx`

- [ ] **Step 1: Add failing orders endpoint test**

In `functions/__tests__/admin.test.ts`, add:

```ts
it("filters orders by program, location, payment state, review, and search", async () => {
  vi.mocked(getAdminFromRequest).mockResolvedValue({
    adminUserId: 1,
    email: "admin@example.com",
    name: "Admin",
    role: "admin",
  });
  const mockDb = env.DB as any;
  mockDb.setMockData("enrollment_orders", []);

  const request = createMockRequest("GET", "https://example.com/api/admin/orders?programId=bjj&locationId=oakville&paymentState=failed&review=required&q=hassan");
  const { onRequestGet: ordersHandler } = await import("../api/admin/orders");
  await ordersHandler({ request, env });

  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("r.program_id = ?"));
  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("COALESCE(ps.location_id, 'mississauga') = ?"));
  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("o.manual_review_status = ?"));
  expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining("latest_payment_status IN ('failed', 'requires_payment_method')"));
});
```

- [ ] **Step 2: Run the function test to verify it fails**

Run:

```bash
npm run test:functions -- --run functions/__tests__/admin.test.ts
```

Expected: FAIL because `/api/admin/orders` does not support those filters yet.

- [ ] **Step 3: Update orders SQL**

In `functions/api/admin/orders.ts`, add query params:

```ts
const programId = url.searchParams.get("programId");
const locationId = url.searchParams.get("locationId");
const paymentState = url.searchParams.get("paymentState");
const q = url.searchParams.get("q");
const dateFrom = url.searchParams.get("dateFrom");
const dateTo = url.searchParams.get("dateTo");
const sort = url.searchParams.get("sort") ?? "newest";
```

Add filters:

```ts
if (programId) {
  where.push("r.program_id = ?");
  binds.push(programId);
}
if (locationId) {
  where.push("COALESCE(ps.location_id, 'mississauga') = ?");
  binds.push(locationId);
}
if (q) {
  where.push("(g.full_name LIKE ? OR g.email LIKE ? OR s.full_name LIKE ? OR CAST(o.id AS TEXT) LIKE ?)");
  binds.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
}
if (dateFrom) {
  where.push("date(o.created_at) >= date(?)");
  binds.push(dateFrom);
}
if (dateTo) {
  where.push("date(o.created_at) <= date(?)");
  binds.push(dateTo);
}
```

Return program and location rollups:

```sql
GROUP_CONCAT(DISTINCT p.name) as program_names,
GROUP_CONCAT(DISTINCT COALESCE(l.display_name, 'Mississauga')) as location_names,
GROUP_CONCAT(DISTINCT ps.age_group) as tracks,
```

Use a CTE named `order_rows` and filter lifecycle states after aggregation:

```sql
WITH order_rows AS (
  SELECT
    o.id as order_id,
    o.status as order_status,
    o.manual_review_status,
    o.manual_review_reason,
    o.last_payment_error,
    o.last_payment_attempt_at,
    o.total_cents,
    o.amount_due_today_cents,
    o.later_amount_cents,
    o.later_payment_date,
    o.stripe_payment_intent_id,
    o.second_stripe_payment_intent_id,
    o.created_at,
    g.full_name as guardian_name,
    g.email as guardian_email,
    COUNT(DISTINCT r.id) as registration_count,
    GROUP_CONCAT(DISTINCT s.full_name) as student_names,
    GROUP_CONCAT(DISTINCT p.name) as program_names,
    GROUP_CONCAT(DISTINCT COALESCE(l.display_name, 'Mississauga')) as location_names,
    GROUP_CONCAT(DISTINCT ps.age_group) as tracks,
    COALESCE((SELECT SUM(CASE WHEN pay.status = 'paid' THEN pay.amount ELSE 0 END)
      FROM payments pay WHERE pay.enrollment_order_id = o.id), 0) as paid_cents,
    (SELECT MAX(pay.status) FROM payments pay WHERE pay.enrollment_order_id = o.id) as latest_payment_status,
    MIN(r.id) as first_registration_id
  FROM enrollment_orders o
  LEFT JOIN guardians g ON g.id = o.guardian_id
  LEFT JOIN registrations r ON r.enrollment_order_id = o.id
  LEFT JOIN programs p ON p.id = r.program_id
  LEFT JOIN program_sessions ps ON ps.id = r.session_id
  LEFT JOIN locations l ON l.id = COALESCE(ps.location_id, 'mississauga')
  LEFT JOIN students s ON s.id = r.student_id
  ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
  GROUP BY o.id
)
SELECT *
FROM order_rows
${paymentWhere.length ? `WHERE ${paymentWhere.join(" AND ")}` : ""}
${orderBy}
LIMIT 250
```

- [ ] **Step 4: Update `PaymentsSummary` to own filters**

In `client/src/components/admin/PaymentsSummary.tsx`, import and use:

```tsx
const [rows, setRows] = React.useState<PaymentRow[]>(payments);
const [filters, setFilters] = React.useState<AdminFilterState>(DEFAULT_ADMIN_FILTERS);
const [refreshing, setRefreshing] = React.useState(false);
const queryUrl = React.useMemo(() => buildAdminQuery("/api/admin/orders", filters), [filters]);

React.useEffect(() => setRows(payments), [payments]);

async function refresh() {
  setRefreshing(true);
  try {
    const res = await fetch(queryUrl);
    const json = (await res.json().catch(() => null)) as { orders?: PaymentRow[] } | null;
    setRows(json?.orders ?? []);
  } finally {
    setRefreshing(false);
  }
}
```

Render `AdminFilterBar` above the payments table with `mode="payments"`.

- [ ] **Step 5: Update payment summary tests**

In `client/src/__tests__/components/admin/PaymentsSummary.test.tsx`, add:

```tsx
it("refreshes orders with payment and review filters", async () => {
  const user = userEvent.setup();
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ orders: [] }) }));
  (globalThis as any).fetch = fetchMock;

  render(<PaymentsSummary payments={[]} showSuperseded={false} onShowSupersededChange={() => {}} />);

  await user.click(screen.getByRole("button", { name: /refresh/i }));

  expect(fetchMock.mock.calls.at(-1)?.[0]).toContain("/api/admin/orders");
});
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
npm run test:functions -- --run functions/__tests__/admin.test.ts
npm test -- --run client/src/__tests__/components/admin/PaymentsSummary.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add functions/api/admin/orders.ts functions/__tests__/admin.test.ts client/src/components/admin/PaymentsSummary.tsx client/src/__tests__/components/admin/PaymentsSummary.test.tsx
git commit -m "Modernize admin payment filtering"
```

---

### Task 7: Admin Dashboard Integration and Visual Polish

**Files:**
- Modify: `client/src/pages/admin/AdminDashboard.tsx`
- Modify: `client/src/__tests__/integration/admin-dashboard.test.tsx`
- Modify: `client/src/__tests__/integration/mocks/handlers.ts`

- [ ] **Step 1: Update integration mock data**

In `client/src/__tests__/integration/mocks/handlers.ts`, ensure registration/order mocks include:

```ts
location_id: "oakville",
location_name: "Oakville",
session_name: "Oakville Boys 7-13 - Monday",
session_day_of_week: "Monday",
session_start_time: "14:30",
session_end_time: "15:30",
program_names: "Brazilian Jiu-Jitsu",
location_names: "Oakville",
tracks: "boys-7-13",
```

- [ ] **Step 2: Add integration expectations**

In `client/src/__tests__/integration/admin-dashboard.test.tsx`, add:

```tsx
it("shows registration and payment location context", async () => {
  const user = userEvent.setup();
  renderDashboardAt("/admin/dashboard/registrations");

  await user.click(screen.getByRole("tab", { name: /registrations/i }));
  expect(await screen.findByText("Oakville")).toBeInTheDocument();
  expect(screen.getByText(/Monday/i)).toBeInTheDocument();

  await user.click(screen.getByRole("tab", { name: /payments/i }));
  expect(await screen.findByText(/Orders & Payments/i)).toBeInTheDocument();
  expect(screen.getByText(/Oakville/i)).toBeInTheDocument();
});
```

- [ ] **Step 3: Keep dashboard data ownership simple**

In `client/src/pages/admin/AdminDashboard.tsx`:
- Keep the initial `/api/admin/registrations` and `/api/admin/orders` fetches.
- Pass the initial arrays to the table components.
- Do not duplicate filter state in `AdminDashboard`.
- Keep `showSupersededRegistrations` and `showSupersededPayments` only if needed for the old tab-level behavior; otherwise let `AdminFilterBar` own superseded state and remove those two dashboard states.

- [ ] **Step 4: Run integration test**

Run:

```bash
npm test -- --run client/src/__tests__/integration/admin-dashboard.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/admin/AdminDashboard.tsx client/src/__tests__/integration/admin-dashboard.test.tsx client/src/__tests__/integration/mocks/handlers.ts
git commit -m "Integrate modern admin operations filters"
```

---

### Task 8: Full Verification and Production Release

**Files:**
- Verify only; no planned source edits.

- [ ] **Step 1: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit code 0.

- [ ] **Step 2: Run focused client tests**

Run:

```bash
npm test -- --run \
  client/src/__tests__/pages/RegistrationHub.programCards.test.tsx \
  client/src/__tests__/components/registration/OrderSummaryCard.test.tsx \
  client/src/__tests__/components/admin/AdminFilterBar.test.tsx \
  client/src/__tests__/components/admin/RegistrationsTable.test.tsx \
  client/src/__tests__/components/admin/PaymentsSummary.test.tsx \
  client/src/__tests__/integration/admin-dashboard.test.tsx
```

Expected: all selected tests pass.

- [ ] **Step 3: Run function tests**

Run:

```bash
npm run test:functions
```

Expected: all function tests pass.

- [ ] **Step 4: Build**

Run:

```bash
npm run build
```

Expected: Vite build succeeds and creates `dist/`.

- [ ] **Step 5: Browser verification**

Run the dev server:

```bash
npm run dev -- --host 127.0.0.1
```

Verify in browser:
- `/register` shows two clean program action cards without the old undertext.
- `/programs/bjj` shows Oakville address `2200 Speers Road` and schedule `Monday and Wednesday 2:30 to 3:30 PM`.
- `/programs/bjj/register` location selector shows Oakville with `2200 Speers Road, Oakville`.
- `/admin/dashboard/registrations` can filter by Oakville and payment state.
- `/admin/dashboard/payments` can filter by payment state and review state.

- [ ] **Step 6: Apply production migration**

Run:

```bash
npx wrangler d1 execute sunnahskills-admin-v3 --remote --file=db/migrations/014_update_oakville_bjj_location_schedule.sql
```

Expected: success.

- [ ] **Step 7: Commit any final verification-only fixes**

If verification required code changes:

```bash
git add <changed-files>
git commit -m "Stabilize admin operations filters"
```

If no further code changes were needed, do not create an empty commit.

- [ ] **Step 8: Push**

Run:

```bash
git push origin main
```

Expected: push succeeds.

- [ ] **Step 9: Confirm production deploy**

Check the live site:

```bash
curl -s https://sunnahskills.com | rg -o '/assets/index-[^"]+\\.js' | head -1
```

Compare the live asset to local `dist/assets/index-*.js`. If the asset hash does not match after the normal Pages deployment window, run a clean manual Pages deploy from a temporary workspace, then re-check the live asset.

---

## Self-Review

**Spec coverage**
- Removed the disliked BJJ/Archery undertext in Task 1.
- Planned a card/tile replacement for the registration hub in Task 1.
- Updated Oakville address to `2200 Speers Road, Oakville` in Task 2.
- Updated Oakville timing to Monday/Wednesday `2:30-3:30 PM` in Task 2.
- Kept Oakville as a location under BJJ, not a new BJJ program, in Task 2.
- Ensured parent-facing registration UI shows semester pricing, never per-class math, in Task 3.
- Modernized admin registration filtering in Tasks 4, 5, and 7.
- Modernized admin payments filtering in Tasks 4, 6, and 7.
- Included production data verification and deploy verification in Task 8.

**Placeholder scan**
- No `TBD`, `TODO`, `implement later`, or “similar to” steps remain.
- Each code-changing step includes concrete code or exact SQL.
- Each verification step includes exact commands and expected results.

**Type consistency**
- `AdminFilterState`, `AdminProgramOption`, `AdminLocationOption`, and `AdminTrackOption` are defined before use.
- `buildAdminQuery` is used by both admin tables.
- Payment state values match `summarizePaymentLifecycle` variants: `paid_full`, `paid_partial`, `pending`, `failed`, `superseded`, `cancelled`.
