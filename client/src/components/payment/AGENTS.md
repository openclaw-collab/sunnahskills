<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-18 | Updated: 2026-03-18 -->

# payment

## Purpose
Stripe payment integration components. Wraps Stripe Elements for secure card input and payment processing.

## Key Files

| File | Description |
|------|-------------|
| `PaymentProvider.tsx` | Stripe Elements provider wrapper |
| `PaymentForm.tsx` | Card input form with submit handling |

## Payment Flow

1. **Registration** → POST `/api/register` → Returns `registrationId`
2. **Create Intent** → POST `/api/payments/create-intent` or `/create-subscription` → Returns `clientSecret`
3. **Mount Elements** → `<PaymentForm>` loads with `clientSecret`
4. **Confirm** → `stripe.confirmPayment()` or `confirmCardPayment()`
5. **Redirect** → On success → `/registration/success?rid={id}`

BJJ tries `/api/payments/create-subscription` first and falls back to `/api/payments/create-intent` if the server replies `subscriptions_not_configured`.

## Stripe Integration

- Uses `@stripe/react-stripe-js` and `@stripe/stripe-js`
- Appearance theme defined in `lib/stripe.ts`
- Matches brand colors (cream, charcoal, clay)
- Webhook at `/api/payments/webhook` handles async confirmations

## For AI Agents

### Working In This Directory
- Never store card data client-side
- Always use Stripe Elements for card input
- Handle both success and error states
- Support 3D Secure redirects

### Error Handling
- Display `error.message` to user
- Allow retry on failure
- Log full error for debugging

### Patterns
```typescript
import { PaymentProvider } from "@/components/payment/PaymentProvider";
import { PaymentForm } from "@/components/payment/PaymentForm";

<PaymentProvider clientSecret={clientSecret}>
  <PaymentForm
    onSuccess={() => navigate('/registration/success')}
    onError={(error) => setError(error.message)}
  />
</PaymentProvider>
```

<!-- MANUAL: -->
