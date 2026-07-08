create extension if not exists pgcrypto;

create table if not exists public.hand_reviews (
  id uuid primary key default gen_random_uuid(),
  review_id text unique not null,
  created_at timestamptz not null default now(),
  hand_history text not null,
  review_json jsonb not null,
  grade text,
  confidence int,
  difficulty text,
  source_page text not null default '/review',
  user_agent text,
  ai_version text not null default 'v1'
);

create index if not exists hand_reviews_review_id_idx
  on public.hand_reviews (review_id);

create index if not exists hand_reviews_created_at_idx
  on public.hand_reviews (created_at desc);

alter table public.hand_reviews enable row level security;

drop policy if exists "Allow anonymous hand review inserts" on public.hand_reviews;

create policy "Allow anonymous hand review inserts"
  on public.hand_reviews
  for insert
  to anon
  with check (
    source_page = '/review'
    and review_id <> ''
    and char_length(hand_history) > 0
    and jsonb_typeof(review_json) = 'object'
  );
