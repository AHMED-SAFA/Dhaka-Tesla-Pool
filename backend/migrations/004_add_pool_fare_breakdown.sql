-- Store the solo comparison and pooling savings for transparent fare allocation.

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS solo_fare_paisa INTEGER;

ALTER TABLE ride_passengers
  ADD COLUMN IF NOT EXISTS solo_fare_paisa INTEGER,
  ADD COLUMN IF NOT EXISTS pool_savings_paisa INTEGER;
