-- BRITUME Communities update.
-- Additive only: preserves the six existing community tables and their current RLS policies.
-- Run once in Supabase SQL Editor after replacing the app files.

-- 1) Raise the existing community comment limit from 2,000 to 3,000 characters.
do $$
declare
  old_constraint text;
begin
  for old_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.community_post_comments'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%char_length%'
      and pg_get_constraintdef(oid) ilike '%2000%'
  loop
    execute format(
      'alter table public.community_post_comments drop constraint %I',
      old_constraint
    );
  end loop;
end
$$;

alter table public.community_post_comments
  drop constraint if exists community_post_comments_content_length_check;

alter table public.community_post_comments
  add constraint community_post_comments_content_length_check
  check (char_length(trim(content)) between 1 and 3000);

-- 2) Return aggregate member counts without exposing other members' identities.
create or replace function public.get_community_member_counts(
  p_community_ids uuid[]
)
returns table (
  community_id uuid,
  member_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    cm.community_id,
    count(*)::bigint as member_count
  from public.community_members cm
  join public.communities c
    on c.id = cm.community_id
  where cm.community_id = any(coalesce(p_community_ids, array[]::uuid[]))
    and auth.uid() is not null
    and (
      c.owner_id = auth.uid()
      or c.is_public = true
      or exists (
        select 1
        from public.community_members mine
        where mine.community_id = c.id
          and mine.user_id = auth.uid()
      )
    )
  group by cm.community_id;
$$;

revoke all on function public.get_community_member_counts(uuid[]) from public;
grant execute on function public.get_community_member_counts(uuid[]) to authenticated;

-- 3) Allow members to upload and view community-post media.
-- App file paths use:
-- user-id/community-posts/community-id/post-id/filename.ext

drop policy if exists "BRITUME community post media read" on storage.objects;
create policy "BRITUME community post media read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'britume-media'
  and (storage.foldername(name))[2] = 'community-posts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.community_members cm
      where cm.community_id::text = (storage.foldername(name))[3]
        and cm.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "BRITUME community post media upload" on storage.objects;
create policy "BRITUME community post media upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'britume-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and (storage.foldername(name))[2] = 'community-posts'
  and exists (
    select 1
    from public.community_members cm
    where cm.community_id::text = (storage.foldername(name))[3]
      and cm.user_id = (select auth.uid())
  )
  and exists (
    select 1
    from public.community_posts cp
    where cp.id::text = (storage.foldername(name))[4]
      and cp.community_id::text = (storage.foldername(name))[3]
      and cp.user_id = (select auth.uid())
  )
);

drop policy if exists "BRITUME community post media delete" on storage.objects;
create policy "BRITUME community post media delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'britume-media'
  and (storage.foldername(name))[2] = 'community-posts'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1
      from public.community_members cm
      where cm.community_id::text = (storage.foldername(name))[3]
        and cm.user_id = (select auth.uid())
        and cm.role = 'owner'
    )
  )
);
