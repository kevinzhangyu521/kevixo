create extension if not exists pgcrypto;

create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  training_key text not null,
  source text not null check (source in ('repeated_theme', 'latest_review', 'general')),
  review_id text null,
  title text not null,
  action text not null,
  completed_at timestamptz not null default now(),
  helpful boolean null,
  created_at timestamptz not null default now(),
  unique (user_id, training_key)
);

create index if not exists training_records_user_completed_idx
  on public.training_records (user_id, completed_at desc);

alter table public.training_records enable row level security;

drop policy if exists "Users read own training records" on public.training_records;
create policy "Users read own training records"
  on public.training_records for select to authenticated using (auth.uid() = user_id);