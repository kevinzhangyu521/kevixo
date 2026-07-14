-- Revenue Sprint 1 - Kevixo Coach subscription foundation
-- Run this in Supabase SQL Editor for the Kevixo project.

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'coach',
  status text not null default 'inactive',
  stripe_customer_id text null,
  stripe_subscription_id text null unique,
  current_period_end timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their own subscription" on public.subscriptions;
create policy "Users can read their own subscription"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create index if not exists subscriptions_user_id_idx
on public.subscriptions (user_id);

create index if not exists subscriptions_status_idx
on public.subscriptions (status);

create index if not exists subscriptions_stripe_customer_id_idx
on public.subscriptions (stripe_customer_id);

alter table public.hand_reviews
add column if not exists user_id uuid null references auth.users(id) on delete set null;

alter table public.review_feedback
add column if not exists user_id uuid null references auth.users(id) on delete set null;

alter table public.growth_events
add column if not exists user_id uuid null references auth.users(id) on delete set null;

alter table public.email_captures
add column if not exists user_id uuid null references auth.users(id) on delete set null;

create index if not exists hand_reviews_user_id_idx
on public.hand_reviews (user_id);

create index if not exists review_feedback_user_id_idx
on public.review_feedback (user_id);

create index if not exists growth_events_user_id_idx
on public.growth_events (user_id);

create index if not exists email_captures_user_id_idx
on public.email_captures (user_id);
