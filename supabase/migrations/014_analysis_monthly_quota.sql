-- Monthly analysis quota foundation. This migration does not activate enforcement.
-- Only server-side service-role code may execute the lifecycle functions.

create table if not exists public.analysis_quota_requests (
  request_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_fingerprint text not null,
  counts_toward_quota boolean not null,
  period_start date not null,
  status text not null check (status in ('reserved', 'succeeded', 'failed', 'expired', 'quota_exceeded')),
  quota_limit integer not null check (quota_limit > 0),
  review_id text null,
  result_json jsonb null,
  reserved_at timestamptz not null default now(),
  expires_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analysis_quota_user_period_status_idx
  on public.analysis_quota_requests (user_id, period_start, status);

create index if not exists analysis_quota_reserved_expiry_idx
  on public.analysis_quota_requests (expires_at)
  where status = 'reserved';

alter table public.analysis_quota_requests enable row level security;

drop policy if exists "No public analysis quota access" on public.analysis_quota_requests;
create policy "No public analysis quota access"
  on public.analysis_quota_requests for all to public
  using (false) with check (false);

create or replace function public.reserve_analysis_quota(
  p_user_id uuid,
  p_request_id text,
  p_request_fingerprint text,
  p_limit integer default 10,
  p_counts_toward_quota boolean default true
)
returns table (allowed boolean, status text, period_start date, result_json jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start date := date_trunc('month', timezone('UTC', now()))::date;
  v_existing public.analysis_quota_requests%rowtype;
  v_used integer;
begin
  if p_request_id is null or btrim(p_request_id) = '' or char_length(p_request_id) > 128 then
    raise exception 'Invalid analysis quota request ID.';
  end if;
  if p_request_fingerprint is null or p_request_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid analysis quota request fingerprint.';
  end if;
  if p_limit <= 0 then raise exception 'Invalid analysis quota limit.'; end if;

  perform pg_advisory_xact_lock(hashtextextended('analysis-request:' || p_request_id, 0));
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || v_period_start::text, 0));

  select * into v_existing from public.analysis_quota_requests where request_id = p_request_id for update;
  if found then
    if v_existing.user_id <> p_user_id then raise exception 'Analysis quota request belongs to another user.'; end if;
    if v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'Analysis quota request does not match the original input.';
    end if;
    if v_existing.status = 'succeeded' then
      return query select true, v_existing.status, v_existing.period_start, v_existing.result_json;
      return;
    elsif v_existing.status = 'reserved' and v_existing.expires_at > now() then
      return query select false, v_existing.status, v_existing.period_start, null::jsonb;
      return;
    elsif v_existing.status = 'quota_exceeded' and v_existing.period_start = v_period_start
      and p_counts_toward_quota then
      return query select false, v_existing.status, v_existing.period_start, null::jsonb;
      return;
    end if;
  end if;

  update public.analysis_quota_requests as quota
  set status = 'expired', updated_at = now(), completed_at = now()
  where quota.user_id = p_user_id and quota.period_start = v_period_start
    and quota.status = 'reserved' and quota.expires_at <= now();

  select count(*)::integer into v_used
  from public.analysis_quota_requests as quota
  where quota.user_id = p_user_id and quota.period_start = v_period_start
    and quota.counts_toward_quota
    and quota.status in ('reserved', 'succeeded');

  if p_counts_toward_quota and v_used >= p_limit then
    insert into public.analysis_quota_requests
      (request_id, user_id, request_fingerprint, counts_toward_quota, period_start, status, quota_limit, expires_at)
    values (p_request_id, p_user_id, p_request_fingerprint, p_counts_toward_quota, v_period_start, 'quota_exceeded', p_limit, null)
    on conflict (request_id) do update set
      period_start = excluded.period_start,
      status = excluded.status,
      quota_limit = excluded.quota_limit,
      counts_toward_quota = excluded.counts_toward_quota,
      review_id = null,
      result_json = null,
      reserved_at = now(),
      expires_at = null,
      completed_at = null,
      updated_at = now();
    return query select false, 'quota_exceeded'::text, v_period_start, null::jsonb;
    return;
  end if;

  insert into public.analysis_quota_requests
    (request_id, user_id, request_fingerprint, counts_toward_quota, period_start, status, quota_limit, expires_at)
  values (p_request_id, p_user_id, p_request_fingerprint, p_counts_toward_quota, v_period_start, 'reserved', p_limit, now() + interval '15 minutes')
  on conflict (request_id) do update set
    period_start = excluded.period_start,
    status = excluded.status,
    quota_limit = excluded.quota_limit,
    counts_toward_quota = excluded.counts_toward_quota,
    review_id = null,
    result_json = null,
    reserved_at = now(),
    expires_at = excluded.expires_at,
    completed_at = null,
    updated_at = now();
  return query select true, 'reserved'::text, v_period_start, null::jsonb;
end;
$$;

create or replace function public.confirm_analysis_quota(
  p_request_id text,
  p_request_fingerprint text,
  p_review_id text,
  p_result_json jsonb
)
returns table (status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.analysis_quota_requests%rowtype;
  v_user_id uuid;
  v_period_start date;
begin
  select user_id, period_start into v_user_id, v_period_start
  from public.analysis_quota_requests where request_id = p_request_id;
  if not found then raise exception 'Analysis quota request not found.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || v_period_start::text, 0));
  select * into v_request from public.analysis_quota_requests where request_id = p_request_id for update;
  if v_request.request_fingerprint <> p_request_fingerprint then
    raise exception 'Analysis quota request does not match the original input.';
  end if;

  if v_request.status = 'reserved' and v_request.expires_at <= now() then
    update public.analysis_quota_requests set status = 'expired', completed_at = now(), updated_at = now()
    where request_id = p_request_id;
    return query select 'expired'::text;
    return;
  elsif v_request.status = 'reserved' then
    update public.analysis_quota_requests
    set status = 'succeeded', review_id = p_review_id, result_json = p_result_json,
      completed_at = now(), updated_at = now()
    where request_id = p_request_id;
    return query select 'succeeded'::text;
    return;
  end if;

  return query select v_request.status;
end;
$$;

create or replace function public.release_analysis_quota(p_request_id text, p_request_fingerprint text)
returns table (status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.analysis_quota_requests%rowtype;
  v_user_id uuid;
  v_period_start date;
begin
  select user_id, period_start into v_user_id, v_period_start
  from public.analysis_quota_requests where request_id = p_request_id;
  if not found then raise exception 'Analysis quota request not found.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text || ':' || v_period_start::text, 0));
  select * into v_request from public.analysis_quota_requests where request_id = p_request_id for update;
  if v_request.request_fingerprint <> p_request_fingerprint then
    raise exception 'Analysis quota request does not match the original input.';
  end if;

  if v_request.status = 'reserved' then
    update public.analysis_quota_requests
    set status = 'failed', completed_at = now(), updated_at = now()
    where request_id = p_request_id;
    return query select 'failed'::text;
    return;
  end if;
  return query select v_request.status;
end;
$$;

create or replace function public.expire_analysis_quota_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  update public.analysis_quota_requests
  set status = 'expired', completed_at = now(), updated_at = now()
  where status = 'reserved' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on public.analysis_quota_requests from public, anon, authenticated;
revoke all on function public.reserve_analysis_quota(uuid, text, text, integer, boolean) from public, anon, authenticated;
revoke all on function public.confirm_analysis_quota(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.release_analysis_quota(text, text) from public, anon, authenticated;
revoke all on function public.expire_analysis_quota_reservations() from public, anon, authenticated;
grant execute on function public.reserve_analysis_quota(uuid, text, text, integer, boolean) to service_role;
grant execute on function public.confirm_analysis_quota(text, text, text, jsonb) to service_role;
grant execute on function public.release_analysis_quota(text, text) to service_role;
grant execute on function public.expire_analysis_quota_reservations() to service_role;
