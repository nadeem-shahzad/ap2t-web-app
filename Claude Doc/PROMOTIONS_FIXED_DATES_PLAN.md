# Plan: Single Promotion with Multiple Selectable Dates

## Problem

Today a "promotion" is a row in `sessions` with `apply_promotion = true`. Every field
(name, description, image, price, coach, location) plus `date`/`end_date` lives on
that one row. To offer the same promo on multiple dates (e.g. "CAGE Youth Pickup" on
Oct 23, Oct 28, Oct 30), the admin has to duplicate the entire session row per date.

Goal: create **one** promotion definition, attach a curated list of occurrence dates
to it, and let the customer pick a date at registration — each date with its own
price, its own capacity, and its own "X Left" count.

## Decisions already made

- Every date has its own capacity.
- "X Left" is shown per date (not aggregated).
- Pricing is per date (not shared across the promotion).

## Current related mechanism (for reference, do not break)

`is_daily_payment` sessions already let a customer pick a date, but from a
**continuous range** (`date` → `end_date`) via a plain `<input type="date" min max>`.
Capacity/payment tracking already keys off `payments.session_date`
(see `app/api/camps-clinics/[id]/route.ts:106-153`). This plan reuses that
`session_date` pattern but replaces "any day in a range" with "one of N curated
dates," each carrying its own price/capacity.

## Data model

Add a new table instead of reusing `date`/`end_date` as a range:

```sql
CREATE TABLE session_dates (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price NUMERIC NOT NULL,
  promotion_price NUMERIC,          -- required only if sessions.apply_promotion
  max_players INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_signup_open BOOLEAN NOT NULL DEFAULT true, -- per-date storefront visibility/signup toggle
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, date)
);

ALTER TABLE sessions
  ADD COLUMN date_mode TEXT NOT NULL DEFAULT 'single'
  CHECK (date_mode IN ('single', 'daily_range', 'fixed_dates'));
```

- `sessions` keeps shared info: name, description, image, coach, location,
  start/end time, age limit, `apply_promotion`, `session_type`.
- `sessions.price` / `promotion_price` / `max_players` stay as-is for
  `single` and `daily_range` modes (backward compatible, untouched).
- `date_mode = 'fixed_dates'` is mutually exclusive with `is_daily_payment`.
- `payments.session_date` (already exists) joins back to `session_dates.date`
  for capacity checks and to know what was actually charged.
- Capacity per date: `session_dates.max_players - COUNT(matching payments/session_players
  for that session_id + date)` — same query shape as the existing `is_daily_payment`
  per-date COUNT check, just against a fixed row instead of a range bound.

This migration is purely additive: new table, new column with a safe default.
Existing sessions/queries are unaffected until the new `fixed_dates` code path
is built and used.

## Admin UI changes

- `components/sessions/create-session-dialog.tsx` /
  `components/sessions/edit-session-dialog.tsx`: when `date_mode = 'fixed_dates'`
  is selected, replace the single date/end_date fields with a repeatable
  date-row input: date picker, price, promo price (if `apply_promotion`),
  max players. Same interaction pattern as the existing `session_variants`
  (hour/price) rows.
- `app/api/admin/sessions/route.ts` (POST/PUT): when `date_mode === 'fixed_dates'`,
  insert/replace rows in `session_dates` in the same transaction, mirroring how
  `session_variants` is written today.
- `app/portal/admin/promotions/page.tsx`: one card per promotion (not per date
  as today). Expand to a per-date breakdown: date | price | capacity |
  sign-ups | revenue | storefront-visible toggle. The "Users can signup"
  toggle likely needs to become per-date too (a specific date could sell out
  or get closed independently of the others).
- `app/api/admin/sessions/[id]/participants/route.ts`: already supports a
  `session_date` filter for daily-payment sessions — extend the same filter
  to fixed-dates sessions, and resolve price from `session_dates` instead of
  `sessions.price`.

## Storefront changes

- `app/(landing)/camps-clinics/[id]/page.client.tsx`: replace the
  `<input type="date">` with a list of selectable date cards, each showing
  its own price and its own "X Left" badge (or "Sold out", disabled). Picking
  a date sets `session_date` and determines the price to charge.
- `app/(landing)/camps-clinics/page.client.tsx` (grid): price and "left" are
  now per-date, so the card needs a representative summary value.
  **Open UX decision:** show "From $X" (lowest active date's price) and
  either the nearest upcoming date's remaining seats or "N dates available" —
  needs a call before implementing, not a technical blocker.
- `app/api/camps-clinics/route.ts` / `[id]/route.ts` GET: return the
  `session_dates` array (date, price, promo price, left) alongside the
  session for `fixed_dates` sessions.
- `app/api/camps-clinics/[id]/route.ts` POST: look up the matching
  `session_dates` row for the submitted `session_date`, validate it's active
  and has capacity left, and use that row's price/promo_price for
  `payments.amount` / `original_price` (currently payment amount is recorded
  as pending `0`, updated later — same flow, just sourced from the right row).

## Payment / checkout flow

Wherever an amount is actually charged (Square checkout, admin-recorded
payments, front-desk payments) needs to resolve price from `session_dates`
keyed by `(session_id, session_date)` instead of `sessions.price`/
`promotion_price`. This touches:

- `app/api/admin/sessions/[id]/participants/route.ts`
- `app/api/front-desk/route.ts`

Both already branch on `is_daily_payment` for per-date capacity — add a
`date_mode === 'fixed_dates'` branch alongside it.

## Types

- `lib/types.ts`: add `date_mode` to `CampClinicSession`/session-related
  types, add a `SessionDate` type `{ id, date, price, promotion_price, max_players,
  left, is_active }`, and extend `CampClinicCard` with an optional
  `dates: SessionDate[]`.

## Migration strategy

`.env.development.local` already points at a separate Neon **project** from
production (not a branch of it) — this is the project's existing dev/staging
database. Chosen approach:

1. Run the migration (`CREATE TABLE session_dates`, `ALTER TABLE sessions
   ADD COLUMN date_mode`) and the full feature build against the dev Neon
   project.
2. Verify admin creation flow, storefront selection flow, capacity checks,
   and payment amount resolution end-to-end there.
3. Once verified, apply the same migration SQL to production (additive-only,
   safe to run without downtime), then deploy the app code.
4. Do **not** run any schema-altering command directly against production
   without explicit confirmation at each step, given it's live.

## Data migration for existing promotions (separate, later step)

Consolidating the existing duplicate "CAGE Youth Pickup" rows (3 separate
`sessions` rows today) into one `fixed_dates` promotion is a manual,
one-time data migration:

- Move each row's date/price/capacity into a `session_dates` entry under a
  single kept `sessions` row.
- Reassign existing `session_players` / `payments` rows (which reference the
  old `session_id`s) to the new consolidated `session_id`.
- Do this only after the feature is built, tested on a Neon branch, and
  deployed — treat it as its own careful, reviewed operation, not part of
  the initial rollout.

## Open questions — resolved

1. Grid card summary: show **"From $X"** (lowest active date's price) +
   **remaining seats for the nearest upcoming date**.
2. Admin "Users can signup" / "Visible on storefront" toggle is **per-date
   only** — each date row gets its own toggle, no global master switch.

## Implementation checklist

Work happens against the dev Neon project first (see "Migration strategy"),
verified end-to-end, then the same SQL is applied to production and the app
code deployed. Check items off as they land; do not reorder — later steps
depend on earlier ones (schema → types → admin write path → admin read/UI →
storefront read → storefront UI → payment resolution → data migration).

### 0. Environment / branch setup
- [x] `.env.development.local` already points at a separate Neon project
      from production — no branching needed, build/test directly against it

### 1. Schema (on the dev Neon project first)
- [x] `CREATE TABLE session_dates` (id, session_id FK, date, price,
      promotion_price, max_players, is_active, is_signup_open, created_at,
      UNIQUE(session_id, date)) — includes the per-date signup/visibility
      toggle resolved above (`is_signup_open` alongside `is_active`).
      Applied via `db/migrations/2026-09-18_session_dates.sql` against the
      dev Neon project, verified column-by-column.
- [x] `ALTER TABLE sessions ADD COLUMN date_mode` with CHECK constraint,
      default `'single'`. Applied in the same migration, verified.
- [x] Verified additive-only migration doesn't affect existing sessions —
      spot-checked existing rows on dev DB, all default to
      `date_mode: 'single'` with `is_daily_payment`/`apply_promotion`
      unchanged; every read path added returns `dates: []` for them.

### 2. Types
- [x] `lib/types.ts`: added `DateMode` union + `date_mode` on
      `CampClinicSession`/`CampClinicCard`
- [x] `lib/types.ts`: added `SessionDate` type
      `{ id, date, price, promotion_price, max_players, left, is_active, is_signup_open }`
- [x] `lib/types.ts`: extended `CampClinicCard` and `CampClinicSession` with
      optional `dates: SessionDate[]`

### 3. Admin write path
- [x] `app/api/admin/sessions/route.ts` (POST): when `date_mode ===
      'fixed_dates'`, validates and inserts `session_dates` rows in the same
      transaction; backfills `sessions.price`/`promotion_price`/
      `max_players` (min price, min promo price, summed capacity) for
      backward-compat reads, mirroring the `session_variants` trick
- [x] `app/api/admin/sessions/route.ts` (PUT): deletes + re-inserts
      `session_dates` rows on edit (same diff-by-replace pattern as
      `session_variants`); clears `session_dates` if `date_mode` changes
      away from `fixed_dates`
- [x] `components/sessions/create-session-dialog.tsx`: added `date_mode`
      field + "Add multiple dates" toggle button (mirrors "Convert to
      variants"); when `fixed_dates`, single date/end_date, top-level price,
      max players, payment-type, and single promotion-price fields are
      hidden and replaced by a repeatable date-row editor (date, price,
      promo price if `apply_promotion`, max players, is_signup_open
      checkbox, remove button); mutually exclusive with variants pricing
      mode and `is_daily_payment`. Typechecks clean.
- [x] `components/sessions/edit-session-dialog.tsx`: fixed-dates fields are
      **locked** on edit, consistent with the existing pattern that already
      locks `price`/`is_daily_payment`/`pricing_mode`/`variants` post-
      creation — `date_mode`/`dates` added to that locked set, plus
      `max_players` locked specifically for fixed-dates sessions (its value
      is a derived aggregate, not editable directly). Shows a read-only
      per-date summary (date, price → promo price, max players, signup
      status) instead of editable rows; per-date editing lives on the
      promotions detail page (step 4) instead. Typechecks clean.
- [x] `app/api/admin/sessions/route.ts` GET: extended to also return a
      `dates` jsonb array per session (id, date, price, promotion_price,
      max_players, is_active, is_signup_open, left — capacity computed the
      same way as the existing daily-payment check). Verified against dev DB.
- [x] End-to-end verified on dev DB: inserted a fixed-dates session +
      session_dates rows via the same transaction shape as the route,
      confirmed correct rows back, cleaned up test data.

### 4. Admin read / promotions dashboard
- [x] `app/api/admin/sessions/[id]/route.ts` GET: also returns the `dates[]`
      array (same shape as the list GET) for the session detail page /
      edit-dialog prefill.
- [x] `app/api/admin/sessions/[id]/participants/route.ts`: GET's
      `session_date` filter was already generic (matches whatever date is
      passed) — works for `fixed_dates` with no change needed. POST
      (admin-recorded enrollment) now branches on `date_mode ===
      'fixed_dates'`: requires + validates the date against `session_dates`
      (active + signup-open), checks per-date capacity from
      `session_dates.max_players`, resolves price/promo-price from the
      matching `session_dates` row instead of `sessions.price`, and stores
      `session_date` on the payment row — mirrors the existing
      `is_daily_payment` branch throughout. Typechecks clean.
- [x] `app/portal/admin/promotions/page.tsx`: card stays one-per-promotion;
      for `fixed_dates` promotions the price line shows "From $X" + a
      "N dates" badge instead of a single before/after price, and the
      storefront-visibility row says "Per-date signup control" instead of
      "Users can signup" (control itself lives on the detail page).
- [x] `app/api/admin/sessions/[id]/dates/[dateId]/route.ts` (new): PATCH
      endpoint to update a single date's `is_signup_open`/`is_active`/
      `max_players`.
- [x] `components/session/main-page.tsx` (promotion detail page, shared with
      coach view): for `fixed_dates` sessions, adds an occurrence-date
      picker (reuses the existing daily-payment participants/payments
      date-filter plumbing) and a per-date breakdown table — date, price →
      promo price, capacity, left, signup-open checkbox wired to the new
      PATCH endpoint. Header "enrolled" stat uses the selected date's
      capacity instead of the session-level aggregate. Typechecks clean.

### 5. Storefront read (API)
- [x] `app/api/camps-clinics/route.ts` GET: returns a `dates[]` array (only
      active, still-upcoming dates) per session; the storefront UI derives
      "From $X" + nearest date's seats from it. Availability WHERE clause
      extended so `fixed_dates` sessions (whose `end_date` is null) are no
      longer excluded — matched via `EXISTS` against `session_dates` instead
      of the `end_date >= CURRENT_DATE` check. Verified against dev DB.
- [x] `app/api/camps-clinics/[id]/route.ts` GET: returns the full
      `dates[]` array (date, price, promo price, left, is_active,
      is_signup_open) for the detail page's date picker.
- [x] Capacity query: `session_dates.max_players - COUNT(DISTINCT
      payments.user_id for that session_id + date)`, same shape as the
      existing `is_daily_payment` per-date COUNT check — used consistently
      across every read path added.

### 6. Storefront UI
- [x] `app/(landing)/camps-clinics/[id]/page.client.tsx`: added a selectable
      date-card list alongside (not replacing) the existing daily-payment
      `<input type="date">` — each card shows date, effective price
      (promo-aware), and "N left"/"Sold out", disabled when sold out or
      signup closed. Defaults to the nearest open upcoming date. Price/left
      shown elsewhere on the page (badge, event-details price line) are now
      dynamic off the selected date for `fixed_dates` sessions.
- [x] `app/(landing)/camps-clinics/page.client.tsx`: grid card shows
      "From $X" (lowest active/promo price) + nearest upcoming date's seats
      left, plus an "N dates available" detail line, for `fixed_dates`
      sessions specifically — other modes' card layout is unchanged.
- [x] Verified `/api/camps-clinics/[id]` end-to-end against dev DB: created
      a fixed-dates session with two dates, confirmed the GET response
      shape (`date_mode`, `dates[]` with price/promo/left/is_signup_open)
      matches what the client component expects, cleaned up test data.

### 7. Payment / checkout price resolution
- [x] `app/api/camps-clinics/[id]/route.ts` POST (self-signup): validates
      the submitted `session_date` against `session_dates`
      (`is_active`/`is_signup_open`/capacity) for `fixed_dates` sessions,
      same as the `is_daily_payment` date-range check it already had.
      **Note:** this endpoint inserts every enrollment's payment as pending
      `amount: 0` regardless of mode (single/daily/fixed) — that was already
      true before this feature; actual charging elsewhere reads
      `payments.amount` as-is. Not something this feature changed or needed
      to fix; flagging only because it's a pre-existing gap worth a look
      separately if pending amounts are ever charged as $0 in practice.
- [x] `app/api/admin/sessions/[id]/participants/route.ts` (admin-recorded
      enrollment): full `date_mode === 'fixed_dates'` branch — required
      date, validated against `session_dates`, capacity from
      `session_dates.max_players`, price/promo resolved from the matching
      `session_dates` row.
- [x] `app/api/front-desk/route.ts` (cash/approval flow): mirrors the
      `is_daily_payment` branches with a `date_mode === 'fixed_dates'`
      branch for date validity, capacity, and re-signup-for-a-different-date
      handling. Also fixed a related bug this surfaced: the "mark cash
      payment paid" query picked *any* pending payment row for
      non-daily-payment sessions, which would have grabbed the wrong date's
      row for a `fixed_dates` session with multiple pending payments for the
      same user — now requires the `session_date` match whenever the
      session isn't a plain single/date-range session.

### 8. End-to-end verification (on the dev Neon project)
- [ ] Admin: create a `fixed_dates` promotion with multiple dates/prices/
      capacities
- [ ] Admin: edit it (add/remove/change a date row)
- [ ] Storefront: grid shows correct "From $X" + nearest seats left
- [ ] Storefront: detail page lists all dates with correct price/left per
      date, blocks sold-out/closed dates
- [ ] Checkout: correct amount charged for the selected date
      (Square + admin-recorded + front-desk paths)
- [ ] Admin dashboard: per-date sign-ups/revenue/capacity reporting correct
- [ ] Confirm `single` and `daily_range` sessions are fully unaffected

### 9. Ship to production
- [ ] Apply the same schema SQL to production (additive-only) — explicit
      confirmation before running against prod
- [ ] Deploy app code
- [ ] Smoke-test one real `fixed_dates` promotion end-to-end in prod

### 10. Data migration for existing promotions (separate, later)
- [ ] Consolidate existing duplicate "CAGE Youth Pickup" rows into one
      `fixed_dates` promotion with a `session_dates` entry per date
- [ ] Reassign existing `session_players`/`payments` rows to the
      consolidated `session_id`
- [ ] Do this only after step 9 is live and stable; treat as its own
      reviewed operation
