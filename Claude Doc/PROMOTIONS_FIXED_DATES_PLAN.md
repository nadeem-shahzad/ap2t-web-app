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

## Migration strategy (no staging DB available)

Project has no staging database and is live in production. Chosen approach:

1. Use **Neon branching** to create an instant copy-on-write clone of
   production (schema + data) as a temporary branch — effectively free
   staging specific to Neon.
2. Point a temporary `.env.local` `DATABASE_URL` at the branch's connection
   string.
3. Run the migration (`CREATE TABLE session_dates`, `ALTER TABLE sessions
   ADD COLUMN date_mode`) and the full feature build against the branch.
4. Verify admin creation flow, storefront selection flow, capacity checks,
   and payment amount resolution end-to-end on the branch.
5. Once verified, apply the same migration SQL to production (additive-only,
   safe to run without downtime), then deploy the app code.
6. Do **not** run any schema-altering command directly against production
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

## Open questions to resolve before/while implementing

1. Grid card summary (see "Storefront changes" above): "From $X" + which
   seat count to display.
2. Whether the admin "Users can signup" / "Visible on storefront" toggle
   should be global to the promotion, per date, or both (global default +
   per-date override).
