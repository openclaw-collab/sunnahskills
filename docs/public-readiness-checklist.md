# Public Readiness Checklist

## In Progress

- Technique library:
  - Fix fullscreen and modal parity.
  - Replace brittle public technique picks with coherent BJJ sequences.
  - Correct mislabeled techniques and normalize public tags.
  - Ensure submissions visibly end in a tap.
- Motion system:
  - Audit every public page and admin entry surface.
  - Rebuild the About timeline with alternating left/right reveals.
  - Finish Framer Motion pass for program pages, registration pages, and route transitions.
- Homepage and programs:
  - Revamp homepage program cards.
  - Align each program hero with the actual discipline.
  - Clean up public copy, footer/legal placeholders, and internal phrasing.
- Registration and Stripe:
  - Harden client and server validation.
  - Verify worker-mode registration flows against local D1.
  - Verify one-time and recurring Stripe behavior, plus webhook handling.
- Runtime and admin:
  - Reduce public-facing runtime warnings.
  - Clean up DOM nesting issues in shared shells.
  - Polish accessible admin entry points and sequence-builder flows.

## Verification Before Public Launch

- `npm run typecheck`
- `npm run build`
- Worker preview with local D1 on `http://localhost:8788`
- Registration success, cancel, pending, waitlist, and malformed-input checks
- Admin login and sequence-builder CRUD checks
- Technique library modal and fullscreen checks
- Public page animation and copy review across desktop and mobile

