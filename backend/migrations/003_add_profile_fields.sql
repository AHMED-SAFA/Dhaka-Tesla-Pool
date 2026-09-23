-- Add editable profile details while keeping login credentials immutable.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nid TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE teslas
  ADD COLUMN IF NOT EXISTS tesla_number TEXT UNIQUE;
