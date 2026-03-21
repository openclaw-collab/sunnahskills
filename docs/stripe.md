# Stripe Setup

## Keys needed

| Variable | Value |
|---|---|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` or `pk_live_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |

Set `VITE_STRIPE_PUBLISHABLE_KEY` in a `.env` file at the project root for local dev. Set the other two as **Cloudflare Pages secrets** (never in `wrangler.toml`):

```bash
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
```

For local webhook testing, the `STRIPE_WEBHOOK_SECRET` should come from `stripe listen`, not from a long-lived dashboard secret.

## Stripe dashboard setup

1. Create a Stripe account at [dashboard.stripe.com](https://dashboard.stripe.com)
2. Collect your API keys from **Developers → API keys**
3. For test mode, use keys prefixed `pk_test_` / `sk_test_`

## One-time payments (Archery, Outdoor, Bullyproofing)

No Stripe dashboard config needed for one-time payments — `PaymentIntent` amounts are calculated server-side from the `program_prices` table.

## Recurring subscriptions (BJJ)

BJJ uses Stripe Subscriptions. To enable live subscriptions:

1. In the Stripe dashboard, create a **Product** for BJJ (e.g. "BJJ Monthly Tuition")
2. Create a **Price** under that product (e.g. $120/month, $80/month per age group)
3. Copy the Price ID (`price_...`)
4. Update the `program_prices` row for BJJ in D1 — set the `metadata` JSON field:

```json
{ "stripe_price_id": "price_1234567890" }
```

Example D1 command:

```bash
npx wrangler d1 execute sunnahskills-admin-v2 --command \
  "UPDATE program_prices SET metadata = '{\"stripe_price_id\": \"price_ABC123\"}' WHERE program_id = 'bjj' AND age_group = 'kids';"
```

If `stripe_price_id` is absent from the metadata, or `STRIPE_SECRET_KEY` is missing, the subscription endpoint returns `{ error: "subscriptions_not_configured" }` and the client falls back to a one-time PaymentIntent.

The admin price editor validates `stripe_price_id` values before saving them, so malformed IDs are rejected early instead of failing at checkout.

## Sibling discount

A Stripe Coupon `SIBLING_10PCT` (10% off, `forever` duration) is auto-created on first use by `create-subscription.ts`. It is retrieved by ID on subsequent uses. No manual Stripe dashboard action needed.

For one-time payments, the 10% sibling discount is calculated in `create-intent.ts` before creating the PaymentIntent (no Stripe coupon involved).

Valid promo codes are now honored in both payment flows:
- One-time checkout applies the discount in D1 before the PaymentIntent is created.
- Subscriptions create a one-time Stripe coupon from the matching D1 discount row and attach it to the subscription.

## Webhook setup

The webhook endpoint is: `https://your-domain/api/payments/webhook`

Register it in Stripe:

1. Go to **Developers → Webhooks → Add endpoint**
2. URL: `https://prototype.sunnahskills.pages.dev/api/payments/webhook`
3. Events to listen for:
   - `payment_intent.succeeded`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the **Signing secret** and add it as a Cloudflare secret:

```bash
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
```

For local webhook testing:

```bash
stripe listen --forward-to http://localhost:8788/api/payments/webhook
```

The worker is authoritative for webhook handling. Duplicate `payment_intent.succeeded` events are ignored once a payment is already marked `paid`, and `invoice.payment_failed` now marks subscription payments as failed.

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
