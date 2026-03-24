# Stripe Setup

## Keys needed

| Variable | Value |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `CRON_SECRET` (optional) | Random string — protects `POST /api/payments/collect-order-balance` for automated second charges |

Set `VITE_STRIPE_PUBLISHABLE_KEY` in a `.env` file at the project root for local dev. Set the other two as **Cloudflare Pages secrets** (never in `wrangler.toml`):

```bash
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
```

For local webhook testing, the `STRIPE_WEBHOOK_SECRET` should come from `stripe listen`, not from a long-lived dashboard secret.

For local worker testing in this repo, the validated path is:

```bash
npm run build
node scripts/dev-test.mjs
```

## Stripe dashboard setup

1. Create a Stripe account at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Collect your API keys from **Developers → API keys**
3. For test mode, use keys prefixed `pk_test_` / `sk_test_`

## Pricing source of truth

Launch pricing is computed from D1, not Stripe product metadata:

- `program_prices`
- `semesters`
- `shared/orderPricing.ts`

Stripe is used for charging and payment-method storage. It is not the authoritative catalog/pricing store.

## Live payment model

Launch checkout is **order-based PaymentIntent**, not Stripe Subscriptions.

`POST /api/payments/create-order-intent`:

1. loads the `enrollment_order`
2. recomputes pricing from D1
3. applies sibling and promo-code math server-side
4. creates or reuses a Stripe `Customer`
5. creates the first Stripe `PaymentIntent`
6. stores Stripe ids and order metadata back on the order

If the order uses `payment_choice = 'plan'`, the remaining balance stays on the order and is collected later from the saved payment method.

## Discounts

Sibling and promo discounts are applied before the PaymentIntent is created and written back to D1 order/payment metadata for admin reconciliation.

## Multi-line family cart

- `POST /api/payments/create-order-intent` — first PaymentIntent for the batch; creates a Stripe **Customer**, sets `setup_future_usage=off_session`, and stores `metadata.enrollment_order_id` + `metadata.registration_ids`.
- Webhook (`payment_intent.succeeded`) activates **all** registrations in the batch and sets the customer’s **default payment method** when possible.
- `POST /api/payments/collect-order-balance` — **Bearer `CRON_SECRET`**; finds `partially_paid` orders past `later_payment_date` and confirms an **off-session** PaymentIntent for the remainder. Call this on a schedule you control (e.g. daily); the app UI does not mention this to families.

`POST /api/payments/collect-order-balance` is protected by **Bearer `CRON_SECRET`** and attempts the off-session later charge on or after `later_payment_date`.

## Webhook setup

The webhook endpoint is: `https://your-domain/api/payments/webhook`

Register it in Stripe:

1. Go to **Developers → Webhooks → Add endpoint**
2. URL: `https://sunnahskills.pages.dev/api/payments/webhook`
3. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** and add it as a Cloudflare secret:

```bash
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
```

For local webhook testing:

```bash
stripe listen --forward-to http://localhost:8788/api/payments/webhook
```

The worker is authoritative for webhook handling. Duplicate `payment_intent.succeeded` events are ignored once a payment is already marked paid, and `payment_intent.payment_failed` marks the order for manual review.

## Appearance theme

The Stripe Elements `appearance` object is in `client/src/lib/stripe.ts`. It uses:

- `theme: "night"`
- Background: `#1A1A1A` (charcoal)
- Text: `#F5F0E8` (cream)
- Primary/accent: `#CE5833` (clay)
- Font: Plus Jakarta Sans

Update this file to change how the payment form looks.

## Test cards

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | 3DS auth required |
| `4000 0000 0000 9995` | Declined |

Any future expiry date and any 3-digit CVC.
