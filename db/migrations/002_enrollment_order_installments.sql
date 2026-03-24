-- Installment / Stripe customer fields for multi-line orders (merged plan §4)
ALTER TABLE enrollment_orders ADD COLUMN later_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE enrollment_orders ADD COLUMN later_payment_date TEXT;
ALTER TABLE enrollment_orders ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE enrollment_orders ADD COLUMN second_stripe_payment_intent_id TEXT;

