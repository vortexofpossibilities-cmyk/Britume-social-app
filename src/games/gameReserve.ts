
import { supabase } from '../lib/supabase';

export const BRITUME_GAME_IDS = [
  'pooled-spin',
  'trivia',
  'last-standing',
  'daily-challenge',
  'prediction-pot',
  'greedy-split',
  'lowest-bid',
  'number-guess',
  'rocket',
  'minefield',
  'mystery-box',
] as const;

export type BritumeGameId =
  (typeof BRITUME_GAME_IDS)[number];

export type GameReserveAccount = {
  game_id: BritumeGameId;
  coin_balance: number;
  updated_at: string;
};

export type GameReserveSnapshot = {
  central_balance: number;
  games: GameReserveAccount[];
  updated_at: string | null;
};

export type PlayerGameCoins = {
  user_id: string;
  coin_balance: number;
  updated_at: string;
};

export type PracticeSettlementInput = {
  gameId: BritumeGameId;
  roundId: string;
  allocatedCoins: number;
};

export type PracticeSettlementResult = {
  success: boolean;
  message?: string;
  allocated_coins?: number;
  awarded_coins?: number;
  returned_coins?: number;
};

function getClient() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Check your environment variables.',
    );
  }

  return supabase;
}

function safeNumber(value: unknown): number {
  const number = Number(value ?? 0);

  return Number.isFinite(number) && number >= 0
    ? number
    : 0;
}

function isGameId(value: unknown): value is BritumeGameId {
  return BRITUME_GAME_IDS.includes(value as BritumeGameId);
}

export async function getGameReserveSnapshot(): Promise<GameReserveSnapshot> {
  const client = getClient();

  const [reserveResult, gamesResult] = await Promise.all([
    client
      .from('britume_game_reserve')
      .select('coin_balance, updated_at')
      .eq('id', true)
      .single(),

    client
      .from('britume_game_accounts')
      .select('game_id, coin_balance, updated_at')
      .order('game_id'),
  ]);

  if (reserveResult.error) {
    throw reserveResult.error;
  }

  if (gamesResult.error) {
    throw gamesResult.error;
  }

  const games: GameReserveAccount[] = (
    gamesResult.data ?? []
  )
    .filter(row => isGameId(row.game_id))
    .map(row => ({
      game_id: row.game_id as BritumeGameId,
      coin_balance: safeNumber(row.coin_balance),
      updated_at: String(row.updated_at ?? ''),
    }));

  return {
    central_balance: safeNumber(
      reserveResult.data.coin_balance,
    ),
    games,
    updated_at: reserveResult.data.updated_at ?? null,
  };
}

export async function getMyBritumeCoins(): Promise<number> {
  const client = getClient();

  const { data, error } = await client
    .from('britume_player_coins')
    .select('coin_balance')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return safeNumber(data?.coin_balance);
}

/**
 * Do not call this from a game screen to decide rewards.
 * Reward amounts must be calculated and validated by a trusted server.
 * This function intentionally does not accept a client-selected reward.
 */
export async function settlePracticeRound(
  input: PracticeSettlementInput,
): Promise<PracticeSettlementResult> {
  if (!isGameId(input.gameId)) {
    throw new Error('Invalid BRITUME game.');
  }

  if (!input.roundId.trim()) {
    throw new Error('A round ID is required.');
  }

  if (
    !Number.isSafeInteger(input.allocatedCoins) ||
    input.allocatedCoins < 0
  ) {
    throw new Error('Invalid coin allocation.');
  }

  throw new Error(
    'Practice settlement is disabled until a trusted server-side reward calculation is installed.',
  );
}

/**
 * Admin functions are protected by Supabase RPC permissions.
 * Only authorised game administrators can perform these actions.
 */
export async function adminAddReserveCoins(
  amount: number,
): Promise<void> {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Enter a valid positive coin amount.');
  }

  const client = getClient();

  const { error } = await client.rpc(
    'britume_admin_add_reserve_coins',
    {
      p_amount: amount,
    },
  );

  if (error) {
    throw error;
  }
}

export async function adminAllocateGameCoins(
  gameId: BritumeGameId,
  amount: number,
): Promise<void> {
  if (!isGameId(gameId)) {
    throw new Error('Invalid BRITUME game.');
  }

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Enter a valid positive coin amount.');
  }

  const client = getClient();

  const { error } = await client.rpc(
    'britume_admin_allocate_game_coins',
    {
      p_game_id: gameId,
      p_amount: amount,
    },
  );

  if (error) {
    throw error;
  }
}
