-- =========================================================
-- BRITUME ADVERTISING SECURITY AND ADMIN REVIEW
-- Migration: 202611110002_advertising_security_and_review.sql
-- =========================================================

-- 1. Allow authorised BRITUME administrators to review campaigns.
drop policy if exists "Admins review campaigns"
on public.ad_campaigns;

create policy "Admins review campaigns"
on public.ad_campaigns
for select
to authenticated
using (
  (select public.is_britume_admin())
);


-- 2. Remove anonymous access to the full campaign table.
-- Public visitors will use the limited view below instead.
revoke select on public.ad_campaigns from anon;


-- 3. Create a public-safe view.
-- It deliberately excludes advertiser IDs, budgets,
-- spending totals, review notes and reviewer IDs.

create or replace view public.active_ad_campaigns
with (security_barrier = true)
as
select
  id,
  advertiser_type,
  business_name,
  title,
  description,
  creative_type,
  creative_url,
  destination_url,
  category,
  starts_at,
  ends_at
from public.ad_campaigns
where
  status = 'approved'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and amount_spent < budget_total;

-- 4. Set public permissions on the safe view.
revoke all on public.active_ad_campaigns
from public, anon, authenticated;

grant select on public.active_ad_campaigns
to anon, authenticated;


-- 5. Keep the event table private.
revoke all on public.ad_events
from public, anon, authenticated;


-- =========================================================
-- END OF MIGRATION
-- =========================================================
