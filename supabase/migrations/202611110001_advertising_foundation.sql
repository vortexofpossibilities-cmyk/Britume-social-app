-- =========================================================
-- BRITUME ADVERTISING FOUNDATION
-- Migration: 202611110001_advertising_foundation.sql
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- 1. AD CAMPAIGNS
-- ---------------------------------------------------------

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),

  advertiser_id uuid not null
    references auth.users(id) on delete cascade,

  advertiser_type text not null default 'individual'
    check (
      advertiser_type in ('individual', 'business')
    ),

  business_name text,

  title text not null
    check (char_length(title) between 3 and 100),

  description text not null
    check (char_length(description) between 1 and 1000),

  creative_type text not null
    check (
      creative_type in ('text', 'image', 'video')
    ),

  creative_url text,

  destination_url text,

  category text not null
    check (
      category in (
        'education',
        'technology',
        'fashion',
        'food',
        'entertainment',
        'sports',
        'home',
        'business',
        'community',
        'other'
      )
    ),

  budget_total numeric(12,2) not null
    check (budget_total > 0),

  daily_budget numeric(12,2)
    check (
      daily_budget is null
      or daily_budget > 0
    ),

  amount_spent numeric(12,2) not null default 0
    check (amount_spent >= 0),

  impressions bigint not null default 0
    check (impressions >= 0),

  clicks bigint not null default 0
    check (clicks >= 0),

  starts_at timestamptz,
  ends_at timestamptz,

  status text not null default 'draft'
    check (
      status in (
        'draft',
        'pending',
        'approved',
        'rejected',
        'paused',
        'completed'
      )
    ),

  review_note text,

  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_campaign_dates check (
    ends_at is null
    or starts_at is null
    or ends_at > starts_at
  ),

  constraint valid_campaign_destination check (
    destination_url is null
    or destination_url ~ '^https://'
  ),

  constraint valid_creative_url check (
    creative_url is null
    or creative_url ~ '^https://'
  ),

  constraint spending_within_budget check (
    amount_spent <= budget_total
  )
);

create index if not exists ad_campaigns_advertiser_idx
on public.ad_campaigns(advertiser_id);

create index if not exists ad_campaigns_status_idx
on public.ad_campaigns(status);

create index if not exists ad_campaigns_schedule_idx
on public.ad_campaigns(starts_at, ends_at);


-- ---------------------------------------------------------
-- 2. ADVERTISEMENT EVENTS
-- ---------------------------------------------------------

create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),

  campaign_id uuid not null
    references public.ad_campaigns(id) on delete cascade,

  event_type text not null
    check (event_type in ('impression', 'click')),

  viewer_id uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists ad_events_campaign_idx
on public.ad_events(campaign_id, created_at desc);


-- ---------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------

alter table public.ad_campaigns
enable row level security;

alter table public.ad_events
enable row level security;


-- ---------------------------------------------------------
-- 4. REMOVE OLD AD POLICIES
-- ---------------------------------------------------------

drop policy if exists "Advertisers read own campaigns"
on public.ad_campaigns;

drop policy if exists "Advertisers create own drafts"
on public.ad_campaigns;

drop policy if exists "Advertisers update own drafts"
on public.ad_campaigns;

drop policy if exists "Public read approved campaigns"
on public.ad_campaigns;

drop policy if exists "Admins manage campaigns"
on public.ad_campaigns;

drop policy if exists "No direct ad event reads"
on public.ad_events;


-- ---------------------------------------------------------
-- 5. ADVERTISERS CAN READ THEIR OWN CAMPAIGNS
-- ---------------------------------------------------------

create policy "Advertisers read own campaigns"
on public.ad_campaigns
for select
to authenticated
using (
  advertiser_id = (select auth.uid())
);


-- ---------------------------------------------------------
-- 6. ADVERTISERS CAN CREATE THEIR OWN DRAFTS
-- ---------------------------------------------------------

create policy "Advertisers create own drafts"
on public.ad_campaigns
for insert
to authenticated
with check (
  advertiser_id = (select auth.uid())
  and status = 'draft'
  and amount_spent = 0
  and impressions = 0
  and clicks = 0
  and reviewed_by is null
  and reviewed_at is null
);


-- ---------------------------------------------------------
-- 7. ADVERTISERS CAN UPDATE THEIR OWN DRAFTS
-- ---------------------------------------------------------

create policy "Advertisers update own drafts"
on public.ad_campaigns
for update
to authenticated
using (
  advertiser_id = (select auth.uid())
  and status in ('draft', 'rejected')
)
with check (
  advertiser_id = (select auth.uid())
  and status in ('draft', 'rejected')
  and amount_spent = 0
  and impressions = 0
  and clicks = 0
);


-- ---------------------------------------------------------
-- 8. PUBLICLY DISPLAY ONLY APPROVED ACTIVE CAMPAIGNS
-- ---------------------------------------------------------

create policy "Public read approved campaigns"
on public.ad_campaigns
for select
to anon, authenticated
using (
  status = 'approved'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and amount_spent < budget_total
);


-- ---------------------------------------------------------
-- 9. RESTRICT DIRECT TABLE PERMISSIONS
-- ---------------------------------------------------------

revoke all on public.ad_campaigns
from public, anon, authenticated;

grant select on public.ad_campaigns
to authenticated;

grant insert (
  advertiser_id,
  advertiser_type,
  business_name,
  title,
  description,
  creative_type,
  creative_url,
  destination_url,
  category,
  budget_total,
  daily_budget
)
on public.ad_campaigns
to authenticated;

grant update (
  advertiser_type,
  business_name,
  title,
  description,
  creative_type,
  creative_url,
  destination_url,
  category,
  budget_total,
  daily_budget
)
on public.ad_campaigns
to authenticated;

grant delete on public.ad_campaigns
to authenticated;

-- Public and authenticated users can see approved campaigns
-- through the select policy.
grant select on public.ad_campaigns
to anon;


-- ---------------------------------------------------------
-- 10. DO NOT ALLOW DIRECT EVENT ACCESS
-- ---------------------------------------------------------

revoke all on public.ad_events
from public, anon, authenticated;


-- ---------------------------------------------------------
-- 11. SUBMIT A CAMPAIGN FOR ADMIN REVIEW
-- ---------------------------------------------------------

create or replace function public.submit_ad_campaign(
  p_campaign_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_campaign public.ad_campaigns;
begin
  if auth.uid() is null then
    raise exception 'You must sign in first.';
  end if;

  select *
  into v_campaign
  from public.ad_campaigns
  where id = p_campaign_id
    and advertiser_id = auth.uid()
  for update;

  if not found then
    raise exception 'Campaign not found.';
  end if;

  if v_campaign.status not in ('draft', 'rejected') then
    raise exception 'This campaign cannot be submitted.';
  end if;

  if v_campaign.creative_type in ('image', 'video')
     and v_campaign.creative_url is null then
    raise exception 'Please provide the advertisement media.';
  end if;

  if v_campaign.starts_at is not null
     and v_campaign.ends_at is not null
     and v_campaign.ends_at <= v_campaign.starts_at then
    raise exception 'The campaign end date must be after its start date.';
  end if;

  update public.ad_campaigns
  set
    status = 'pending',
    review_note = null,
    reviewed_by = null,
    reviewed_at = null,
    updated_at = now()
  where id = p_campaign_id;

  return p_campaign_id;
end;
$$;

revoke all on function public.submit_ad_campaign(uuid)
from public, anon;

grant execute on function public.submit_ad_campaign(uuid)
to authenticated;


-- ---------------------------------------------------------
-- 12. ADMIN CAMPAIGN REVIEW
-- ---------------------------------------------------------

create or replace function public.review_ad_campaign(
  p_campaign_id uuid,
  p_decision text,
  p_review_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null
     or not public.is_britume_admin() then
    raise exception 'Administrator access required.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid review decision.';
  end if;

  update public.ad_campaigns
  set
    status = p_decision,
    review_note = left(coalesce(p_review_note, ''), 1000),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = p_campaign_id
    and status = 'pending';

  if not found then
    raise exception 'Pending campaign not found.';
  end if;

  return p_campaign_id;
end;
$$;

revoke all on function public.review_ad_campaign(
  uuid, text, text
)
from public, anon;

grant execute on function public.review_ad_campaign(
  uuid, text, text
)
to authenticated;


-- ---------------------------------------------------------
-- 13. ADMIN PAUSE OR RESUME CAMPAIGN
-- ---------------------------------------------------------

create or replace function public.admin_set_ad_status(
  p_campaign_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null
     or not public.is_britume_admin() then
    raise exception 'Administrator access required.';
  end if;

  if p_status not in ('approved', 'paused', 'completed') then
    raise exception 'Invalid campaign status.';
  end if;

  update public.ad_campaigns
  set
    status = p_status,
    updated_at = now()
  where id = p_campaign_id
    and status in ('approved', 'paused');

  if not found then
    raise exception 'Campaign not found or cannot be changed.';
  end if;

  return p_campaign_id;
end;
$$;

revoke all on function public.admin_set_ad_status(
  uuid, text
)
from public, anon;

grant execute on function public.admin_set_ad_status(
  uuid, text
)
to authenticated;


-- ---------------------------------------------------------
-- 14. UPDATED AT TRIGGER
-- ---------------------------------------------------------

create or replace function public.set_ad_campaign_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ad_campaign_updated_at
on public.ad_campaigns;

create trigger ad_campaign_updated_at
before update on public.ad_campaigns
for each row
execute function public.set_ad_campaign_updated_at();


-- ---------------------------------------------------------
-- END OF BRITUME ADVERTISING FOUNDATION
-- ---------------------------------------------------------
