---
date: 2026-03-29
topic: unpaid-checkout-lifecycle
---

# Unpaid Checkout Lifecycle

## What We're Building
We want the registration checkout to behave like a single living checkout, not a pile of abandoned payment attempts. If a parent starts checkout, closes the page, edits the cart, or retries payment, the system should keep exactly one active unpaid order for that guardian and cart. Older unfinished attempts should stop being usable.

The desired user experience is simple: parents can come back and continue where they left off, and if they intentionally restart with different cart details, the old unpaid attempt is retired automatically. Successful payments must remain untouched, and audit history must still exist for staff.

## Why This Approach
We considered three directions: reuse-only, full redesign of when PaymentIntents are created, and a single-active-unpaid-checkout model. Reuse-only is safer than today but still leaves stale unpaid orders around. Moving PaymentIntent creation later would be a deeper architectural rewrite and still would not solve duplicate orders by itself.

The best fit is a single-active-unpaid-checkout model. It solves the product problem directly, keeps the implementation incremental, and preserves operational traceability.

## Key Decisions
- Keep one active unpaid order per guardian/cart fingerprint: this matches the intended product behavior.
- Do not hard-delete old unpaid orders: mark them `superseded` or `abandoned` instead so staff still have an audit trail.
- Cancel superseded Stripe PaymentIntents when safe: unfinished Stripe checkouts should not remain available.
- Reuse Stripe customers per guardian account instead of per order: this reduces Stripe clutter and better matches household identity.
- Keep PaymentIntent creation at payment setup time: this avoids a larger rewrite and keeps the checkout stable.
- Treat successful payment as the boundary: paid orders are immutable and never superseded automatically.

## Open Questions
- Should stale unpaid orders auto-expire after a fixed window like 24 hours, even if no replacement order is created?
- Should admins be allowed to manually reactivate a superseded unpaid order, or should superseded always be terminal?
- Should we expose superseded orders in admin by default, or hide them behind a filter?

## Next Steps
→ Add new order lifecycle statuses for unfinished checkout replacement.
→ Reuse or supersede unpaid orders based on a cart fingerprint comparison.
→ Cancel old Stripe PaymentIntents when a replacement unpaid checkout is created.
→ Reuse Stripe customer IDs at the guardian-account level.
→ Add tests for restart, cart-change, supersede, and webhook-ignore behavior.
