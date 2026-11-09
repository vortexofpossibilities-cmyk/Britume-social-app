
-- BRITUME CENTRAL GAME RESERVE
-- Free, non-cash virtual coins only.

create table if not exists public.britume_game_reserve (
  id boolean primary key default true check (id = true),
  coin_balance bigint not null default 0
    check (coin_balance >= 0),
  updated_at timestamptz not null default now()
);

insert into public.britume_game_reserve (id, coin_balance)
values (true, 0)
on conflict (id) do nothing;


create table if not exists public.britume_game_reserve_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);


create table if not exists public.britume_game_accounts (
  game_id text primary key,
  coin_balance bigint not null default 0
    check (coin_balance >= 0),
  updated_at timestamptz not null default now()
);


insert into public.britume_game_accounts (game_id)
values
  ('pooled-spin'),
  ('trivia'),
  ('last-standing'),
  ('daily-challenge'),
  ('prediction-pot'),
  ('greedy-split'),
  ('lowest-bid'),
  ('number-guess'),
  ('rocket'),
  ('minefield'),
  ('mystery-box')
on conflict (game_id) do nothing;


create table if not exists public.britume_player_coins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  coin_balance bigint not null default 0
    check (coin_balance >= 0),
  updated_at timestamptz not null default now()
);


create table if not exists public.britume_game_round_settlements (
  round_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id text not null references public.britume_game_accounts(game_id),
  allocated_coins bigint not null check (allocated_coins >= 0),
  player_reward bigint not null check (player_reward >= 0),
  unused_return bigint not null check (unused_return >= 0),
  created_at timestamptz not null default now(),

  check (player_reward + unused_return = allocated_coins)
);


create table if not exists public.britume_coin_ledger (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  game_id text,
  entry_type text not null check (
    entry_type in (
      'admin_topup',
      'game_allocation',
      'player_reward',
      'unused_return'
    )
  ),
  amount bigint not null check (amount > 0),
  from_account text not null,
  to_account text not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);


-- Enable row-level security.

alter table public.britume_game_reserve enable row level security;
alter table public.britume_game_reserve_admins enable row level security;
alter table public.britume_game_accounts enable row level security;
alter table public.britume_player_coins enable row level security;
alter table public.britume_game_round_settlements enable row level security;
alter table public.britume_coin_ledger enable row level security;


-- Authenticated users can see the shared reserve and game account totals.

drop policy if exists "Authenticated users can view reserve"
on public.britume_game_reserve;

create policy "Authenticated users can view reserve"
on public.britume_game_reserve
for select to authenticated
using (true);


drop policy if exists "Authenticated users can view game accounts"
on public.britume_game_accounts;

create policy "Authenticated users can view game accounts"
on public.britume_game_accounts
for select to authenticated
using (true);


-- Players can only view their own balance and records.

drop policy if exists "Players view own coin balance"
on public.britume_player_coins;

create policy "Players view own coin balance"
on public.britume_player_coins
for select to authenticated
using (auth.uid() = user_id);


drop policy if exists "Players view own settlements"
on public.britume_game_round_settlements;

create policy "Players view own settlements"
on public.britume_game_round_settlements
for select to authenticated
using (auth.uid() = user_id);


drop policy if exists "Players view own coin history"
on public.britume_coin_ledger;

create policy "Players view own coin history"
on public.britume_coin_ledger
for select to authenticated
using (auth.uid() = user_id);


drop policy if exists "Admins view reserve admin records"
on public.britume_game_reserve_admins;

create policy "Admins view reserve admin records"
on public.britume_game_reserve_admins
for select to authenticated
using (auth.uid() = user_id);


-- No direct client writes to these accounting tables.
revoke insert, update, delete
on public.britume_game_reserve from anon, authenticated;

revoke insert, update, delete
on public.britume_game_accounts from anon, authenticated;

revoke insert, update, delete
on public.britume_player_coins from anon, authenticated;

revoke insert, update, delete
on public.britume_game_round_settlements from anon, authenticated;

revoke insert, update, delete
on public.britume_coin_ledger from anon, authenticated;

revoke insert, update, delete
on public.britume_game_reserve_admins from anon, authenticated;


-- Admin verification helper.

create or replace function public.britume_is_game_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.britume_game_reserve_admins
    where user_id = auth.uid()
  );
$$;


-- An authorised administrator adds virtual coins to the central reserve.

create or replace function public.britume_admin_add_reserve_coins(
  p_amount bigint
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_balance bigint;
begin
  if auth.uid() is null or not public.britume_is_game_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'Invalid coin amount';
  end if;

  update public.britume_game_reserve
  set coin_balance = coin_balance + p_amount,
      updated_at = now()
  where id = true
  returning coin_balance into new_balance;

  insert into public.britume_coin_ledger (
    entry_type, amount, from_account, to_account
  )
  values (
    'admin_topup', p_amount, 'admin', 'central_reserve'
  );

  return new_balance;
end;
$$;


-- An authorised administrator allocates coins to a game.

create or replace function public.britume_admin_allocate_game_coins(
  p_game_id text,
  p_amount bigint
)
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  reserve_balance bigint;
  game_balance bigint;
begin
  if auth.uid() is null or not public.britume_is_game_admin() then
    raise exception 'Administrator access required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount > 1000000 then
    raise exception 'Invalid coin amount';
  end if;

  select coin_balance into reserve_balance
  from public.britume_game_reserve
  where id = true
  for update;

  if reserve_balance < p_amount then
    raise exception 'Central reserve has insufficient coins';
  end if;

  update public.britume_game_reserve
  set coin_balance = coin_balance - p_amount,
      updated_at = now()
  where id = true;

  update public.britume_game_accounts
  set coin_balance = coin_balance + p_amount,
      updated_at = now()
  where game_id = p_game_id
  returning coin_balance into game_balance;

  if not found then
    raise exception 'Unknown game';
  end if;

  insert into public.britume_coin_ledger (
    game_id, entry_type, amount, from_account, to_account
  )
  values (
    p_game_id, 'game_allocation', p_amount,
    'central_reserve', p_game_id
  );

  return game_balance;
end;
$$;


-- Settle one free practice round exactly once.
-- Unused allocation automatically returns to the central reserve.

create or replace function public.britume_settle_practice_round(
  p_game_id text,
  p_round_id uuid,
  p_allocated bigint,
  p_player_reward bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  unused_amount bigint;
  game_balance bigint;
  player_balance bigint;
  reserve_balance bigint;
begin
  if current_user_id is null then
    raise exception 'Sign in required';
  end if;

  if p_round_id is null
     or p_allocated is null
     or p_player_reward is null
     or p_allocated < 0
     or p_allocated > 200
     or p_player_reward < 0
     or p_player_reward > p_allocated then
    raise exception 'Invalid practice round values';
  end if;

  unused_amount := p_allocated - p_player_reward;

  -- Lock the game account to prevent simultaneous overspending.
  select coin_balance into game_balance
  from public.britume_game_accounts
  where game_id = p_game_id
  for update;

  if not found then
    raise exception 'Unknown game';
  end if;

  if game_balance < p_allocated then
    raise exception 'Game account has insufficient coins';
  end if;

  -- A round can only be settled once.
  insert into public.britume_game_round_settlements (
    round_id, user_id, game_id,
    allocated_coins, player_reward, unused_return
  )
  values (
    p_round_id, current_user_id, p_game_id,
    p_allocated, p_player_reward, unused_amount
  );

  update public.britume_game_accounts
  set coin_balance = coin_balance - p_allocated,
      updated_at = now()
  where game_id = p_game_id;

  insert into public.britume_player_coins (user_id, coin_balance)
  values (current_user_id, p_player_reward)
  on conflict (user_id)
  do update set
    coin_balance =
      public.britume_player_coins.coin_balance + excluded.coin_balance,
    updated_at = now()
  returning coin_balance into player_balance;

  if unused_amount > 0 then
    update public.britume_game_reserve
    set coin_balance = coin_balance + unused_amount,
        updated_at = now()
    where id = true
    returning coin_balance into reserve_balance;

    insert into public.britume_coin_ledger (
      user_id, game_id, entry_type, amount,
      from_account, to_account, reference_id
    )
    values (
      current_user_id, p_game_id, 'unused_return',
      unused_amount, p_game_id, 'central_reserve', p_round_id
    );
  else
    select coin_balance into reserve_balance
    from public.britume_game_reserve
    where id = true;
  end if;

  if p_player_reward > 0 then
    insert into public.britume_coin_ledger (
      user_id, game_id, entry_type, amount,
      from_account, to_account, reference_id
    )
    values (
      current_user_id, p_game_id, 'player_reward',
      p_player_reward, p_game_id, 'player', p_round_id
    );
  end if;

  return jsonb_build_object(
    'player_balance', player_balance,
    'unused_return', unused_amount,
    'central_reserve_balance', reserve_balance
  );
end;
$$;


revoke all on function public.britume_is_game_admin()
from public, anon, authenticated;

revoke all on function public.britume_admin_add_reserve_coins(bigint)
from public, anon;

revoke all on function public.britume_admin_allocate_game_coins(text, bigint)
from public, anon;

revoke all on function public.britume_settle_practice_round(text, uuid, bigint, bigint)
from public, anon;

grant execute on function public.britume_admin_add_reserve_coins(bigint)
to authenticated;

grant execute on function public.britume_admin_allocate_game_coins(text, bigint)
to authenticated;

grant execute on function public.britume_settle_practice_round(text, uuid, bigint, bigint)
to authenticated;
