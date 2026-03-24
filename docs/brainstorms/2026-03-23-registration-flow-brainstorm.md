---
date: 2026-03-23
topic: registration-flow
---

# Registration Flow Brainstorm

**Purpose:** Talk through the new registration flow with the stakeholder.
**Status:** Aligned — stakeholder decisions captured below.

---

## Stakeholder Decisions (confirmed)

### Entry points
- **Both** program pages and central Register hub. Parents can start from a program (e.g. BJJ) or from `/register`; program pages can deep-link into the cart.

### Price flexibility (no Stripe Product changes)
- Program totals must be **easily changeable** without editing Stripe Products.
- **Solution:** Prices live in **D1 `program_prices`** (amount, registration_fee, classes_in_semester). Admin panel edits these; server computes totals and creates Stripe `PaymentIntent` with the computed amount. No need to touch Stripe when changing program prices.

### Info saved for next semester
- Guardian and child data should **persist** so parents don't re-enter everything next semester.
- **Solution:** `guardian_accounts` + `saved_students`; magic-link auth so returning parents have their profiles ready.

### Saved children — easy selection
- Store **standard child info** (name, DOB, etc.) so parents can quickly **select** "this child" when registering.
- **Solution:** Saved children list linked to guardian account; cart step: "Add child" → pick from saved list or add new; selected child auto-fills the line item.

### Cart — multi-child, multi-program, single payment
- Parents can register **multiple children** in **multiple programs** and pay **once**.
- **Solution:** Cart with line items `{ childRef, session/track, priceId }[]`; single `PaymentIntent` for cart total; webhook marks all registrations paid.

### Auth — no passwords, email link
- **No passwords.** Sign-in via **email link** (magic link) so returning parents can access saved info.
- **Solution:** Magic link flow: enter email → send link → click → session cookie; authenticated parents see saved children and can resume/cart.

---

## Stripe CLI Snapshot (today)

- **Products:** None created yet
- **Prices:** None created yet (one-time intents use D1 `program_prices.amount`; no Stripe Price needed for variable totals)
- **Mode:** Test + Live keys configured

**Note:** For **one-time** semester payments, we pass `amount` to `PaymentIntent` from D1. For **subscriptions** (if BJJ uses them), we’d need Stripe Prices; otherwise keep amount-driven PaymentIntents.

---

## Flow Summary

1. **Entry:** Program page or `/register` hub
2. **Auth (optional early):** Magic link to unlock saved children
3. **Cart:** Add children (saved or new) → add programs/sessions → review
4. **Waivers:** One or per-child (TBD)
5. **Pay:** Single checkout; server computes total from D1; Stripe PaymentIntent with that amount
6. **Next semester:** Same guardian/children; just add new programs to cart

---

## Next Steps

→ Implement per plan order
→ Admin UI for editing `program_prices` (amount, fee, semester)
→ Magic link API + saved_students CRUD
