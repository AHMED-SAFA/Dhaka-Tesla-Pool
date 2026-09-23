-- Dhaka Tesla Pool — initial schema
-- Money is stored as INTEGER paisa (1 BDT = 100 paisa) to avoid floating-point rounding.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('passenger', 'driver');
CREATE TYPE tesla_ops_status AS ENUM ('offline', 'online', 'on_trip');
CREATE TYPE request_status AS ENUM ('waiting', 'matched', 'cancelled', 'completed');
CREATE TYPE ride_status AS ENUM (
  'requested',
  'matched',
  'driver_arrived',
  'started',
  'completed',
  'cancelled'
);
CREATE TYPE passenger_on_ride_status AS ENUM (
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);
CREATE TYPE payment_method AS ENUM ('cash', 'tesla_pay');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT UNIQUE,
  role            user_role NOT NULL,
  email_verified_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_name_nonempty CHECK (char_length(btrim(full_name)) >= 2)
);

CREATE INDEX idx_users_role ON users (role);

CREATE TABLE email_verification_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  code_hash    TEXT NOT NULL,
  token_hash   TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_verify_user ON email_verification_tokens (user_id, created_at DESC);

CREATE TABLE password_reset_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens (user_id, created_at DESC);

CREATE TABLE zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL UNIQUE,
  latitude    NUMERIC(9, 6) NOT NULL,
  longitude   NUMERIC(9, 6) NOT NULL
);

CREATE TABLE teslas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  capacity        SMALLINT NOT NULL,
  ops_status      tesla_ops_status NOT NULL DEFAULT 'offline',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT teslas_capacity_positive CHECK (capacity BETWEEN 1 AND 8)
);

CREATE TABLE ride_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id          UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  pickup_zone_id        UUID NOT NULL REFERENCES zones (id),
  dropoff_zone_id       UUID NOT NULL REFERENCES zones (id),
  seats                 SMALLINT NOT NULL DEFAULT 1,
  status                request_status NOT NULL DEFAULT 'waiting',
  estimated_fare_paisa  INTEGER NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at          TIMESTAMPTZ,
  CONSTRAINT ride_requests_seats_positive CHECK (seats BETWEEN 1 AND 3),
  CONSTRAINT ride_requests_distinct_zones CHECK (pickup_zone_id <> dropoff_zone_id),
  CONSTRAINT ride_requests_fare_nonneg CHECK (estimated_fare_paisa >= 0)
);

CREATE INDEX idx_ride_requests_passenger ON ride_requests (passenger_id, created_at DESC);
CREATE INDEX idx_ride_requests_waiting ON ride_requests (status) WHERE status = 'waiting';

CREATE TABLE rides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tesla_id        UUID NOT NULL REFERENCES teslas (id) ON DELETE RESTRICT,
  driver_id       UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  status          ride_status NOT NULL DEFAULT 'matched',
  occupied_seats  SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  arrived_at      TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  cancelled_at    TIMESTAMPTZ,
  cancel_reason   TEXT,
  CONSTRAINT rides_occupied_nonneg CHECK (occupied_seats >= 0)
);

CREATE INDEX idx_rides_driver_status ON rides (driver_id, status);
CREATE INDEX idx_rides_tesla_active ON rides (tesla_id) WHERE status NOT IN ('completed', 'cancelled');

CREATE TABLE ride_passengers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id           UUID NOT NULL REFERENCES rides (id) ON DELETE CASCADE,
  request_id        UUID NOT NULL UNIQUE REFERENCES ride_requests (id) ON DELETE RESTRICT,
  passenger_id      UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  pickup_zone_id    UUID NOT NULL REFERENCES zones (id),
  dropoff_zone_id   UUID NOT NULL REFERENCES zones (id),
  seats             SMALLINT NOT NULL,
  fare_paisa        INTEGER NOT NULL,
  status            passenger_on_ride_status NOT NULL DEFAULT 'confirmed',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ride_passengers_unique UNIQUE (ride_id, passenger_id),
  CONSTRAINT ride_passengers_seats CHECK (seats BETWEEN 1 AND 3),
  CONSTRAINT ride_passengers_fare CHECK (fare_paisa >= 0)
);

CREATE INDEX idx_ride_passengers_passenger ON ride_passengers (passenger_id);

CREATE TABLE ride_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id     UUID REFERENCES rides (id) ON DELETE CASCADE,
  request_id  UUID REFERENCES ride_requests (id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  from_status TEXT,
  to_status   TEXT,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ride_events_ride ON ride_events (ride_id, created_at);

CREATE TABLE wallets (
  user_id       UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  balance_paisa INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wallets_balance_nonneg CHECK (balance_paisa >= 0)
);

CREATE TABLE payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_passenger_id   UUID NOT NULL REFERENCES ride_passengers (id) ON DELETE RESTRICT,
  amount_paisa        INTEGER NOT NULL,
  method              payment_method NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_amount_positive CHECK (amount_paisa > 0)
);
