create extension if not exists pgcrypto;

create table if not exists public.review_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open', 'resolved')),
  useful_part text not null,
  message text not null default '',
  improvement text not null default '',
  grade text not null,
  browser text,
  review_id text,
  email text,
  source_page text not null default '/review'
);

create index if not exists review_feedback_created_at_idx
  on public.review_feedback (created_at desc);

create index if not exists review_feedback_status_idx
  on public.review_feedback (status);

create index if not exists review_feedback_source_page_idx
  on public.review_feedback (source_page);

alter table public.review_feedback enable row level security;

drop policy if exists "Allow anonymous review feedback inserts" on public.review_feedback;

create policy "Allow anonymous review feedback inserts"
  on public.review_feedback
  for insert
  to anon
  with check (
    status = 'open'
    and source_page = '/review'
    and char_length(coalesce(message, '')) <= 500
    and char_length(coalesce(improvement, '')) <= 500
  );
