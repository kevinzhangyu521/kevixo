-- Growth Sprint 2 - Review history and retention metrics
-- Run this in Supabase SQL Editor for the Kevixo project.

create table if not exists public.growth_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  review_id text null,
  visitor_id text null,
  source_page text not null default '/review',
  user_agent text null
);

create table if not exists public.email_captures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  review_id text null,
  visitor_id text null,
  source_page text not null default '/review',
  user_agent text null
);

alter table public.growth_events enable row level security;
alter table public.email_captures enable row level security;

drop policy if exists "Allow public growth event insert" on public.growth_events;
create policy "Allow public growth event insert"
on public.growth_events
for insert
to anon
with check (
  event_type in (
    'review_started',
    'review_completed',
    'share_clicked',
    'copy_link_clicked',
    'image_downloaded'
  )
);

drop policy if exists "Allow public email capture insert" on public.email_captures;
create policy "Allow public email capture insert"
on public.email_captures
for insert
to anon
with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

create index if not exists growth_events_created_at_idx
on public.growth_events (created_at desc);

create index if not exists growth_events_event_type_idx
on public.growth_events (event_type);

create index if not exists growth_events_visitor_id_idx
on public.growth_events (visitor_id);

create index if not exists email_captures_created_at_idx
on public.email_captures (created_at desc);

create index if not exists email_captures_email_idx
on public.email_captures (email);
