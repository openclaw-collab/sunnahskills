ALTER TABLE enrollment_orders ADD COLUMN manual_review_status TEXT DEFAULT 'none';
ALTER TABLE enrollment_orders ADD COLUMN manual_review_reason TEXT;
ALTER TABLE enrollment_orders ADD COLUMN last_payment_error TEXT;
ALTER TABLE enrollment_orders ADD COLUMN last_payment_attempt_at DATETIME;
