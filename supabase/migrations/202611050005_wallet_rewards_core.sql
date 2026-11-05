-- BRITUME wallet and rewards foundation.
-- Balance changes are performed by security-definer database functions only.

create table if not exists public.wallet_balances (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('purchased', 'earned', 'promotional')),
  balance numeric(18,4) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

create table if not exists public.wallet_ledger (
  id bigint generated always as identity primary key,
  account_user_id uuid not null references auth.users(id) on delete cascade,
  transfer_id uuid,
  category text not null check (category in ('purchased', 'earned', 'promotional')),
  entry_type text not null,
  amount numeric(18,4) not null check (amount > 0),
  created_at timestamptz not null default now()
);
create index if not exists wallet_ledger_account_created_idx on public.wallet_ledger(account_user_id, created_at desc);

alter table public.wallet_balances enable row level security;
alter table public.wallet_ledger enable row level security;
drop policy if exists "Users can read their own wallet balances" on public.wallet_balances;
create policy "Users can read their own wallet balances" on public.wallet_balances for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can read their own wallet ledger" on public.wallet_ledger;
create policy "Users can read their own wallet ledger" on public.wallet_ledger for select to authenticated using (account_user_id = (select auth.uid()));
revoke all on public.wallet_balances, public.wallet_ledger from anon, authenticated;
grant select on public.wallet_balances, public.wallet_ledger to authenticated;
revoke all on sequence public.wallet_ledger_id_seq from anon, authenticated;

create table if not exists public.reward_spins (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  cost numeric(18,4) not null check (cost > 0), prize numeric(18,4) not null check (prize >= 0), created_at timestamptz not null default now()
);
alter table public.reward_spins enable row level security;
revoke all on public.reward_spins from anon, authenticated;
create table if not exists public.daily_reward_claims (
  user_id uuid not null references auth.users(id) on delete cascade, claim_day date not null default (now() at time zone 'utc')::date,
  reward_amount numeric(18,4) not null, created_at timestamptz not null default now(), primary key (user_id, claim_day)
);
alter table public.daily_reward_claims enable row level security;
revoke all on public.daily_reward_claims from anon, authenticated;

create or replace function public.transfer_wallet_points(p_recipient_username text, p_amount numeric, p_pin text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare
  v_sender uuid := auth.uid(); v_recipient uuid; v_remaining numeric(18,4); v_take numeric(18,4); v_category text; v_transfer uuid := gen_random_uuid(); v_pin_result jsonb;
begin
  if v_sender is null then return jsonb_build_object('success', false, 'message', 'Authentication required.'); end if;
  if p_amount is null or p_amount <= 0 or p_amount > 1000000 or p_amount <> round(p_amount, 4) then return jsonb_build_object('success', false, 'message', 'Enter a valid amount (up to 4 decimal places).'); end if;
  select user_id into v_recipient from public.profiles where lower(username) = lower(trim(p_recipient_username)) and is_public = true;
  if v_recipient is null then return jsonb_build_object('success', false, 'message', 'That public username was not found.'); end if;
  if v_recipient = v_sender then return jsonb_build_object('success', false, 'message', 'You cannot transfer points to yourself.'); end if;
  v_pin_result := public.verify_wallet_pin(p_pin);
  if coalesce((v_pin_result->>'success')::boolean, false) is not true then return v_pin_result; end if;
  insert into public.wallet_balances(user_id, category) values (v_sender, 'promotional'), (v_sender, 'earned'), (v_sender, 'purchased'), (v_recipient, 'earned') on conflict do nothing;
  perform 1 from public.wallet_balances where user_id = v_sender order by category for update;
  if (select coalesce(sum(balance), 0) from public.wallet_balances where user_id = v_sender) < p_amount then return jsonb_build_object('success', false, 'message', 'Insufficient wallet balance.'); end if;
  v_remaining := p_amount;
  foreach v_category in array array['promotional', 'earned', 'purchased'] loop
    exit when v_remaining <= 0;
    select least(balance, v_remaining) into v_take from public.wallet_balances where user_id = v_sender and category = v_category for update;
    if v_take > 0 then
      update public.wallet_balances set balance = balance - v_take, updated_at = now() where user_id = v_sender and category = v_category;
      insert into public.wallet_ledger(account_user_id, transfer_id, category, entry_type, amount) values (v_sender, v_transfer, v_category, 'transfer_sent', v_take);
      v_remaining := v_remaining - v_take;
    end if;
  end loop;
  update public.wallet_balances set balance = balance + p_amount, updated_at = now() where user_id = v_recipient and category = 'earned';
  insert into public.wallet_ledger(account_user_id, transfer_id, category, entry_type, amount) values (v_recipient, v_transfer, 'earned', 'transfer_received', p_amount);
  return jsonb_build_object('success', true, 'transfer_id', v_transfer, 'amount', p_amount);
end;
$$;

create or replace function public.spin_reward_wheel(p_cost numeric, p_pin text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, extensions
as $$
declare
  v_user uuid := auth.uid(); v_pin_result jsonb; v_prize numeric(18,4); v_category text; v_remaining numeric(18,4); v_take numeric(18,4); v_spin uuid := gen_random_uuid(); v_roll integer;
begin
  if v_user is null then return jsonb_build_object('success', false, 'message', 'Authentication required.'); end if;
  if p_cost not in (20, 40, 60, 100) then return jsonb_build_object('success', false, 'message', 'Choose a valid spin level.'); end if;
  v_pin_result := public.verify_wallet_pin(p_pin);
  if coalesce((v_pin_result->>'success')::boolean, false) is not true then return v_pin_result; end if;
  insert into public.wallet_balances(user_id, category) values (v_user, 'promotional'), (v_user, 'earned'), (v_user, 'purchased') on conflict do nothing;
  perform 1 from public.wallet_balances where user_id = v_user order by category for update;
  if (select coalesce(sum(balance), 0) from public.wallet_balances where user_id = v_user) < p_cost then return jsonb_build_object('success', false, 'message', 'Insufficient wallet balance.'); end if;
  v_remaining := p_cost;
  foreach v_category in array array['promotional', 'earned', 'purchased'] loop
    exit when v_remaining <= 0;
    select least(balance, v_remaining) into v_take from public.wallet_balances where user_id = v_user and category = v_category for update;
    if v_take > 0 then
      update public.wallet_balances set balance = balance - v_take, updated_at = now() where user_id = v_user and category = v_category;
      insert into public.wallet_ledger(account_user_id, transfer_id, category, entry_type, amount) values (v_user, v_spin, v_category, 'spin_cost', v_take);
      v_remaining := v_remaining - v_take;
    end if;
  end loop;
  v_roll := get_byte(extensions.gen_random_bytes(1), 0) % 8;
  v_prize := case v_roll when 0 then 0 when 1 then 2 when 2 then 5 when 3 then 10 when 4 then 15 when 5 then 20 when 6 then 50 else 100 end;
  insert into public.reward_spins(user_id, cost, prize) values (v_user, p_cost, v_prize);
  if v_prize > 0 then
    update public.wallet_balances set balance = balance + v_prize, updated_at = now() where user_id = v_user and category = 'promotional';
    insert into public.wallet_ledger(account_user_id, transfer_id, category, entry_type, amount) values (v_user, v_spin, 'promotional', 'reward', v_prize);
  end if;
  return jsonb_build_object('success', true, 'spin_id', v_spin, 'cost', p_cost, 'prize', v_prize);
end;
$$;

create or replace function public.claim_daily_reward(p_pin text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public
as $$
declare v_user uuid := auth.uid(); v_day date := (now() at time zone 'utc')::date; v_amount numeric(18,4) := 2; v_pin_result jsonb;
begin
  if v_user is null then return jsonb_build_object('success', false, 'message', 'Authentication required.'); end if;
  v_pin_result := public.verify_wallet_pin(p_pin);
  if coalesce((v_pin_result->>'success')::boolean, false) is not true then return v_pin_result; end if;
  insert into public.wallet_balances(user_id, category) values (v_user, 'promotional') on conflict do nothing;
  insert into public.daily_reward_claims(user_id, claim_day, reward_amount) values (v_user, v_day, v_amount) on conflict do nothing;
  if not found then return jsonb_build_object('success', false, 'message', 'Today’s reward has already been claimed.'); end if;
  update public.wallet_balances set balance = balance + v_amount, updated_at = now() where user_id = v_user and category = 'promotional';
  insert into public.wallet_ledger(account_user_id, category, entry_type, amount) values (v_user, 'promotional', 'reward', v_amount);
  return jsonb_build_object('success', true, 'amount', v_amount, 'claim_day', v_day);
end;
$$;

-- Only a trusted payment backend/service role may award cashback.
create or replace function public.grant_verified_cashback(p_user_id uuid, p_amount numeric, p_reference text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public
as $$
begin
  if auth.role() <> 'service_role' or p_user_id is null or p_amount is null or p_amount <= 0 or p_amount > 1000000 or length(trim(coalesce(p_reference, ''))) < 8 then raise exception 'Invalid verified cashback request'; end if;
  insert into public.wallet_balances(user_id, category) values (p_user_id, 'promotional') on conflict do nothing;
  update public.wallet_balances set balance = balance + p_amount, updated_at = now() where user_id = p_user_id and category = 'promotional';
  insert into public.wallet_ledger(account_user_id, transfer_id, category, entry_type, amount) values (p_user_id, gen_random_uuid(), 'promotional', 'cashback', p_amount);
  return true;
end;
$$;

revoke all on function public.transfer_wallet_points(text, numeric, text) from public, anon;
revoke all on function public.spin_reward_wheel(numeric, text) from public, anon;
revoke all on function public.claim_daily_reward(text) from public, anon;
revoke all on function public.grant_verified_cashback(uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.transfer_wallet_points(text, numeric, text) to authenticated;
grant execute on function public.spin_reward_wheel(numeric, text) to authenticated;
grant execute on function public.claim_daily_reward(text) to authenticated;
grant execute on function public.grant_verified_cashback(uuid, numeric, text) to service_role;
