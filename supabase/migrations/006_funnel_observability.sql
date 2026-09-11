-- Funnel observability for signup through review persistence.
-- Run this in the Supabase SQL Editor after migrations 001-005.

drop policy if exists "Allow public growth event insert" on public.growth_events;
create policy "Allow public growth event insert"
on public.growth_events
for insert
to anon
with check (
  event_type in (
    'signup_succeeded',
    'email_confirmed',
    'login_succeeded',
    'review_viewed',
    'review_started',
    'analyze_succeeded',
    'analyze_failed',
    'review_persisted',
    'review_persist_failed',
    'review_completed',
    'share_clicked',
    'copy_link_clicked',
    'image_downloaded',
    'daily_challenge_attempted',
    'daily_challenge_completed'
  )
);
