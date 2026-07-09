-- Growth Sprint 5 - Daily Poker Challenge events
-- Run this in Supabase SQL Editor for the Kevixo project.

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
    'image_downloaded',
    'daily_challenge_attempted',
    'daily_challenge_completed'
  )
);
