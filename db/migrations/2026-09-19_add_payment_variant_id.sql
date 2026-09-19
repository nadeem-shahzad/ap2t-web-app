-- Records the exact duration/hour option selected at enrollment so sibling
-- discounts can be scoped to the same variant rather than inferred by price.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS variant_id INTEGER
  REFERENCES session_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS payments_session_user_date_variant_idx
  ON payments (session_id, user_id, session_date, variant_id);
