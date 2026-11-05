-- BRITUME ADMIN ROLES
-- Migration: 202611050004_britume_admin_roles.sql

-- Only trusted project owners should assign administrator roles.
-- Never allow users to promote themselves through the app.

create table if not exists public.britume_admin_roles (
user_id uuid primary key references auth.users(id) on delete cascade,
role text not null check (role in ('owner', 'admin')),
active boolean not null default true,
created_at timestamptz not null default now()
);

alter table public.britume_admin_roles enable row level security;

-- No direct access from normal application users.
revoke all on public.britume_admin_roles
from public, anon, authenticated;

-- The dashboard calls this function to check administrator access.
create or replace function public.is_britume_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
select exists (
select 1
from public.britume_admin_roles
where user_id = auth.uid()
and active = true
and role in ('owner', 'admin')
);
$$;

revoke all on function public.is_britume_admin()
from public, anon;

grant execute on function public.is_britume_admin()
to authenticated;

-- Prevent accidental public access through future grants.
comment on table public.britume_admin_roles is
'Private BRITUME administrator assignments. Assign roles only through trusted owner-controlled database access.';

comment on function public.is_britume_admin() is
'Returns true only for an authenticated active BRITUME owner or administrator.';
