# Fixed-Dates Promotions — Bug Audit

Self-review of the "single promotion, multiple selectable dates" feature (see
`PROMOTIONS_FIXED_DATES_PLAN.md`). Everything below is either verified against
the dev DB / a real Node process, or traced directly in the source — not
speculation. Ordered by how much damage each would actually do.

---

## Critical

### 1. ~~Off-by-one-day timezone bug~~ — FIXED
**Status: fixed and verified on the dev DB.** Root cause turned out to be two
compounding issues:

1. `session_dates.date` had drifted to `TIMESTAMPTZ` on the live dev DB
   (confirmed via `pg_typeof` — `oid 1184`), instead of the `DATE` type the
   original migration declared. A `TIMESTAMPTZ` round-tripped through
   `jsonb_build_object` serializes as `"2026-10-19T00:00:00+00:00"` — an
   instant, not a calendar date.
2. Frontend code almost universally did `moment(new Date(dateString))`.
   `new Date(dateOnlyString)` is parsed as UTC per the JS spec even for a
   clean `"2026-10-19"` string; `moment(dateString)` directly (no `new Date`
   wrapper) parses the same string in local time instead — the two behave
   oppositely, which is exactly the kind of thing that's easy to get
   inconsistent across ~24 call sites.

Fixed via:
- `db/migrations/2026-09-19_fix_session_dates_type.sql` — restores
  `session_dates.date` to a true `DATE` (`ALTER COLUMN ... TYPE DATE USING
  date::date`, lossless since every value was always inserted as a bare
  `'YYYY-MM-DD'` string). Applied and verified on the dev DB; **still needs
  to be applied to production** alongside the original schema migration when
  this feature ships (see the "Migration strategy" section of the main plan
  doc — same "explicit confirmation before touching prod" rule applies).
- `lib/date.ts` — added `parseDateOnly()` / `formatDateOnly()`, which parse a
  `'YYYY-MM-DD'` string into a **local midnight** `Date` via
  `new Date(year, month - 1, day)`, never through the UTC-parsing
  `new Date(string)` path.
- Every `new Date(dateOnlyString)` call site feeding a calendar
  `selected`/`defaultMonth` prop or client-side form state
  (`app/(landing)/camps-clinics/[id]/page.client.tsx`,
  `components/sessions/edit-session-dialog.tsx`,
  `components/calendar/session-calendar.tsx`) now goes through
  `parseDateOnly()` instead. Plain `moment(dateString)` calls (no `new Date`
  wrapper) were already correct and left untouched — same for `.getTime()`
  sort comparisons, which were switched to `localeCompare` on the ISO string
  for clarity even though the offset didn't actually break sort order.

Verified directly under `TZ=America/New_York`: the API now returns a bare
`"2026-10-19"`, and `parseDateOnly` round-trips it through `moment(...).format()`
back to `"2026-10-19"` — where the old `new Date(str)` path produced
`"2026-10-18"`.

Original write-up below, kept for context on what broke and why.

### 1a. Off-by-one-day timezone bug — affects almost every date shown or submitted
`session_dates.date` is a Postgres `DATE`. `pg` returns it to Node as a JS
`Date` at **UTC midnight**. Nearly every place in the frontend does
`moment(row.date)` or `new Date(row.date)` and formats it — which renders in
the **browser's local timezone**, not UTC. For any timezone behind UTC
(all of the US, where this app is presumably used), that shifts the displayed
date back by one full day.

Verified directly:
```
TZ=America/New_York node -e "
const moment = require('moment');
const d = new Date('2026-10-19T00:00:00.000Z');
console.log(moment(d).format('YYYY-MM-DD'));        // 2026-10-18  (wrong)
console.log(moment.utc(d).format('YYYY-MM-DD'));     // 2026-10-19  (correct)
"
```

This hits ~24 call sites across the feature, including:
- `components/sessions/create-session-dialog.tsx` / `edit-session-dialog.tsx` — date-row inputs and read-only summary
- `components/session/main-page.tsx` — the horizontal date-chip strip, occurrence-date picker
- `app/(landing)/camps-clinics/[id]/page.client.tsx` — the storefront calendar, `fixedDatesMap`, day-button price labels
- `app/(landing)/camps-clinics/page.client.tsx` — grid card "nearest date" resolution
- `app/portal/player/promotions/page.tsx`, `app/portal/player/camps/page.tsx` — date pickers and `enrolled_dates` matching
- `components/calendar/session-calendar.tsx` — the calendar-event date each occurrence lands on

**Consequence, not just cosmetic:** the *value actually submitted* as
`session_date` on enroll is also computed via `moment(...).format('YYYY-MM-DD')`
from the shifted Date. In US timezones this means a customer who clicks "Oct 19"
on the calendar submits `session_date = "2026-10-18"`, which either matches
nothing in `session_dates` (signup gets rejected as "not available") or — worse
— silently books them into whatever *is* on the 18th if the promotion happens
to have back-to-back dates.

**Fix:** every read of `session_dates.date` (and `payments.session_date`,
`sessions.date`/`end_date` where used the same way) should go through
`moment.utc(...)` before `.format('YYYY-MM-DD')`, or the API should serialize
dates as plain `'YYYY-MM-DD'` strings server-side instead of letting `pg` hand
back a `Date` object at all. The latter is the more robust fix — it removes
the footgun for every future caller, not just the ones I remembered to audit.

---

### 2. ~~Public self-signup has no capacity lock~~ — FIXED
**Status: fixed and verified against the dev DB with a real two-client race.**

The original unlocked pre-check (lines ~133–187, `pool.query`, no transaction)
is kept as-is — it's still useful as a fast fail before the expensive
Firebase account creation. What changed: the actual write transaction
(`client.connect()` / `BEGIN` at what's now line ~257) now re-runs an
**authoritative, locked** capacity check immediately after `BEGIN` and before
any inserts:
- `fixed_dates`: `SELECT max_players, is_active, is_signup_open FROM
  session_dates WHERE session_id = $1 AND date = $2::date FOR UPDATE`, then a
  `COUNT(DISTINCT user_id)` against `payments` within the same transaction.
- `single` / `is_daily_payment`: `SELECT max_players FROM sessions WHERE id =
  $1 FOR UPDATE`, same pattern.

If it fails, a new `CapacityError` is thrown, caught by the existing
rollback/Firebase-cleanup block, and mapped to a `409` (previously any error
here would've fallen through to a generic `500`).

**Verified directly** with two real concurrent `pg` clients against a
`max_players = 1` session/date on the dev DB (200ms of injected "work"
between the locked read and the insert, to force the race window open):
locked version → one `ACCEPTED`, one correctly `REJECTED (full)` — the
`FOR UPDATE` on the `session_dates` row serializes the two transactions, so
the second one's `COUNT` sees the first one's committed insert. Test session
was cleaned up after.

Original write-up below, kept for context.

### 2a. Public self-signup has no capacity lock — overselling is possible
`app/api/camps-clinics/[id]/route.ts` POST (the unauthenticated storefront
signup flow) checks `session_dates` capacity with a **plain `pool.query`**
(lines ~141–163), completely separate from the transaction that later does
the actual `INSERT INTO payments` (`client.connect()` / `BEGIN` at line 257).
No `SELECT ... FOR UPDATE`, no shared transaction between the check and the
write.

Two people hitting "Register" for the last open seat at the same moment can
both pass the `total_left <= 0` check and both get inserted — the promotion
oversells by however many requests race through in that window.

This is a **pre-existing gap** for `is_daily_payment` sessions too (same code
path, same missing lock) — I extended the exact same unprotected pattern to
`fixed_dates` rather than introducing a new bug, but it now covers more
traffic (every fixed-dates promotion signup goes through it).

By contrast, `app/api/admin/sessions/[id]/participants/route.ts` and
`app/api/front-desk/route.ts` both correctly wrap the capacity check and the
insert in one transaction with `FOR UPDATE` on the `session_dates` row — this
route is the outlier.

**Fix:** move the `session_dates`/capacity check inside the existing
`client.connect()` transaction in this route, with `FOR UPDATE` on the
`session_dates` row, mirroring the admin-participants route.

---

### 3. ~~"Left" counts failed and refunded payments as occupied seats~~ — FIXED
**Status: fixed and verified against the dev DB.** Added
`AND status NOT IN ('failed', 'refunded')` to all 14 capacity-counting
queries (the 13 originally found, plus one more turned up while fixing —
`app/api/admin/sessions/[id]/participants/route.ts`'s admin-recorded
enrollment capacity check):
`app/api/camps-clinics/route.ts`, `app/api/camps-clinics/[id]/route.ts`
(×4 — GET aggregate, pre-check ×2, and both locked in-transaction checks
added for finding #2), `app/api/admin/sessions/route.ts`,
`app/api/admin/sessions/[id]/route.ts`,
`app/api/admin/sessions/[id]/participants/route.ts`,
`app/api/parent/[id]/sessions/route.ts`, `app/api/player/[id]/sessions/route.ts`,
`app/api/player/[id]/promotions/route.ts`, `app/api/front-desk/route.ts` (×2).
(`app/api/admin/users/route.ts`'s `COUNT(DISTINCT user_id)` was checked and
left alone — it counts `session_players`, not `payments`, for a coach's
lifetime player count, unrelated to capacity.)

**Verified directly** on the dev DB: a 2-seat date with one `failed` and one
`refunded` payment recorded against it — old query reported `0` left
(wrongly locked out), new query reports `2` left (correct). Test data cleaned
up after.

Original write-up below, kept for context.

### 3a. "Left" counts failed and refunded payments as occupied seats
Every capacity query in the feature (13 occurrences across the API routes)
uses the same shape:
```sql
sd.max_players - COALESCE((
  SELECT COUNT(DISTINCT dp.user_id) FROM payments dp
  WHERE dp.session_id = s.id AND dp.session_date::date = sd.date
), 0)
```
There's no `AND dp.status NOT IN ('failed','refunded')` — a declined card or
a refunded cancellation still counts as "used" capacity forever. On a
promotion with `max_players = 16`, a handful of failed cards can silently
lock the date at "full" while real seats sit empty.

This mirrors the **pre-existing convention** for `is_daily_payment` sessions
(`app/api/camps-clinics/[id]/route.ts` original daily-payment branch has the
same unfiltered `COUNT(DISTINCT ...)`), so it's not something this feature
invented — but the fixed-dates work replicated it into every new capacity
query (admin GET, storefront GET x2, admin participants POST, front-desk POST,
player/parent sessions GET) instead of fixing it once. Worth fixing centrally
now that it's in 13 places instead of 1.

**Fix:** filter to `status NOT IN ('failed', 'refunded')` (or an explicit
allowlist of `'paid','pending','comped'`) in the capacity subquery, everywhere
it appears.

---

## High

### 4. ~~Coach conflict/blocked-schedule checks silently no-op for fixed-dates sessions~~ — FIXED
**Status: fixed.** Added a parallel, date-set-based path alongside the
existing date-range checks, used only when `date_mode === 'fixed_dates'`
(the existing range-based checks are untouched for every other mode):

- `getFixedDatesConflicts()` (new, in both `create-session-dialog.tsx` and
  `edit-session-dialog.tsx`) — checks each of the new/edited session's
  occurrence dates against every one of the coach's other upcoming/ongoing
  sessions, on both sides of the fix:
  - against another **continuous-range** session, via date containment
    (`occurrenceDate >= otherStart && occurrenceDate <= otherEnd`);
  - against another **fixed-dates** session, via actual set intersection of
    the two sessions' occurrence dates (not a min/max range approximation —
    a coach booked Oct 5 and Oct 19 on one promotion and Oct 12 on another
    correctly does *not* conflict, even though a naive range-overlap check
    would have flagged it).
  Both sides needed fixing: the *other* coach session being checked against
  could itself be `fixed_dates` with a null `date`/`end_date`, so
  `app/api/coach/[id]/sessions/route.ts` now also returns each session's
  `dates[]` (`SessionCoach` type extended to match).
- `getFixedDatesBlockedConflict()` (new, same two files) — same idea against
  the coach's blocked-schedule preferences, matching on exact date instead of
  a range.
- Wired into `CreateSession`/`editSession`: branch on `date_mode` to call the
  new fixed-dates-aware checks instead of the range-based ones. In the edit
  dialog, this runs against the session's existing (locked) occurrence dates
  — still relevant because time/coach can still change even though dates
  themselves can't.

Original write-up below, kept for context.

### 4a. Coach conflict/blocked-schedule checks silently no-op for fixed-dates sessions
`getSessionsConflicts` (`create-session-dialog.tsx:375`, mirrored in
`edit-session-dialog.tsx:98`) and `getBlockedConflict`
(`create-session-dialog.tsx:428`, `edit-session-dialog.tsx:147`) both key off
`values.date` / `values.end_date`. For `date_mode = 'fixed_dates'` those are
always `null` (explicitly nulled by the "Add multiple dates" toggle) —
`getSessionsConflicts` returns `[]` immediately (`if (!selectedDate || ...) return []`),
and `getBlockedConflict`'s date-range comparison degrades to comparing against
an "Invalid date" string, which never matches, so it also effectively returns
nothing.

**Net effect: creating or editing a fixed-dates promotion never checks the
coach's existing bookings or blocked-schedule preferences against any of the
promotion's occurrence dates.** A coach can be double-booked across a
fixed-dates promotion and an unrelated session that overlaps one of the
occurrence dates/times, and the admin gets no warning — where they would for
every other session type.

**Fix:** for `fixed_dates`, run the existing conflict/blocked check once per
occurrence date (against `start_time`/`end_time`, which *are* still
session-level) instead of skipping it. This wasn't in the original plan's
scope and is worth flagging as unfinished rather than assuming it's covered.

### 5. Removing an occurrence date on edit orphans its historical payments from view
`app/api/admin/sessions/route.ts` PUT replaces `session_dates` by
`DELETE FROM session_dates WHERE session_id = $1` then re-inserting the
submitted array. If an admin edits a fixed-dates promotion and drops a date
that already had sign-ups/payments against it, the `session_dates` row is
gone — but the `payments` rows (keyed by `session_date`, not a foreign key to
`session_dates.id`) still exist.

Every place that lists "occurrence dates" for an admin to inspect (the
date-chip strip, the occurrence-date picker in `main-page.tsx`) reads from
`session_dates`, so that date — and its enrollments/revenue — simply
disappears from the admin UI, even though the payment records (and the
player's enrollment) are still real and the money was still charged. The
`Payments`/`Participants` tabs would still return data for that date *if* an
admin could still select it, but nothing lets them select a date that no
longer has a `session_dates` row.

**Fix:** either (a) don't allow deleting a date via edit if it has existing
payments (soft-delete via `is_active = false` instead of removing the row —
the column already exists and capacity/storefront queries already filter on
it), or (b) keep removed-but-historical dates selectable in the admin picker
by unioning in distinct `payments.session_date` values that have no matching
`session_dates` row.

---

## Medium

### 6. Coach notifications show "Invalid date" for fixed-dates sessions
`app/api/admin/sessions/route.ts:254` and `:262` (POST) build the in-app
notification message from `moment(data.date).format('YYYY-MMM-DD')` /
`moment(data.end_date)...` — both `null` for fixed-dates sessions, so
`moment(null)` formats to the literal string `"Invalid date"`. The coach and
admins get: *"New session Cage Youth Pickup with RJ Allen scheduled on
Invalid date - Invalid date at 6:00 PM - 7:30 PM."*

The coach-assignment **email** (`sendCoachNewSessionEmail`, both POST and PUT)
has the same issue — `sessionDate: \`${sessionStartDate} - ${sessionEndDate}\`\`
(POST, line 245, computed from `data?.date`/`data?.end_date` via moment,
formats to empty strings) and PUT (line 573) sends the literal
`` `${data.date} - ${data.end_date}` `` → `"null - null"` straight into the
email body.

**Fix:** when `date_mode === 'fixed_dates'`, build that message/email field
from the submitted `dates` array instead (e.g. "14 dates, Oct 5 – Nov 18").

### 7. Front-desk actions list shows blank dates for fixed-dates sessions
`app/api/front-desk/route.ts` GET (lines 13–31) selects `s.date, s.end_date`
directly from `sessions` for display in the front-desk dashboard table. For a
`fixed_dates` session these are `null`, so any front-desk action tied to one
renders with blank date columns. (`front_desk_actions` does carry its own
`session_date` column already selected in the same query — the fix is just to
prefer that over `s.date`/`s.end_date` in the frontend table when present.)

### 8. "Mark as Completed" doesn't account for remaining future occurrence dates
`components/session/main-page.tsx:111`, `canMarkDailySessionCompleted`, is
gated purely on `is_daily_payment` (`!rawSessionData?.is_daily_payment || ...`)
— for `fixed_dates` sessions this is always `true`, so an admin can mark a
fixed-dates promotion "Completed" while it still has future active dates with
open signups. Nothing else in the app currently gates enrollment or storefront
visibility on `status`, so this is more of a "the button doesn't warn you"
gap than an active exploit, but it's inconsistent with how daily-payment
sessions protect against exactly this.

### 9. No validation preventing a past occurrence date
Neither `validateFixedDates` (`app/api/admin/sessions/route.ts`) nor the
create/edit dialog's `superRefine` blocks a date in the past from being added.
Not necessarily wrong (an admin might legitimately backfill a date for
record-keeping), but worth a deliberate decision rather than an oversight —
right now nothing stops a typo'd year from being saved silently.

---

## Low / polish

### 10. Converting a non-promotional fixed-dates session into a promotion is a dead end
`date_mode`/`dates` are unconditionally in `lockedFields` on edit
(`edit-session-dialog.tsx`), regardless of whether the session is currently a
promotion. If an admin creates a plain (`apply_promotion = false`)
fixed-dates session and later wants to turn it into a promotion, they can
toggle `apply_promotion` on (it isn't locked yet, since `isExistingPromotion`
was false at creation) — but they then have no way to set a `promotion_price`
per date, because the `dates` array itself stays locked. Minor edge case, but
currently a silent dead end rather than a blocked/explained one.

### 11. `PATCH /api/admin/sessions/[id]/dates/[dateId]` is now dead code
Built for the per-date "signup open" admin toggle; that UI was removed per a
later decision ("managing dates is not allowed once a session/promotion is
created"). The route still exists and still works, just nothing calls it.
Harmless, but worth a deliberate call on whether to delete it or keep it for
a future admin tool.

---

## Per-role sweep (2026-09-19)

Went through every role's screens looking specifically for the two failure
patterns that kept recurring in the sections above: (a) something reading
`sessions.date`/`end_date` directly and rendering "Invalid date" for
`fixed_dates` sessions, and (b) something keying a calendar/grid view off
that same date range, making `fixed_dates` sessions invisible on it. Found
and fixed several more instances of both, beyond what earlier fixes already
covered (admin promotions dashboard/detail page, storefront, player/parent
session lists — all previously verified clean).

**Fixed this round:**
- `components/sessions/session-column.tsx` — the shared `DATE & TIME`
  column (`SESSION_COLUMNS` *and* `SESSION_COLUMNS_COACH`, so **both**
  `/portal/admin/sessions` and `/portal/coach/sessions` tables) showed
  "Invalid date-Invalid date" for `fixed_dates` rows. Now shows "N dates"
  instead, via one shared `DateTimeCell` used by both column sets.
- `app/portal/admin/sessions/page.tsx` / `app/portal/coach/sessions/page.tsx`
  — table-row mappers now guard the null `date` and pass `date_mode`/`dates`
  through to the table (needed by the fix above).
- `components/sessions/session-sheet-calender.tsx` — the weekly grid
  "Calendar" tab on those same two pages matched sessions purely by
  `date`/`end_date` range, so `fixed_dates` sessions never appeared on it at
  all. Now matches by occurrence date when `date_mode === 'fixed_dates'`.
- `components/coach/main-coach-page.tsx` (shared by the coach's own
  dashboard **and** the admin's coach-detail page) — same two bugs: the
  weekly-availability calendar silently dropped `fixed_dates` sessions
  (range-expansion loop never ran against `null`/`null`), and the "All
  Sessions" list showed "Invalid date". Both fixed; `dates[]` added to
  `app/api/admin/coaches/[id]/route.ts`'s session subquery to support it.
- `components/frontdesk/frontdesk-dashboard.tsx` — resolves audit item #7
  from above. The `BOOKING DATE` column was already correct (it reads
  `front_desk_actions.session_date`, which the front-desk POST fix already
  populates correctly for `fixed_dates`). The separate `DATE & TIME` column
  (session-level range) showed "Invalid date - Invalid date"; now shows
  "Multiple dates". `date_mode` added to the front-desk GET query and
  `FrontDeskActionData` type to support it.

**Follow-up — the two flagged items above are now fixed too:**

- `app/api/admin/parents/[id]/route.ts` — "Next Session" now resolves
  correctly for `fixed_dates` enrollments. Added a query for
  `payments.session_date` per child (`WHERE session_date IS NOT NULL`), and
  for any `childSessions` row with `date_mode === 'fixed_dates'`, the "next
  session" candidate list is built from that child's actual enrolled
  payment dates for that session instead of the always-null
  `sessions.date`. Other modes unchanged. Verified directly against the dev
  DB: created a fixed-dates enrollment, confirmed the route logic now
  resolves it as the next session instead of silently dropping it.
  `components/parents/main-parent-page.tsx`'s display of that date also had
  the same UTC-instant-vs-local-display bug as finding #1 (`payments.session_date`
  is a real `timestamptz`, and the old `moment(new Date(...))` call showed
  it a day early in `America/New_York`) — switched to `formatDateOnly()`
  from finding #1's fix; verified under `TZ=America/New_York` that it now
  shows the correct date.
- `components/players/main-player-page.tsx` — `generate12WeekCheckins()`
  no longer buckets by the parent session's `date` at all. It now buckets
  each check-in by that individual `attendance` record's own `created_at`
  timestamp, which every attendance record has regardless of the session's
  `date_mode`. This is a strictly more correct fix, not just a fixed-dates
  patch — it also fixes the same latent bug for any multi-day
  (`is_daily_payment`) session, where check-ins on different days were
  previously all lumped into one bucket keyed by the session's start date.

**Checked, no fix needed:**
- `app/portal/front-desk/register/page.tsx` — this screen registers new
  player/parent accounts and doesn't reference session dates or enrollment
  at all, so it's unaffected by this feature either way.

## What's *not* a bug (checked and ruled out)
- Non-promotional (`apply_promotion = false`) `fixed_dates` sessions **do**
  still surface to players — `/api/player/[id]/sessions` has no
  `apply_promotion` filter, so they show up on the player Sessions
  calendar/daily view even though they're invisible on the public storefront
  and the Promotions/Camps portal tabs (which both filter on
  `apply_promotion = true` by design).
- `session_dates` writes on PUT are correctly wrapped in the same transaction
  as the `sessions` row update — a failed insert mid-loop rolls back cleanly,
  no orphaned rows from a partial write.
- Capacity/left is correctly scoped per `session_id` — two different
  fixed-dates promotions that happen to share a calendar date don't bleed
  into each other's counts.
