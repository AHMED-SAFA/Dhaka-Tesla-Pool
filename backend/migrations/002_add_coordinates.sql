-- 002_add_coordinates.sql
-- Add exact pickup and dropoff coordinates for ride requests and passenger bookings

ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS dropoff_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS dropoff_lng NUMERIC(9, 6);

ALTER TABLE ride_passengers
  ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS dropoff_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS dropoff_lng NUMERIC(9, 6);
