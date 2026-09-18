-- Fixed-dates promotions: one session definition, many curated occurrence dates.
-- Additive-only: new table + new column with a safe default. Existing
-- single/daily_range sessions and queries are unaffected.

CREATE TABLE IF NOT EXISTS session_dates (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC NOT NULL,
  promotion_price NUMERIC,
  max_players INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_signup_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, date)
);

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS date_mode TEXT NOT NULL DEFAULT 'single';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_date_mode_check'
  ) THEN
    ALTER TABLE sessions
      ADD CONSTRAINT sessions_date_mode_check
      CHECK (date_mode IN ('single', 'daily_range', 'fixed_dates'));
  END IF;
END $$;
