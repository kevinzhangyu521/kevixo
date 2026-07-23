-- Profiles lifecycle repair
-- Re-runnable repair for auth.users -> profiles creation and existing missing profiles.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text null,
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists user_id uuid null references auth.users(id) on delete cascade,
add column if not exists role text not null default 'user',
add column if not exists plan text not null default 'free',
add column if not exists status text not null default 'active';

update public.profiles
set user_id = id
where user_id is null;

insert into public.profiles (id, user_id, email, role, plan, status)
select
  users.id,
  users.id,
  coalesce(users.email, ''),
  'user',
  'free',
  'active'
from auth.users as users
left join public.profiles as profiles
  on profiles.id = users.id
where profiles.id is null
on conflict (id) do update
set user_id = excluded.user_id,
    email = excluded.email,
    updated_at = now();

alter table public.profiles
alter column user_id set not null;

alter table public.profiles enable row level security;

create unique index if not exists profiles_user_id_key
on public.profiles (user_id);

create index if not exists profiles_email_idx
on public.profiles (email);

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
