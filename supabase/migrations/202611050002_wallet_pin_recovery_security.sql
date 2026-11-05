-- BRITUME WALLET PIN RECOVERY SECURITY
-- Migration: 202611050002_wallet_pin_recovery_security.sql

-- Only authorised administrators may review recovery requests.
-- Branch employees may submit verification evidence but cannot approve.

create table if not exists public.wallet_pin_branch_verifications (
  id uuid primary key default gen_random_uuid(),
  recovery_request_id uuid not null
    references public.wallet_pin_recovery_requests(id)
    on delete cascade,
  branch_employee_id uuid not null
    references auth.users(id),
  verification_status text not null
    check (verification_status in ('verified', 'failed')),
  verification_notes text not null,
  evidence_reference text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.wallet_pin_recovery_audit (
  id uuid primary key default gen_random_uuid(),
  recovery_request_id uuid not null
    references public.wallet_pin_recovery_requests(id)
    on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table public.wallet_pin_branch_verifications
  enable row level security;

alter table public.wallet_pin_recovery_audit
  enable row level security;

revoke all on public.wallet_pin_branch_verifications
  from anon, authenticated;

revoke all on public.wallet_pin_recovery_audit
  from anon, authenticated;

-- No public or ordinary authenticated access to PIN recovery evidence.
-- Staff/admin RPCs will be added only after BRITUME role and permission
-- tables are confirmed. Never trust a client-supplied role.
