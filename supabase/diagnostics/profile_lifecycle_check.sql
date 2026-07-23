-- Profile lifecycle diagnostics
-- Run manually in Supabase SQL Editor.

select
  trigger_name,
  event_manipulation,
  event_object_schema,
  event_object_table,
  action_timing,
  action_statement
from information_schema.triggers
where trigger_schema = 'auth'
  and event_object_table = 'users'
  and trigger_name = 'on_auth_user_created_profile';

select
  proname as function_name,
  prosecdef as is_security_definer
from pg_proc
where proname = 'handle_new_user_profile';

select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;

select
  count(*) as auth_users_missing_profiles
from auth.users as users
left join public.profiles as profiles
  on profiles.id = users.id
where profiles.id is null;

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
order by ordinal_position;
