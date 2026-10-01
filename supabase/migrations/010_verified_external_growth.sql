-- Admin-controlled test-account marker for verified external-user metrics.
alter table public.profiles
add column if not exists is_test_account boolean not null default false;

create or replace function public.prevent_profile_account_field_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' then return new; end if;
  if new.user_id is distinct from old.user_id
    or new.role is distinct from old.role
    or new.plan is distinct from old.plan
    or new.status is distinct from old.status
    or new.is_test_account is distinct from old.is_test_account then
    raise exception 'Account management fields cannot be changed by users.';
  end if;
  return new;
end;
$$;
