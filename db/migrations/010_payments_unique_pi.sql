-- Prevent duplicate payment rows for the same Stripe PaymentIntent
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_pi
  ON payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
