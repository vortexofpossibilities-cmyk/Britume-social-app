-- BRITUME initial Supabase schema. Review and test policies before public launch.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text not null default '',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[A-Za-z0-9_]{3,30}$')
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  visibility text not null default 'public' check (visibility in ('public','private')),
  created_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_user_id_idx on public.posts(user_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;

drop policy if exists "Public profiles or own profile" on public.profiles;
create policy "Public profiles or own profile" on public.profiles for select
using (is_public = true or user_id = (select auth.uid()));

drop policy if exists "Create own profile" on public.profiles;
create policy "Create own profile" on public.profiles for insert
with check (user_id = (select auth.uid()));

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Read own or public posts of public profiles" on public.posts;
create policy "Read own or public posts of public profiles" on public.posts for select
using (
  user_id = (select auth.uid())
  or (visibility = 'public' and exists (
    select 1 from public.profiles p
    where p.user_id = posts.user_id and p.is_public = true
  ))
);

drop policy if exists "Create own posts" on public.posts;
create policy "Create own posts" on public.posts for insert
with check (user_id = (select auth.uid()));

drop policy if exists "Update own posts" on public.posts;
create policy "Update own posts" on public.posts for update
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Delete own posts" on public.posts;
create policy "Delete own posts" on public.posts for delete
using (user_id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.posts to authenticated;
grant insert, update, delete on public.profiles, public.posts to authenticated;
