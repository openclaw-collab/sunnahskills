## Stripe (Elements + webhooks)

### Client-side (Elements)

- Uses in-app Stripe Elements (no redirect checkout).
- Publishable key is read from `STRIPE_PUBLISHABLE_KEY`.

### Server-side

Endpoints:

- `POST /api/payments/create-intent` — creates PaymentIntent based on DB pricing for a registration.
- `POST /api/payments/webhook` — verifies signature and updates payment/registration status.

Required secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Webhook configuration

In Stripe Dashboard:

- Endpoint URL: `https://<your-site>/api/payments/webhook`
- Events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `invoice.paid` (for subscriptions)

