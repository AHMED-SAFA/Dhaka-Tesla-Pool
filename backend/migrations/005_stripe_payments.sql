-- 005_stripe_payments.sql
-- Add Stripe payment method and payment tracking fields

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'stripe';

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_client_secret TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by_driver BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_passenger ON payments (ride_passenger_id);
