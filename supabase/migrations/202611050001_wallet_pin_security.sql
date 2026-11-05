-- BRITUME WALLET PIN SECURITY
-- Migration: 202611050001_wallet_pin_security.sql

create extension if not exists pgcrypto with schema extensions;

-- 1. PIN credentials
create table if not exists public.wallet_pin_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pin_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PIN recovery requests
create table if not exists public.wallet_pin_recovery_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'under_review', 'approved', 'rejected')),
  requested_at timestamptz not null default now(),
  review_after timestamptz not null default (now() + interval '24 hours'),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  branch_verification_notes text,
  admin_decision_notes text
);

create index if not exists wallet_pin_recovery_user_idx
on public.wallet_pin_recovery_requests(user_id, requested_at desc);

-- 3. Prevent direct client access to security tables
alter table public.wallet_pin_credentials enable row level security;
alter table public.wallet_pin_recovery_requests enable row level security;

revoke all on public.wallet_pin_credentials from anon, authenticated;
revoke all on public.wallet_pin_recovery_requests from anon, authenticated;

-- 4. Check whether the current user has a PIN
create or replace function public.wallet_pin_status()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object(
      'configured', false,
      'message', 'Authentication required.'
    );
  end if;

  return jsonb_build_object(
    'configured',
    exists (
      select 1
      from public.wallet_pin_credentials
      where user_id = v_user_id
    )
  );
end;
$$;

-- 5. Create a wallet PIN
create or replace function public.create_wallet_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Authentication required.'
    );
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    return jsonb_build_object(
      'success', false,
      'message', 'PIN must contain 4 to 6 digits.'
    );
  end if;

  if exists (
    select 1
    from public.wallet_pin_credentials
    where user_id = v_user_id
  ) then
    return jsonb_build_object(
      'success', false,
      'message', 'A wallet PIN already exists.'
    );
  end if;

  insert into public.wallet_pin_credentials (
    user_id,
    pin_hash
  )
  values (
    v_user_id,
    extensions.crypt(p_pin, extensions.gen_salt('bf', 12))
  );

  return jsonb_build_object('success', true);
end;
$$;

-- 6. Verify the wallet PIN with attempt limiting
create or replace function public.verify_wallet_pin(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_hash text;
  v_attempts integer;
  v_locked_until timestamptz;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Authentication required.'
    );
  end if;

  if p_pin is null or p_pin !~ '^[0-9]{4,6}$' then
    return jsonb_build_object(
      'success', false,
      'message', 'Invalid PIN format.'
    );
  end if;

  select pin_hash, failed_attempts, locked_until
  into v_hash, v_attempts, v_locked_until
  from public.wallet_pin_credentials
  where user_id = v_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'message', 'Wallet PIN has not been created.'
    );
  end if;

  if v_locked_until is not null and v_locked_until > now() then
    return jsonb_build_object(
      'success', false,
      'message', 'Too many attempts. Please try again later.'
    );
  end if;

  if extensions.crypt(p_pin, v_hash) = v_hash then
    update public.wallet_pin_credentials
    set failed_attempts = 0,
        locked_until = null,
        updated_at = now()
    where user_id = v_user_id;

    return jsonb_build_object('success', true);
  end if;

  v_attempts := v_attempts + 1;

  update public.wallet_pin_credentials
  set failed_attempts = v_attempts,
      locked_until = case
        when v_attempts >= 5 then now() + interval '15 minutes'
        else null
      end,
      updated_at = now()
  where user_id = v_user_id;

  return jsonb_build_object(
    'success', false,
    'message',
    case
      when v_attempts >= 5 then
        'Too many incorrect attempts. Wallet PIN verification is temporarily locked.'
      else
        'Incorrect PIN.'
    end
  );
end;
$$;

-- 7. Submit a forgotten-PIN recovery request
create or replace function public.request_wallet_pin_reset(p_reason text default '')
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Authentication required.'
    );
  end if;

  if exists (
    select 1
    from public.wallet_pin_recovery_requests
    where user_id = v_user_id
      and status in ('pending', 'under_review')
  ) then
    return jsonb_build_object(
      'success', false,
      'message', 'You already have an active recovery request.'
    );
  end if;

  insert into public.wallet_pin_recovery_requests (
    user_id,
    reason
  )
  values (
    v_user_id,
    left(coalesce(p_reason, ''), 1000)
  )
  returning id into v_request_id;

  return jsonb_build_object(
    'success', true,
    'status', 'pending',
    'request_id', v_request_id,
    'message', 'Your request has been submitted for review.'
  );
end;
$$;

-- 8. Restrict RPC execution to authenticated users
revoke all on function public.wallet_pin_status() from public, anon;
revoke all on function public.create_wallet_pin(text) from public, anon;
revoke all on function public.verify_wallet_pin(text) from public, anon;
revoke all on function public.request_wallet_pin_reset(text) from public, anon;

grant execute on function public.wallet_pin_status() to authenticated;
grant execute on function public.create_wallet_pin(text) to authenticated;
grant execute on function public.verify_wallet_pin(text) to authenticated;
grant execute on function public.request_wallet_pin_reset(text) to authenticated;
