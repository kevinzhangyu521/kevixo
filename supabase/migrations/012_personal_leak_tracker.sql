-- Sprint 012B - server-owned review source and deterministic decision themes
alter table public.hand_reviews
  add column if not exists review_source text null check (review_source in ('hand_history', 'demo')),
  add column if not exists decision_theme text null check (decision_theme in ('river_overcalling', 'thin_river_value', 'turn_bet_sizing', 'preflop_calling'));

create index if not exists hand_reviews_user_source_created_idx
  on public.hand_reviews (user_id, review_source, created_at desc);

create or replace function public.prevent_hand_review_evidence_field_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() <> 'service_role' and (
    new.review_source is not null or new.decision_theme is not null
  ) then
    raise exception 'Review evidence fields are managed by Kevixo.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_hand_review_evidence_fields on public.hand_reviews;
create trigger protect_hand_review_evidence_fields
before insert or update on public.hand_reviews
for each row execute function public.prevent_hand_review_evidence_field_changes();
