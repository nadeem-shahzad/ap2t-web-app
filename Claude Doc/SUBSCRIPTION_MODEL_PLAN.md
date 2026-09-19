# Plan: Recurring Subscription / Membership Model

## Context

The flyer describes two recurring membership tiers for the in-person Training
Program at Metuchen SportsCenter (Mon–Fri, 4–6pm):

- **2x Per Week** — $200/month
- **Unlimited Classes** — $400/month

This is different from what exists today. Right now:

- `sessions` + `session_players` + `payments` model **one-time enrollment** in
  a specific session/camp/clinic (single charge, single or per-date booking —
  see `PROMOTIONS_FIXED_DATES_PLAN.md` for the per-date work).
- `components/landing/pricing-section.tsx` is a **static marketing page**
  (General/Quarterly/Elite "at-home program" plans) with no checkout behind
  it — the "Choose Plan" / "Purchase" buttons just link to `/portal/auth?p=signup`.
  There is no subscription billing anywhere in the codebase today.
- The codebase already stores a **card on file** per user
  (`users.square_customer_id`, `users.square_card_id`, set via
  `components/square/payment-method-steps.tsx` / `app/api/user/card/route.ts`)
  and already charges that stored card directly for one-off session payments
  (`app/api/admin/sessions/[id]/participants/route.ts`). This is the
  foundation recurring billing can build on.
- There is **no webhook receiver**, **no cron/scheduler**, and no
  subscription-related table in the DB today. `square_connections` already
  has unused `test_webhook`/`live_webhook` columns (currently just stored,
  never consumed).

**Open question to confirm before implementation:** is this membership meant
to replace/extend the existing static "at-home program" pricing section, or
is it a separate, new product (in-person Training Program access) that will
live alongside it? The plan below assumes it's a new, separate product tied
to attending the recurring Training Program sessions, since that matches the
flyer. Confirm before building the marketing-page changes.

## Two implementation approaches

### Option A (recommended): Square's native Subscriptions API

Square has a purpose-built recurring billing system: Catalog subscription
plans/variations, a Subscriptions API, Invoices, and webhooks for
`subscription.updated`, `invoice.payment_made`, `invoice.payment_failed`,
etc. Square owns the billing calendar, retry/dunning logic on failed cards,
and proration.

**Pros:** don't have to hand-roll retry/dunping logic or a billing calendar;
PCI/compliance burden for recurring charges stays with Square; failed-payment
retries and receipts are handled by Square automatically.
**Cons:** more upfront integration work — Catalog setup (per environment,
since sandbox/live catalogs are separate, matching the existing
sandbox/live split in `square_connections`), a webhook receiver with
signature verification, and syncing Square's subscription/invoice state back
into our DB so the app UI stays accurate.

### Option B: Self-rolled recurring billing via cron

Reuse the existing one-off charge pattern
(`squareClient.payments.create({ sourceId: card_id, customerId: customer_id, amount })`)
on a schedule: a `subscriptions` table tracks `next_billing_date`, and a
scheduled job charges every subscription whose date has arrived, records the
result, and advances the date by one billing interval.

**Pros:** much less integration surface — no Catalog, no webhooks, reuses
code that already exists and is proven in this app.
**Cons:** we own retry/dunning (what happens when a card declines — retry in
1 day? 3 days? cancel after N failures?), we own proration for
signups/cancellations mid-cycle, and a stuck/failed cron run can silently
skip billing a customer if not monitored carefully.

**Recommendation:** Option A if this membership product is expected to be a
durable, primary revenue line (worth the integration cost, and correctness
of billing matters a lot). Option B if this is a first pass to validate the
membership idea quickly and correctness tolerance is a bit looser — it can
be migrated to Option A later without touching the player/parent-facing UI,
since the DB model in the "Data model" section below is compatible with
either.

## Data model (works for either option)

```sql
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,                 -- "2x Per Week", "Unlimited Classes"
  description TEXT,
  price NUMERIC NOT NULL,             -- monthly price
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  session_limit_per_week INTEGER,     -- NULL = unlimited
  is_active BOOLEAN NOT NULL DEFAULT true,
  square_catalog_plan_id TEXT,        -- only used by Option A
  square_catalog_variation_id TEXT,   -- only used by Option A
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  player_user_id INTEGER NOT NULL REFERENCES users(id),
  payer_user_id INTEGER NOT NULL REFERENCES users(id),   -- parent or player, whoever's card is charged
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active | past_due | paused | canceled
  square_subscription_id TEXT,           -- only used by Option A
  square_customer_id TEXT NOT NULL,
  square_card_id TEXT NOT NULL,
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  next_billing_date DATE,                -- only used by Option B
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscription_invoices (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,                  -- pending | paid | failed
  square_payment_id TEXT,
  failure_reason TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

This is additive — no existing tables change shape (aside from optionally
linking check-ins, below), consistent with the safe-migration approach used
for the fixed-dates promotions work.

## Enforcing "2x per week" vs "Unlimited"

The Training Program itself is presumably represented as recurring
`sessions` rows (Mon–Fri, 4–6pm at Metuchen SportsCenter) that a member
checks into, not a one-off registration. To cap attendance:

- Add a `subscription_id` (nullable) column to `session_players`, set when a
  subscriber checks into a Training Program session (likely via the
  front-desk flow in `app/api/front-desk/route.ts`, which already resolves a
  player's card/customer for payment — same lookup pattern extends to
  resolving their active subscription instead of charging per visit).
- At check-in time, count `session_players` rows for that `subscription_id`
  within the current calendar week (Mon–Sun, matching the program's Mon–Fri
  schedule). If the plan has `session_limit_per_week` and the count is
  already at the limit, block the check-in (or prompt front-desk to charge a
  drop-in rate instead — a business-logic decision to confirm).
- `session_limit_per_week = NULL` (Unlimited plan) skips the check entirely.

This reuses the existing front-desk check-in code path rather than building
a separate attendance system.

## Admin UI

- New `app/portal/admin/subscription-plans/` page: CRUD for
  `subscription_plans` (name, price, weekly limit, active toggle). Mirrors
  the existing admin session/promotion CRUD patterns already in the codebase.
- New `app/portal/admin/subscriptions/` page: list all subscriptions with
  status, plan, next billing date, and a per-subscriber billing history
  (from `subscription_invoices`). Actions: pause, cancel, manually retry a
  failed charge.
- Failed-payment visibility: surface `past_due` subscriptions prominently
  (similar to how pending payments are already surfaced today), since a
  membership with a declined card needs staff follow-up.

## Player/Parent portal UI

- New `/portal/player/membership` (and parent equivalent): choose a plan,
  reuse the existing card-on-file flow
  (`components/square/payment-method-steps.tsx`) to save/charge a card,
  create the `subscriptions` row (Option A: call Square Subscriptions API
  first, store the returned `square_subscription_id`; Option B: compute
  `current_period_end`/`next_billing_date` directly).
- Show current plan, next billing date, weekly usage (`X of 2 sessions used
  this week` for capped plans), and a cancel/pause action.
- Billing history table sourced from `subscription_invoices`.

## Webhooks (Option A only)

- New `app/api/square/webhooks/route.ts`: verify Square's webhook signature
  using a signing secret (store it properly — the existing
  `test_webhook`/`live_webhook` columns in `square_connections` look like
  they were meant for this but are currently unused; confirm whether they
  hold a URL or a signature key before reusing them, they may need a
  dedicated `webhook_signature_key` column instead).
- Handle `subscription.updated` (sync `status`, `current_period_*`) and
  `invoice.payment_made` / `invoice.payment_failed` (insert a
  `subscription_invoices` row, flip `subscriptions.status` to `past_due` on
  failure).

## Scheduler (Option B only, or Option A reconciliation)

- No cron infrastructure exists in this repo today. Needs a scheduled
  trigger — e.g. Vercel Cron (if deployed on Vercel — confirm hosting
  platform) hitting a protected `app/api/cron/subscriptions/route.ts`, or an
  external scheduler (cron-job.org, GitHub Actions on a schedule) calling
  that same protected route with a shared secret.
- Even with Option A, a daily reconciliation job that cross-checks Square's
  subscription state against our DB is good practice in case a webhook is
  missed.

## Failed payment / dunning policy (needs a decision either way)

- How many retry attempts before a membership is auto-canceled?
- Does a `past_due` member lose access immediately, or get a grace period?
- Who gets notified on failure — the payer only, or also an admin?

These are business decisions, not technical ones — confirm before building
the retry/notification logic.

## Migration strategy

Same approach as the fixed-dates promotions plan: since there is no staging
database, use a **Neon branch** to build and test the new tables + billing
logic end-to-end (including simulated Square sandbox charges) before
applying the additive migration to production. No schema change touches
existing tables' required columns, so it stays low-risk to apply once
verified.

## Suggested build order

1. Data model migration (Neon branch first).
2. Admin plan management (CRUD for `subscription_plans`).
3. Player/parent checkout flow + `subscriptions` row creation (start with
   Option A or B per the decision above).
4. Billing execution (Square Subscriptions + webhook receiver, or cron +
   direct charge).
5. Front-desk check-in integration for weekly-limit enforcement.
6. Admin subscription management/reporting (pause, cancel, retry, billing
   history).

## Open questions to resolve before implementation

1. Is this a new/separate product from the existing static "at-home program"
   pricing section, or does it replace it?
2. Option A (Square Subscriptions API) vs Option B (self-rolled cron
   billing)?
3. Who is billed — always the parent (if the player is a minor), or whoever
   saved a card?
4. Dunning policy: retry count, grace period, access loss timing,
   notification recipients.
5. What happens when a capped-plan member tries to check in past their
   weekly limit — blocked entirely, or offered a drop-in charge?
6. Hosting platform (needed to pick the scheduler mechanism for Option B or
   for reconciliation under Option A) — is this deployed on Vercel?
