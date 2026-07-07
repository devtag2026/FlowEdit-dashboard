-- Billing & subscription management: store the Stripe subscription id plus
-- pending-downgrade state on profiles so the app can upgrade/downgrade the
-- existing subscription (src/app/api/stripe/subscription/change-plan/route.js)
-- instead of creating a second one through Checkout.
--
-- pending_plan / stripe_schedule_id are only set while a period-end downgrade
-- is scheduled (Stripe Subscription Schedule); the webhook clears them when
-- the schedule flips or is released. current_period_end lets the UI show
-- "changes on {date}" without a Stripe round-trip.

alter table public.profiles
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_schedule_id     text,
  add column if not exists pending_plan           text,
  add column if not exists current_period_end     timestamptz;

alter table public.pending_subscriptions
  add column if not exists stripe_subscription_id text;

create index if not exists profiles_stripe_subscription_id_idx
  on public.profiles (stripe_subscription_id);
