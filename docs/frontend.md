# Frontend Architecture

## Overview

The frontend is a **React 18 SPA** built with Vite and deployed as static assets to Cloudflare Pages. All routing is client-side via Wouter. There is no SSR. API calls go to `/api/*` which are served by Cloudflare Pages Functions from the same origin — no CORS needed.

## Entry points

| File | Role |
|---|---|
| `index.html` | HTML shell, loads Google Fonts, mounts `#root` |
| `client/src/main.tsx` | Renders `<App />` into `#root` |
| `client/src/App.tsx` | Providers tree + Router |

## Provider stack

The app wraps everything in this provider order (outermost first):

```
QueryClientProvider      ← TanStack Query (data fetching, caching)
  TooltipProvider        ← Radix UI tooltip context
    StudioProvider       ← Stakeholder Studio state + sync
      Toaster            ← Toast notifications
      Router             ← Navigation + Footer + all page routes
      StudioPanel        ← Studio overlay UI (sits outside router)
```

## Routing

Routing uses **Wouter**, a lightweight hash-free client router. All routes are defined in `App.tsx` as a flat `<Switch>`:

```tsx
<Switch>
  <Route path="/"                            component={Home} />
  <Route path="/about"                       component={About} />
  <Route path="/programs"                    component={Programs} />
  <Route path="/register"                    component={RegistrationHub} />
  <Route path="/programs/bjj"                component={BJJProgram} />
  <Route path="/programs/bjj/register"       component={BJJRegistration} />
  {/* ... more programs ... */}
  <Route path="/registration/success"        component={RegistrationSuccess} />
  <Route path="/registration/waitlist"       component={RegistrationWaitlist} />
  <Route path="/schedule"                    component={Schedule} />
  <Route path="/techniques"                  component={TechniqueLibrary} />
  <Route path="/contact"                     component={Contact} />
  <Route path="/testimonials"                component={Testimonials} />
  <Route path="/admin"                       component={AdminLogin} />
  <Route path="/admin/dashboard"             component={AdminDashboard} />
  <Route path="/admin/sequences"             component={AdminSequences} />
  <Route                                     component={NotFound} />
</Switch>
```

Cloudflare Pages is configured to serve `index.html` for all routes (SPA fallback).

## Design system (`components/brand/`)

All reusable brand components are in `components/brand/`. New pages should use these exclusively — do not reach for shadcn/ui primitives directly for brand-facing UI.

### Components

| Component | Props | Notes |
|---|---|---|
| `ClayButton` | `className`, `onClick`, `children` | Primary CTA, clay fill, cream text. Adapts to dark/light surface via `className` |
| `OutlineButton` | `className`, `onClick`, `children` | Outlined secondary action |
| `MagneticButton` | `className`, `onClick`, `children` | Magnetic cursor hover effect via mouse tracking |
| `DarkCard` | `className`, `children` | Charcoal surface card with border, cream text |
| `PremiumCard` | `className`, `children` | Light cream card, shadow, padding |
| `TelemetryCard` | `value`, `label`, `suffix?`, `accent?` | Metric display (big number + label) |
| `SectionHeader` | `eyebrow`, `title`, `subtitle?`, `align?` | Section heading with JetBrains Mono eyebrow label |
| `StatusDot` | `status` | Color-coded dot for enrollment statuses |

### Usage pattern

```tsx
import { ClayButton } from "@/components/brand/ClayButton";
import { DarkCard } from "@/components/brand/DarkCard";
import { SectionHeader } from "@/components/brand/SectionHeader";

<SectionHeader eyebrow="Programs" title="Train with purpose." />
<DarkCard>
  <p>Content on dark surface</p>
  <ClayButton>Register Now</ClayButton>
</DarkCard>
```

## CSS / Tailwind

Custom tokens are added to `tailwind.config.ts`:

```js
colors: {
  cream:   "#F5F0E8",
  charcoal:"#1A1A1A",
  moss:    "#3D5A3E",
  clay:    "#CE5833",
}
fontFamily: {
  heading:    ["Outfit", ...],
  sans:       ["Plus Jakarta Sans", ...],
  serif:      ["Cormorant Garamond", ...],
  "mono-label": ["JetBrains Mono", ...],
}
```

All custom values are available as Tailwind utilities: `bg-cream`, `text-clay`, `font-heading`, `font-mono-label`, etc.

## Data fetching

API calls use **TanStack Query v5** (`@tanstack/react-query`).

```tsx
import { useQuery } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ["programs"],
  queryFn: () => fetch("/api/programs").then(r => r.json()),
});
```

`queryClient` is configured in `client/src/lib/queryClient.ts` with `staleTime: 60_000` and `retry: 1`.

For mutations (registration submit, promo code validation):

```tsx
import { useMutation } from "@tanstack/react-query";

const mutation = useMutation({
  mutationFn: (data) => fetch("/api/register", { method: "POST", body: JSON.stringify(data) }).then(r => r.json()),
  onSuccess: (data) => { /* redirect */ },
});
```

## Registration wizard

The wizard is assembled in `components/registration/RegistrationWizard.tsx`. It renders the active step component and handles back/next navigation. Each step receives `draft`, `updateDraft`, and step-specific props.

Step components:

| File | Step |
|---|---|
| `StepGuardianInfo.tsx` | 1 — Parent/guardian details |
| `StepStudentInfo.tsx` | 2 — Student details |
| `StepProgramDetails.tsx` | 3 — Program-specific fields (slug-branched) |
| `StepWaivers.tsx` | 4 — Consent + signature |
| `StepPayment.tsx` | 5 — Order summary + Stripe Elements |

Form controls in `FormControls.tsx`:
- `RadioGroup` — styled radio inputs with hover states
- `CheckboxGroup` — styled multi-select checkboxes
- `SelectField` — dropdown select with label and error

Step transition animations use `opacity` + `translateY` CSS transitions defined inline in `RegistrationWizard.tsx`.

`ProgramRegistrationPage.tsx` wraps the wizard for each program route, creates the registration first, then boots payment. BJJ attempts subscription checkout first and gracefully falls back to a one-time intent when the server reports `subscriptions_not_configured`.

## Stripe integration (client-side)

`client/src/lib/stripe.ts` exports:
- `stripePromise` — `loadStripe(VITE_STRIPE_PUBLISHABLE_KEY)`
- `stripeAppearance` — Stripe Elements appearance (night theme, charcoal/cream/clay)

`PaymentProvider.tsx` wraps children in `<Elements stripe={stripePromise} options={{ appearance }}>`.

`PaymentForm.tsx` renders `<PaymentElement />` and calls `stripe.confirmPayment()` on submit. The sibling discount and promo code logic live server-side, not in the client.

## Navigation (`components/Navigation.tsx`)

The navbar is a fixed floating pill with backdrop blur. It adapts between two colour states:

- **Dark glass** (homepage at top): `bg-charcoal/25 backdrop-blur text-cream`
- **Light glass** (scrolled or any page other than homepage): `bg-white/80 backdrop-blur text-charcoal`

The transition condition is `scrolled || !isHome`.

The **Programs** control opens a **hover/focus** panel (desktop) with links to all four program pages plus **All programs** → `/programs` (no dead gap between trigger and panel). Mobile uses a disclosure. Primary registration CTA → `/register` (hub) or `/programs/bjj/register` from program pages.

Mobile: hamburger menu with a charcoal overlay panel.

## Program imagery (`components/programs/`)

| File | Purpose |
|---|---|
| `ProgramVisual.tsx` | Card / compact hero: photo from `programConfig.heroImage`, `object-position`, scrim, chips |
| `ProgramPageHeroMedia.tsx` | Full-bleed background image + gradients for program **page headers** (`BJJProgram`, etc.) |

Used on **`Programs.tsx`** (listing cards), **`Home.tsx`** curriculum cards, and individual **`pages/programs/*`** headers (text column only; no duplicate photo column).

## GrappleMap 3D viewer (`components/grapplemap/`)

| File | Purpose |
|---|---|
| `TechniqueViewer.tsx` | Suspense wrapper + default `sequencePath`; used on Home, technique library, modals |
| `MannequinScene.tsx` | Canvas, two mannequins, playback overlay, fetches JSON by path |
| `grapplemapScene.tsx` | Alternate line-segment skeleton scene (**unused** in routes) |

**Runtime data** is served as static JSON under **`client/public/data/`** (e.g. `library/sequences/*.json`, manifests).  
**Source-of-truth text DB** for extraction pipelines is vendored at **`GrappleMap/GrappleMap.txt`** (see `docs/technique-library.md`, `scripts/`).

The **TechniqueLibrary** page (`pages/TechniqueLibrary.tsx`) browses the catalog with an embedded `TechniqueViewer`. **Home** (`Home.tsx`) also embeds `TechniqueViewer` for the curriculum section.

## Studio overlay (`studio/`)

See [`studio.md`](studio.md) for full documentation. From a frontend architecture standpoint:

- `StudioProvider` wraps the entire app and is always mounted
- Studio UI is only rendered when `?studio=...` is present in the URL
- `StudioBlock` and `StudioText` are zero-cost wrappers when Studio is disabled
- `autoTextStudio.ts` runs a one-time DOM scan on mount to assign IDs to unattributed text nodes

## Testing

Test files live in `client/src/__tests__/`. Run with:

```bash
npm test
npm run test:watch
```

Vitest is configured in `vitest.config.ts` with `jsdom` environment. Setup file is `vitest.setup.ts` (imports `@testing-library/jest-dom`).

Test utilities in `client/src/__tests__/test-utils.tsx` provide a custom `render` wrapper that includes all required providers.

## Build output

```bash
npm run build   # → dist/
```

Vite outputs a hashed asset bundle. `index.html` is the SPA shell. All assets are under `dist/assets/`. The Cloudflare Pages build pipeline runs this command automatically.

## Path aliases

`@` maps to `client/src/` — configured in both `vite.config.ts` and `tsconfig.json`.

```tsx
import { ClayButton } from "@/components/brand/ClayButton";
import { useRegistration } from "@/hooks/useRegistration";
```
