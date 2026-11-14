-- BRITUME Stage 2: secure room matchmaking and realtime room updates.
-- Demo-only matches: no entry fees, wagers, wallet changes or cash prizes.

-- Room details are visible only to the host and joined members.
drop policy if exists "Signed-in users can view waiting game rooms" on public.britume_game_rooms_v2;
create policy "Room participants can view their rooms"
  on public.britume_game_rooms_v2 for select to authenticated
  using (
    host_user_id = (select auth.uid())
    or exists (
      select 1 from public.britume_game_room_members_v2 m
      where m.room_id = id and m.user_id = (select auth.uid())
    )
  );

create or replace function public.britume_can_view_room_members(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.britume_game_rooms_v2 r
    where r.id = p_room_id and r.host_user_id = auth.uid()
  ) or exists (
    select 1 from public.britume_game_room_members_v2 m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  );
$$;
revoke all on function public.britume_can_view_room_members(uuid) from public;
grant execute on function public.britume_can_view_room_members(uuid) to authenticated;

drop policy if exists "Room members can view their room membership list" on public.britume_game_room_members_v2;
drop policy if exists "Participants can view room membership" on public.britume_game_room_members_v2;
create policy "Participants can view room membership"
  on public.britume_game_room_members_v2 for select to authenticated
  using (user_id = (select auth.uid()) or public.britume_can_view_room_members(room_id));

create or replace function public.britume_quick_match(p_game_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_room public.britume_game_rooms_v2%rowtype;
  v_count integer;
begin
  if v_user is null then raise exception 'Sign in to find a match.'; end if;
  if p_game_id is null or char_length(p_game_id) not between 2 and 60 then raise exception 'Choose a valid game.'; end if;

  select r.* into v_room
  from public.britume_game_rooms_v2 r
  where r.game_id = p_game_id
    and r.match_type = 'quick_match'
    and r.status = 'waiting'
    and r.host_user_id <> v_user
    and (select count(*) from public.britume_game_room_members_v2 m where m.room_id = r.id) < r.max_players
  order by r.created_at asc
  limit 1
  for update skip locked;

  if found then
    insert into public.britume_game_room_members_v2(room_id, user_id)
    values (v_room.id, v_user) on conflict do nothing;
    select count(*) into v_count from public.britume_game_room_members_v2 where room_id = v_room.id;
    if v_count >= v_room.max_players then
      update public.britume_game_rooms_v2 set status = 'ready' where id = v_room.id returning * into v_room;
    end if;
  else
    insert into public.britume_game_rooms_v2(game_id, match_type, host_user_id, max_players)
    values (p_game_id, 'quick_match', v_user, 2)
    returning * into v_room;
    insert into public.britume_game_room_members_v2(room_id, user_id) values (v_room.id, v_user);
  end if;

  return jsonb_build_object('id', v_room.id, 'game_id', v_room.game_id, 'match_type', v_room.match_type,
    'room_code', v_room.room_code, 'status', v_room.status, 'max_players', v_room.max_players);
end;
$$;

create or replace function public.britume_create_private_room(p_game_id text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_room public.britume_game_rooms_v2%rowtype;
  v_code text;
begin
  if v_user is null then raise exception 'Sign in to create a room.'; end if;
  if p_game_id is null or char_length(p_game_id) not between 2 and 60 then raise exception 'Choose a valid game.'; end if;
  loop
    v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
    exit when not exists (select 1 from public.britume_game_rooms_v2 where room_code = v_code);
  end loop;
  insert into public.britume_game_rooms_v2(game_id, match_type, host_user_id, room_code, max_players)
  values (p_game_id, 'private_room', v_user, v_code, 2) returning * into v_room;
  insert into public.britume_game_room_members_v2(room_id, user_id) values (v_room.id, v_user);
  return jsonb_build_object('id', v_room.id, 'game_id', v_room.game_id, 'match_type', v_room.match_type,
    'room_code', v_room.room_code, 'status', v_room.status, 'max_players', v_room.max_players);
end;
$$;

create or replace function public.britume_join_private_room(p_room_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_room public.britume_game_rooms_v2%rowtype;
  v_count integer;
begin
  if v_user is null then raise exception 'Sign in to join a room.'; end if;
  select * into v_room from public.britume_game_rooms_v2
  where room_code = upper(trim(p_room_code)) and match_type = 'private_room'
  for update;
  if not found then raise exception 'Room code not found.'; end if;
  if v_room.status not in ('waiting', 'ready') then raise exception 'This room is no longer available.'; end if;
  select count(*) into v_count from public.britume_game_room_members_v2 where room_id = v_room.id;
  if v_count >= v_room.max_players and not exists (
    select 1 from public.britume_game_room_members_v2 where room_id = v_room.id and user_id = v_user
  ) then raise exception 'This room is full.'; end if;
  insert into public.britume_game_room_members_v2(room_id, user_id)
  values (v_room.id, v_user) on conflict do nothing;
  select count(*) into v_count from public.britume_game_room_members_v2 where room_id = v_room.id;
  if v_count >= v_room.max_players then
    update public.britume_game_rooms_v2 set status = 'ready' where id = v_room.id returning * into v_room;
  end if;
  return jsonb_build_object('id', v_room.id, 'game_id', v_room.game_id, 'match_type', v_room.match_type,
    'room_code', v_room.room_code, 'status', v_room.status, 'max_players', v_room.max_players);
end;
$$;

create or replace function public.britume_leave_game_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  delete from public.britume_game_room_members_v2 where room_id = p_room_id and user_id = v_user;
  update public.britume_game_rooms_v2 set status = 'cancelled'
  where id = p_room_id and host_user_id = v_user and status in ('waiting', 'ready');
  return true;
end;
$$;

revoke all on function public.britume_quick_match(text) from public;
revoke all on function public.britume_create_private_room(text) from public;
revoke all on function public.britume_join_private_room(text) from public;
revoke all on function public.britume_leave_game_room(uuid) from public;
grant execute on function public.britume_quick_match(text) to authenticated;
grant execute on function public.britume_create_private_room(text) to authenticated;
grant execute on function public.britume_join_private_room(text) to authenticated;
grant execute on function public.britume_leave_game_room(uuid) to authenticated;

-- Enable database change events for room and membership updates, without failing if already added.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'britume_game_rooms_v2') then
    alter publication supabase_realtime add table public.britume_game_rooms_v2;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'britume_game_room_members_v2') then
    alter publication supabase_realtime add table public.britume_game_room_members_v2;
  end if;
end $$;

-- All room writes go through the checked SECURITY DEFINER RPCs above.
revoke insert, update, delete on public.britume_game_rooms_v2 from anon, authenticated;
revoke insert, update, delete on public.britume_game_room_members_v2 from anon, authenticated;
grant select on public.britume_game_rooms_v2 to authenticated;
grant select on public.britume_game_room_members_v2 to authenticated;
