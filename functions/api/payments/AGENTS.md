<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# payments

## Purpose
Stripe payment integration endpoints. Creates PaymentIntents, subscriptions, and handles webhooks.

## Key Files

| File | Route | Description |
|------|-------|-------------|
| `create-intent.ts` | POST /api/payments/create-intent | One-time payment intent |
| `create-subscription.ts` | POST /api/payments/create-subscription | BJJ recurring subscription |
| `webhook.ts` | POST /api/payments/webhook | Stripe webhook handler |

## Payment Flows

### One-Time Payment (Archery, Outdoor, Bullyproofing)
```
POST /api/payments/create-intent
  ├── Calculate total (price + fee - discounts)
  ├── Create Stripe PaymentIntent
  └── Return { clientSecret, paymentIntentId }
```

### Subscription (BJJ)
```
POST /api/payments/create-subscription
  ├── Get or create Stripe Customer
  ├── Apply sibling coupon if applicable
  ├── Apply valid promo coupon from D1 if applicable
  ├── Create Stripe Subscription
  └── Return { clientSecret } from invoice
```

If subscriptions are not configured, the subscription endpoint returns `subscriptions_not_configured` and the client falls back to the one-time flow.

### Webhook Events
- `invoice.paid` - Update payment status, send email
- `payment_intent.succeeded` - Confirm payment
- `payment_intent.payment_failed` - Mark failed, notify
- `invoice.payment_failed` - Mark failed on subscription renewals

## For AI Agents

### Working In This Directory
- Always calculate server-side (don't trust client totals)
- Validate registration exists before creating payment
- Handle Stripe errors gracefully
- Idempotent operations for webhooks

### Security
- Webhook signature verification with `STRIPE_WEBHOOK_SECRET`
- Never expose `STRIPE_SECRET_KEY` to client
- Ignore duplicate webhook deliveries once a payment is already marked paid

<!-- MANUAL: -->
