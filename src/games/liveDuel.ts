import { supabase } from '../lib/supabase';

export type DuelEvent = {
  id: number;
  room_id: string;
  user_id: string;
  guess: number;
  turn_number: number;
  created_at: string;
};

function client() {
  if (!supabase) throw new Error('Supabase is not configured. Check your project environment variables.');
  return supabase;
}

export async function startGuessDuel(roomId: string) {
  const { data, error } = await client().rpc('britume_start_guess_duel', { p_room_id: roomId });
  if (error) throw error;
  return data as { status: 'playing'; turn_user_id: string };
}

export async function submitGuess(roomId: string, guess: number) {
  const { data, error } = await client().rpc('britume_submit_guess', { p_room_id: roomId, p_guess: guess });
  if (error) throw error;
  return data as { status: 'playing' | 'completed'; outcome: 'higher' | 'lower' | 'correct' | 'draw'; turn_user_id?: string; winner_user_id?: string; turn_number: number };
}

export async function getDuelEvents(roomId: string): Promise<DuelEvent[]> {
  const { data, error } = await client().from('britume_game_duel_events_v2')
    .select('id,room_id,user_id,guess,turn_number,created_at').eq('room_id', roomId).order('turn_number');
  if (error) throw error;
  return (data ?? []) as DuelEvent[];
}

export function subscribeToDuel(roomId: string, onChange: () => void) {
  return client().channel(`britume-duel-${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'britume_game_duel_events_v2', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();
}

export async function getGuessDuelStatus(roomId: string) {
  const { data, error } = await client().rpc('britume_get_guess_duel_status', { p_room_id: roomId });
  if (error) throw error;
  return data as { started: boolean; turn_user_id?: string; turns_taken?: number; completed?: boolean; winner_user_id?: string | null };
}
