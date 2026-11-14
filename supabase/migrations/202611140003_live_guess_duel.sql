-- BRITUME Stage 3: server-controlled, demo-only live Guess the Number duel.
-- No wallet, entry fee, wager, cash prize or redeemable points are involved.

create table if not exists public.britume_game_duel_state_v2 (
  room_id uuid primary key references public.britume_game_rooms_v2(id) on delete cascade,
  secret_number integer not null check (secret_number between 1 and 100),
  turn_user_id uuid not null references auth.users(id) on delete cascade,
  turns_taken integer not null default 0 check (turns_taken between 0 and 20),
  winner_user_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.britume_game_duel_events_v2 (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.britume_game_rooms_v2(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  guess integer not null check (guess between 1 and 100),
  turn_number integer not null check (turn_number between 1 and 20),
  created_at timestamptz not null default now(),
  unique(room_id, turn_number)
);

alter table public.britume_game_duel_state_v2 enable row level security;
alter table public.britume_game_duel_events_v2 enable row level security;

-- The secret state is deliberately inaccessible to client roles.
revoke all on public.britume_game_duel_state_v2 from anon, authenticated;
revoke insert, update, delete on public.britume_game_duel_events_v2 from anon, authenticated;
grant select on public.britume_game_duel_events_v2 to authenticated;

drop policy if exists "Room players can read duel guesses" on public.britume_game_duel_events_v2;
create policy "Room players can read duel guesses"
  on public.britume_game_duel_events_v2 for select to authenticated
  using (
    exists (select 1 from public.britume_game_room_members_v2 m
      where m.room_id = britume_game_duel_events_v2.room_id and m.user_id = auth.uid())
  );

create or replace function public.britume_start_guess_duel(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_room public.britume_game_rooms_v2%rowtype;
  v_first uuid;
  v_count integer;
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  select * into v_room from public.britume_game_rooms_v2 where id = p_room_id for update;
  if not found then raise exception 'Room not found.'; end if;
  if v_room.game_id <> 'number-guess' then raise exception 'This live game is not enabled yet.'; end if;
  if not exists (select 1 from public.britume_game_room_members_v2 where room_id = p_room_id and user_id = v_user) then raise exception 'You are not a player in this room.'; end if;
  select count(*) into v_count from public.britume_game_room_members_v2 where room_id = p_room_id;
  if v_count <> 2 then raise exception 'Both players must join before starting.'; end if;
  select user_id into v_first from public.britume_game_room_members_v2 where room_id = p_room_id order by joined_at, user_id limit 1;
  insert into public.britume_game_duel_state_v2(room_id, secret_number, turn_user_id)
    values (p_room_id, floor(random() * 100 + 1)::integer, v_first)
    on conflict (room_id) do nothing;
  update public.britume_game_rooms_v2 set status = 'playing' where id = p_room_id and status in ('ready','playing');
  return jsonb_build_object('status','playing','turn_user_id',(select turn_user_id from public.britume_game_duel_state_v2 where room_id=p_room_id));
end; $$;

create or replace function public.britume_submit_guess(p_room_id uuid, p_guess integer)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user uuid := auth.uid();
  v_state public.britume_game_duel_state_v2%rowtype;
  v_next uuid;
  v_event_id bigint;
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  if p_guess is null or p_guess < 1 or p_guess > 100 then raise exception 'Enter a whole number from 1 to 100.'; end if;
  if not exists (select 1 from public.britume_game_room_members_v2 where room_id=p_room_id and user_id=v_user) then raise exception 'You are not a player in this room.'; end if;
  select * into v_state from public.britume_game_duel_state_v2 where room_id=p_room_id for update;
  if not found then raise exception 'The match has not started yet.'; end if;
  if v_state.completed_at is not null then raise exception 'This match is already complete.'; end if;
  if v_state.turn_user_id <> v_user then raise exception 'Wait for your opponent to make a guess.'; end if;
  insert into public.britume_game_duel_events_v2(room_id,user_id,guess,turn_number)
    values(p_room_id,v_user,p_guess,v_state.turns_taken+1) returning id into v_event_id;
  if p_guess = v_state.secret_number then
    update public.britume_game_duel_state_v2 set turns_taken=turns_taken+1,winner_user_id=v_user,completed_at=now() where room_id=p_room_id;
    update public.britume_game_rooms_v2 set status='completed' where id=p_room_id;
    insert into public.britume_game_results_v2(room_id,user_id,score,placement,verified_at)
      values(p_room_id,v_user,100,1,now()) on conflict(room_id,user_id) do update set score=100,placement=1,verified_at=now();
    select user_id into v_next from public.britume_game_room_members_v2 where room_id=p_room_id and user_id<>v_user limit 1;
    if v_next is not null then
      insert into public.britume_game_results_v2(room_id,user_id,score,placement,verified_at)
        values(p_room_id,v_next,0,2,now()) on conflict(room_id,user_id) do update set score=0,placement=2,verified_at=now();
    end if;
    return jsonb_build_object('status','completed','outcome','correct','winner_user_id',v_user,'turn_number',v_state.turns_taken+1);
  end if;
  if v_state.turns_taken + 1 >= 20 then
    update public.britume_game_duel_state_v2 set turns_taken=20,completed_at=now() where room_id=p_room_id;
    update public.britume_game_rooms_v2 set status='completed' where id=p_room_id;
    return jsonb_build_object('status','completed','outcome','draw','turn_number',20);
  end if;
  select user_id into v_next from public.britume_game_room_members_v2 where room_id=p_room_id and user_id<>v_user limit 1;
  update public.britume_game_duel_state_v2 set turns_taken=turns_taken+1,turn_user_id=v_next where room_id=p_room_id;
  return jsonb_build_object('status','playing','outcome',case when p_guess<v_state.secret_number then 'higher' else 'lower' end,'turn_user_id',v_next,'turn_number',v_state.turns_taken+1);
end; $$;


create or replace function public.britume_get_guess_duel_status(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_user uuid := auth.uid(); v_state public.britume_game_duel_state_v2%rowtype;
begin
  if v_user is null then raise exception 'Sign in first.'; end if;
  if not exists (select 1 from public.britume_game_room_members_v2 where room_id=p_room_id and user_id=v_user) then raise exception 'You are not a player in this room.'; end if;
  select * into v_state from public.britume_game_duel_state_v2 where room_id=p_room_id;
  if not found then return jsonb_build_object('started',false); end if;
  return jsonb_build_object('started',true,'turn_user_id',v_state.turn_user_id,'turns_taken',v_state.turns_taken,'completed',v_state.completed_at is not null,'winner_user_id',v_state.winner_user_id);
end; $$;

revoke all on function public.britume_get_guess_duel_status(uuid) from public;
grant execute on function public.britume_get_guess_duel_status(uuid) to authenticated;

revoke all on function public.britume_start_guess_duel(uuid) from public;
revoke all on function public.britume_submit_guess(uuid,integer) from public;
grant execute on function public.britume_start_guess_duel(uuid) to authenticated;
grant execute on function public.britume_submit_guess(uuid,integer) to authenticated;

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='britume_game_duel_events_v2') then
    alter publication supabase_realtime add table public.britume_game_duel_events_v2;
  end if;
end $$;
