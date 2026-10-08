-- Sprint 012A - authenticated Daily Challenge history
create extension if not exists pgcrypto;

create table if not exists public.daily_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id text not null,
  challenge_version text not null,
  challenge_date date not null,
  selected_option_id text not null,
  completed_at timestamptz not null default now(),
  challenge_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_date, challenge_id, challenge_version)
);

create index if not exists daily_challenge_attempts_user_completed_idx
  on public.daily_challenge_attempts (user_id, completed_at desc);

alter table public.daily_challenge_attempts enable row level security;

drop policy if exists "Users can read their own daily challenge attempts" on public.daily_challenge_attempts;
create policy "Users can read their own daily challenge attempts"
  on public.daily_challenge_attempts
  for select to authenticated
  using (auth.uid() = user_id);

create table if not exists public.daily_challenge_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null unique references public.daily_challenge_attempts(id) on delete cascade,
  helpful boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_challenge_feedback_user_idx
  on public.daily_challenge_feedback (user_id);

alter table public.daily_challenge_feedback enable row level security;

drop policy if exists "Users can read their own daily challenge feedback" on public.daily_challenge_feedback;
create policy "Users can read their own daily challenge feedback"
  on public.daily_challenge_feedback
  for select to authenticated
  using (auth.uid() = user_id);
