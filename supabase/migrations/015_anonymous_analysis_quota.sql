-- One successful lifetime trial for an anonymous browser identity.
-- This migration does not activate enforcement; ANALYSIS_QUOTA_ENABLED remains the gate.
-- Only a one-way anonymous identifier hash is stored. Service-role code owns every RPC.

create table if not exists public.anonymous_analysis_quota_requests (
  request_id text primary key,
  anonymous_id_hash text not null check (anonymous_id_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint text not null,
  counts_toward_quota boolean not null,
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

create index if not exists anonymous_analysis_quota_subject_status_idx
  on public.anonymous_analysis_quota_requests (anonymous_id_hash, status);

create index if not exists anonymous_analysis_quota_reserved_expiry_idx
  on public.anonymous_analysis_quota_requests (expires_at)
  where status = 'reserved';

alter table public.anonymous_analysis_quota_requests enable row level security;

drop policy if exists "No public anonymous analysis quota access" on public.anonymous_analysis_quota_requests;
create policy "No public anonymous analysis quota access"
  on public.anonymous_analysis_quota_requests for all to public
  using (false) with check (false);

create or replace function public.reserve_anonymous_analysis_quota(
  p_anonymous_id_hash text,
  p_request_id text,
  p_request_fingerprint text,
  p_limit integer default 1,
  p_counts_toward_quota boolean default true
)
returns table (allowed boolean, status text, period_start text, result_json jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope constant text := 'lifetime';
  v_existing public.anonymous_analysis_quota_requests%rowtype;
  v_used integer;
begin
  if p_anonymous_id_hash is null or p_anonymous_id_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid anonymous analysis identifier.';
  end if;
  if p_request_id is null or btrim(p_request_id) = '' or char_length(p_request_id) > 128 then
    raise exception 'Invalid anonymous analysis request ID.';
  end if;
  if p_request_fingerprint is null or p_request_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid anonymous analysis request fingerprint.';
  end if;
  if p_limit <= 0 then raise exception 'Invalid anonymous analysis quota limit.'; end if;

  perform pg_advisory_xact_lock(hashtextextended('anonymous-analysis-request:' || p_request_id, 0));
  perform pg_advisory_xact_lock(hashtextextended('anonymous-analysis-subject:' || p_anonymous_id_hash, 0));

  select * into v_existing
  from public.anonymous_analysis_quota_requests as quota
  where quota.request_id = p_request_id
  for update;

  if found then
    if v_existing.anonymous_id_hash <> p_anonymous_id_hash then
      raise exception 'Anonymous analysis request belongs to another identity.';
    end if;
    if v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'Anonymous analysis request does not match the original input.';
    end if;
    if v_existing.status = 'succeeded' then
      return query select true, v_existing.status, v_scope, v_existing.result_json;
      return;
    elsif v_existing.status = 'reserved' and v_existing.expires_at > now() then
      return query select false, v_existing.status, v_scope, null::jsonb;
      return;
    end if;
  end if;

  update public.anonymous_analysis_quota_requests as quota
  set status = 'expired', updated_at = now(), completed_at = now()
  where quota.anonymous_id_hash = p_anonymous_id_hash
    and quota.status = 'reserved'
    and quota.expires_at <= now();

  select count(*)::integer into v_used
  from public.anonymous_analysis_quota_requests as quota
  where quota.anonymous_id_hash = p_anonymous_id_hash
    and quota.counts_toward_quota
    and quota.status in ('reserved', 'succeeded');

  if p_counts_toward_quota and v_used >= p_limit then
    insert into public.anonymous_analysis_quota_requests
      (request_id, anonymous_id_hash, request_fingerprint, counts_toward_quota, status, quota_limit, expires_at)
    values
      (p_request_id, p_anonymous_id_hash, p_request_fingerprint, p_counts_toward_quota, 'quota_exceeded', p_limit, null)
    on conflict (request_id) do update set
      anonymous_id_hash = excluded.anonymous_id_hash,
      request_fingerprint = excluded.request_fingerprint,
      counts_toward_quota = excluded.counts_toward_quota,
      status = excluded.status,
      quota_limit = excluded.quota_limit,
      review_id = null,
      result_json = null,
      reserved_at = now(),
      expires_at = null,
      completed_at = null,
      updated_at = now();
    return query select false, 'quota_exceeded'::text, v_scope, null::jsonb;
    return;
  end if;

  insert into public.anonymous_analysis_quota_requests
    (request_id, anonymous_id_hash, request_fingerprint, counts_toward_quota, status, quota_limit, expires_at)
  values
    (p_request_id, p_anonymous_id_hash, p_request_fingerprint, p_counts_toward_quota, 'reserved', p_limit, now() + interval '15 minutes')
  on conflict (request_id) do update set
    anonymous_id_hash = excluded.anonymous_id_hash,
    request_fingerprint = excluded.request_fingerprint,
    counts_toward_quota = excluded.counts_toward_quota,
    status = excluded.status,
    quota_limit = excluded.quota_limit,
    review_id = null,
    result_json = null,
    reserved_at = now(),
    expires_at = excluded.expires_at,
    completed_at = null,
    updated_at = now();
  return query select true, 'reserved'::text, v_scope, null::jsonb;
end;
$$;

create or replace function public.confirm_anonymous_analysis_quota(
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
  v_request public.anonymous_analysis_quota_requests%rowtype;
  v_anonymous_id_hash text;
begin
  select quota.anonymous_id_hash into v_anonymous_id_hash
  from public.anonymous_analysis_quota_requests as quota
  where quota.request_id = p_request_id;
  if not found then raise exception 'Anonymous analysis quota request not found.'; end if;

  perform pg_advisory_xact_lock(hashtextextended('anonymous-analysis-subject:' || v_anonymous_id_hash, 0));
  select * into v_request
  from public.anonymous_analysis_quota_requests as quota
  where quota.request_id = p_request_id
  for update;

  if v_request.request_fingerprint <> p_request_fingerprint then
    raise exception 'Anonymous analysis request does not match the original input.';
  end if;
  if v_request.status = 'reserved' and v_request.expires_at <= now() then
    update public.anonymous_analysis_quota_requests
    set status = 'expired', completed_at = now(), updated_at = now()
    where request_id = p_request_id;
    return query select 'expired'::text;
    return;
  elsif v_request.status = 'reserved' then
    update public.anonymous_analysis_quota_requests
    set status = 'succeeded', review_id = p_review_id, result_json = p_result_json,
      completed_at = now(), updated_at = now()
    where request_id = p_request_id;
    return query select 'succeeded'::text;
    return;
  end if;
  return query select v_request.status;
end;
$$;

create or replace function public.release_anonymous_analysis_quota(
  p_request_id text,
  p_request_fingerprint text
)
returns table (status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.anonymous_analysis_quota_requests%rowtype;
  v_anonymous_id_hash text;
begin
  select quota.anonymous_id_hash into v_anonymous_id_hash
  from public.anonymous_analysis_quota_requests as quota
  where quota.request_id = p_request_id;
  if not found then raise exception 'Anonymous analysis quota request not found.'; end if;

  perform pg_advisory_xact_lock(hashtextextended('anonymous-analysis-subject:' || v_anonymous_id_hash, 0));
  select * into v_request
  from public.anonymous_analysis_quota_requests as quota
  where quota.request_id = p_request_id
  for update;

  if v_request.request_fingerprint <> p_request_fingerprint then
    raise exception 'Anonymous analysis request does not match the original input.';
  end if;
  if v_request.status = 'reserved' then
    update public.anonymous_analysis_quota_requests
    set status = 'failed', completed_at = now(), updated_at = now()
    where request_id = p_request_id;
    return query select 'failed'::text;
    return;
  end if;
  return query select v_request.status;
end;
$$;

create or replace function public.expire_anonymous_analysis_quota_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer;
begin
  update public.anonymous_analysis_quota_requests
  set status = 'expired', completed_at = now(), updated_at = now()
  where status = 'reserved' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on public.anonymous_analysis_quota_requests from public, anon, authenticated;
revoke all on function public.reserve_anonymous_analysis_quota(text, text, text, integer, boolean) from public, anon, authenticated;
revoke all on function public.confirm_anonymous_analysis_quota(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.release_anonymous_analysis_quota(text, text) from public, anon, authenticated;
revoke all on function public.expire_anonymous_analysis_quota_reservations() from public, anon, authenticated;
grant execute on function public.reserve_anonymous_analysis_quota(text, text, text, integer, boolean) to service_role;
grant execute on function public.confirm_anonymous_analysis_quota(text, text, text, jsonb) to service_role;
grant execute on function public.release_anonymous_analysis_quota(text, text) to service_role;
grant execute on function public.expire_anonymous_analysis_quota_reservations() to service_role;
