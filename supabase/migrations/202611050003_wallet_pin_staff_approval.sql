-- BRITUME WALLET PIN STAFF APPROVAL
-- Migration: 202611050003_wallet_pin_staff_approval.sql

-- Only the project owner/service role should assign staff roles.
-- Never expose direct table access to app users.

create table if not exists public.wallet_pin_recovery_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'branch_employee')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.wallet_pin_recovery_staff enable row level security;

revoke all on public.wallet_pin_recovery_staff
from public, anon, authenticated;

-- Branch employees can submit verification results only.
-- They cannot verify their own recovery requests or approve resets.

create or replace function public.submit_wallet_pin_branch_verification(
  p_request_id uuid,
  p_status text,
  p_notes text,
  p_evidence_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.wallet_pin_recovery_requests%rowtype;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Authentication required.');
  end if;

  if not exists (
    select 1
    from public.wallet_pin_recovery_staff
    where user_id = v_user_id
      and role = 'branch_employee'
      and active = true
  ) then
    return jsonb_build_object('success', false, 'message', 'Branch employee permission required.');
  end if;

  if p_status is null or p_status not in ('verified', 'failed')
     or p_notes is null
     or length(trim(p_notes)) < 5 then
    return jsonb_build_object('success', false, 'message', 'Valid verification details are required.');
  end if;

  select *
  into v_request
  from public.wallet_pin_recovery_requests
  where id = p_request_id
  for update;

  if not found or v_request.status not in ('pending', 'under_review') then
    return jsonb_build_object('success', false, 'message', 'Active recovery request not found.');
  end if;

  if v_request.user_id = v_user_id then
    return jsonb_build_object('success', false, 'message', 'You cannot verify your own recovery request.');
  end if;

  insert into public.wallet_pin_branch_verifications (
    recovery_request_id,
    branch_employee_id,
    verification_status,
    verification_notes,
    evidence_reference
  )
  values (
    p_request_id,
    v_user_id,
    p_status,
    left(trim(p_notes), 2000),
    nullif(left(trim(coalesce(p_evidence_reference, '')), 500), '')
  );

  update public.wallet_pin_recovery_requests
  set status = 'under_review'
  where id = p_request_id
    and status = 'pending';

  insert into public.wallet_pin_recovery_audit (
    recovery_request_id,
    actor_id,
    action,
    details
  )
  values (
    p_request_id,
    v_user_id,
    'branch_verification_submitted',
    p_status
  );

  return jsonb_build_object('success', true, 'message', 'Verification submitted.');
end;
$$;

-- Only an active administrator may approve or reject.
-- Approval requires the 24-hour waiting period and the latest
-- branch verification to be successful.

create or replace function public.review_wallet_pin_recovery(
  p_request_id uuid,
  p_decision text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.wallet_pin_recovery_requests%rowtype;
  v_latest_status text;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'message', 'Authentication required.');
  end if;

  if not exists (
    select 1
    from public.wallet_pin_recovery_staff
    where user_id = v_user_id
      and role = 'admin'
      and active = true
  ) then
    return jsonb_build_object('success', false, 'message', 'Administrator permission required.');
  end if;

  if p_decision is null or p_decision not in ('approved', 'rejected') then
    return jsonb_build_object('success', false, 'message', 'Invalid decision.');
  end if;

  if p_notes is null or length(trim(p_notes)) < 5 then
    return jsonb_build_object('success', false, 'message', 'A review note is required.');
  end if;

  select *
  into v_request
  from public.wallet_pin_recovery_requests
  where id = p_request_id
  for update;

  if not found or v_request.status not in ('pending', 'under_review') then
    return jsonb_build_object('success', false, 'message', 'Active recovery request not found.');
  end if;

  if v_request.user_id = v_user_id then
    return jsonb_build_object('success', false, 'message', 'You cannot approve or reject your own recovery request.');
  end if;

  if now() < v_request.review_after then
    return jsonb_build_object('success', false, 'message', 'The 24-hour review period has not ended.');
  end if;

  if p_decision = 'approved' then
    select verification_status
    into v_latest_status
    from public.wallet_pin_branch_verifications
    where recovery_request_id = p_request_id
    order by submitted_at desc, id desc
    limit 1;

    if v_latest_status is distinct from 'verified' then
      return jsonb_build_object('success', false, 'message', 'The latest branch verification must be successful.');
    end if;
  end if;

  update public.wallet_pin_recovery_requests
  set status = p_decision,
      reviewed_at = now(),
      reviewed_by = v_user_id,
      admin_decision_notes = left(trim(p_notes), 2000)
  where id = p_request_id;

  if p_decision = 'approved' then
    delete from public.wallet_pin_credentials
    where user_id = v_request.user_id;
  end if;

  insert into public.wallet_pin_recovery_audit (
    recovery_request_id,
    actor_id,
    action,
    details
  )
  values (
    p_request_id,
    v_user_id,
    'admin_' || p_decision,
    left(trim(p_notes), 2000)
  );

  return jsonb_build_object(
    'success', true,
    'status', p_decision,
    'message',
    case
      when p_decision = 'approved'
        then 'Recovery approved. The owner can now create a new wallet PIN.'
      else 'Recovery request rejected.'
    end
  );
end;
$$;

revoke all on function public.submit_wallet_pin_branch_verification(uuid, text, text, text)
from public, anon;

revoke all on function public.review_wallet_pin_recovery(uuid, text, text)
from public, anon;

grant execute on function public.submit_wallet_pin_branch_verification(uuid, text, text, text)
to authenticated;

grant execute on function public.review_wallet_pin_recovery(uuid, text, text)
to authenticated;
