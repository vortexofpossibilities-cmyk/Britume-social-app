-- Review before applying. Additive migration for BRITUME game room foundations.
create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('ludo','chess','sudoku','cards','football','pool')),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  max_players integer not null default 2 check (max_players between 2 and 4),
  status text not null default 'waiting' check (status in ('waiting','playing','finished','cancelled')),
  created_at timestamptz not null default now()
);
create table if not exists public.game_room_players (
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id,user_id)
);
create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('ludo','chess','sudoku','cards','football','pool')),
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0,
  won boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists game_scores_leaderboard_idx on public.game_scores(game, score desc, created_at desc);
alter table public.game_rooms enable row level security;
alter table public.game_room_players enable row level security;
alter table public.game_scores enable row level security;
create policy "Signed-in users can view waiting or playing rooms" on public.game_rooms
for select to authenticated using (status in ('waiting','playing') or host_user_id = (select auth.uid()));
create policy "Signed-in users can create rooms as host" on public.game_rooms
for insert to authenticated with check (host_user_id = (select auth.uid()));
create policy "Host can update own rooms" on public.game_rooms
for update to authenticated using (host_user_id = (select auth.uid())) with check (host_user_id = (select auth.uid()));
create policy "Players can view room memberships" on public.game_room_players
for select to authenticated using (exists (select 1 from public.game_rooms r where r.id = room_id));
create policy "Users can join as themselves" on public.game_room_players
for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users can leave their own room" on public.game_room_players
for delete to authenticated using (user_id = (select auth.uid()));
create policy "Scores are readable by signed-in users" on public.game_scores
for select to authenticated using (true);
create policy "Users can submit their own score" on public.game_scores
for insert to authenticated with check (user_id = (select auth.uid()));
grant select, insert, update on public.game_rooms to authenticated;
grant select, insert, delete on public.game_room_players to authenticated;
grant select, insert on public.game_scores to authenticated;
