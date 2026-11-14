-- BRITUME Games Arena foundation.
-- This migration stores competition scheduling and room membership only.
-- It deliberately has no paid entry, wager, wallet, cash-prize or withdrawal fields.

create table if not exists public.britume_game_competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 100),
  game_id text not null,
  schedule_type text not null check (schedule_type in ('daily', 'weekly', 'monthly')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.britume_game_rooms_v2 (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  match_type text not null check (match_type in ('quick_match', 'scheduled_match', 'championship', 'private_room')),
  host_user_id uuid not null references auth.users(id) on delete cascade,
  competition_id uuid references public.britume_game_competitions(id) on delete set null,
  room_code text unique,
  max_players integer not null default 2 check (max_players between 2 and 100),
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'playing', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.britume_game_room_members_v2 (
  room_id uuid not null references public.britume_game_rooms_v2(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.britume_game_results_v2 (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.britume_game_rooms_v2(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null default 0 check (score >= 0),
  placement integer check (placement between 1 and 100),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index if not exists britume_game_competitions_schedule_idx
  on public.britume_game_competitions(schedule_type, starts_at desc);
create index if not exists britume_game_rooms_status_idx
  on public.britume_game_rooms_v2(status, created_at desc);
create index if not exists britume_game_results_leaderboard_idx
  on public.britume_game_results_v2(room_id, score desc);

alter table public.britume_game_competitions enable row level security;
alter table public.britume_game_rooms_v2 enable row level security;
alter table public.britume_game_room_members_v2 enable row level security;
alter table public.britume_game_results_v2 enable row level security;

create policy "Signed-in users can view published game competitions"
  on public.britume_game_competitions for select to authenticated
  using (status <> 'cancelled');

create policy "Signed-in users can view waiting game rooms"
  on public.britume_game_rooms_v2 for select to authenticated
  using (status in ('waiting', 'ready', 'playing') or host_user_id = (select auth.uid()));

create policy "Users can create rooms as themselves"
  on public.britume_game_rooms_v2 for insert to authenticated
  with check (host_user_id = (select auth.uid()));

create policy "Hosts can update their waiting rooms"
  on public.britume_game_rooms_v2 for update to authenticated
  using (host_user_id = (select auth.uid()) and status = 'waiting')
  with check (host_user_id = (select auth.uid()));

create policy "Room members can view their room membership list"
  on public.britume_game_room_members_v2 for select to authenticated
  using (exists (
    select 1 from public.britume_game_rooms_v2 r
    where r.id = room_id and (r.status in ('waiting', 'ready', 'playing') or r.host_user_id = (select auth.uid()))
  ));

create policy "Users can join rooms as themselves"
  on public.britume_game_room_members_v2 for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can leave their own rooms"
  on public.britume_game_room_members_v2 for delete to authenticated
  using (user_id = (select auth.uid()));

-- Clients can read results, but only a trusted server/service role should write verified results.
create policy "Signed-in users can read game results"
  on public.britume_game_results_v2 for select to authenticated
  using (true);

revoke insert, update, delete on public.britume_game_results_v2 from anon, authenticated;
grant select on public.britume_game_competitions to authenticated;
grant select, insert, update on public.britume_game_rooms_v2 to authenticated;
grant select, insert, delete on public.britume_game_room_members_v2 to authenticated;
grant select on public.britume_game_results_v2 to authenticated;
