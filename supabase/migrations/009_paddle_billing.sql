-- Paddle Billing Live subscription authority.
-- This migration is safe to re-run and preserves legacy Stripe columns for historical records.

alter table public.subscriptions
add column if not exists provider text not null default 'legacy',
add column if not exists paddle_customer_id text null,
add column if not exists paddle_subscription_id text null,
add column if not exists paddle_transaction_id text null,
add column if not exists next_billed_at timestamptz null,
add column if not exists scheduled_change jsonb null,
add column if not exists last_payment_status text null,
add column if not exists last_adjustment_action text null,
add column if not exists last_adjustment_status text null,
add column if not exists last_event_occurred_at timestamptz null;

create unique index if not exists subscriptions_paddle_subscription_id_key
on public.subscriptions (paddle_subscription_id)
where paddle_subscription_id is not null;

create index if not exists subscriptions_paddle_customer_id_idx
on public.subscriptions (paddle_customer_id)
where paddle_customer_id is not null;

create table if not exists public.paddle_webhook_events (
  event_id text primary key,
  event_type text not null,
  occurred_at timestamptz not null,
  processed_at timestamptz not null default now()
);

alter table public.paddle_webhook_events enable row level security;

drop policy if exists "No public Paddle webhook event access" on public.paddle_webhook_events;
create policy "No public Paddle webhook event access"
on public.paddle_webhook_events
for all
to public
using (false)
with check (false);

alter table public.profiles
add column if not exists plan text not null default 'free';

update public.profiles
set plan = 'coach'
where plan = 'pro';

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
add constraint profiles_plan_check
check (plan in ('free', 'coach'));

drop policy if exists "Allow public growth event insert" on public.growth_events;
create policy "Allow public growth event insert"
on public.growth_events
for insert
to anon
with check (
  event_type in (
    'signup_succeeded', 'email_confirmed', 'login_succeeded', 'review_viewed',
    'review_started', 'analyze_succeeded', 'analyze_failed', 'review_persisted',
    'review_persist_failed', 'review_completed', 'share_clicked', 'copy_link_clicked',
    'image_downloaded', 'daily_challenge_attempted', 'daily_challenge_completed',
    'checkout_started', 'checkout_completed', 'subscription_activated',
    'payment_failed', 'subscription_canceled'
  )
);
