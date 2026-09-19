-- Session pricing and kiosk support.
-- Safe to run on databases where any portion has already been applied.

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

-- session_dates must be a timezone-free calendar date.
ALTER TABLE session_dates
  ALTER COLUMN date TYPE DATE USING (date AT TIME ZONE 'UTC')::date;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS variant_id INTEGER
  REFERENCES session_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_session_user_date_variant_idx
  ON payments (session_id, user_id, session_date, variant_id);

-- Kiosk actions persist a server-resolved final amount. This avoids applying
-- a sibling discount twice when the web front desk accepts the action.
ALTER TABLE front_desk_actions
  ADD COLUMN IF NOT EXISTS price_is_final BOOLEAN NOT NULL DEFAULT false;
