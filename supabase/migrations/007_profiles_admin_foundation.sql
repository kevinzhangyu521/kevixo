-- Profiles admin foundation
-- Adds minimal account lifecycle fields for future /admin/users management.

alter table public.profiles
add column if not exists user_id uuid null references auth.users(id) on delete cascade,
add column if not exists role text not null default 'user',
add column if not exists plan text not null default 'free',
add column if not exists status text not null default 'active';

update public.profiles
set user_id = id
where user_id is null;

alter table public.profiles
alter column user_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_role_check
    check (role in ('user', 'admin'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_plan_check
    check (plan in ('free', 'pro'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_status_check
    check (status in ('active', 'disabled'));
  end if;
end $$;

create unique index if not exists profiles_user_id_key
on public.profiles (user_id);

create index if not exists profiles_role_idx
on public.profiles (role);

create index if not exists profiles_plan_idx
on public.profiles (plan);

create index if not exists profiles_status_idx
on public.profiles (status);

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id or auth.uid() = user_id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = id
  and auth.uid() = user_id
  and role = 'user'
  and plan = 'free'
  and status = 'active'
);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id or auth.uid() = user_id)
with check (auth.uid() = id and auth.uid() = user_id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, email, role, plan, status)
  values (new.id, new.id, coalesce(new.email, ''), 'user', 'free', 'active')
  on conflict (id) do update
  set user_id = excluded.user_id,
      email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.prevent_profile_account_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.role is distinct from old.role
    or new.plan is distinct from old.plan
    or new.status is distinct from old.status then
    raise exception 'Account management fields cannot be changed by users.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_account_fields on public.profiles;
create trigger protect_profile_account_fields
before update on public.profiles
for each row execute function public.prevent_profile_account_field_changes();
