-- 006_ratings_and_complaints.sql
-- Add feedback table for star ratings (1-5, optional) and complaints/comments (optional)

CREATE TABLE IF NOT EXISTS ride_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES ride_requests (id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides (id) ON DELETE CASCADE,
  ride_passenger_id UUID REFERENCES ride_passengers (id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users (id) ON DELETE SET NULL,
  submitted_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  rating SMALLINT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  complaint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_ride_feedback_request_user UNIQUE (request_id, submitted_by)
);

CREATE INDEX IF NOT EXISTS idx_ride_feedback_passenger ON ride_feedback (passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_feedback_driver ON ride_feedback (driver_id);
CREATE INDEX IF NOT EXISTS idx_ride_feedback_ride ON ride_feedback (ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_feedback_request ON ride_feedback (request_id);
