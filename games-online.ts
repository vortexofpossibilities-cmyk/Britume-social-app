import { supabase, supabaseConfigured } from './supabase';

export async function createGameRoom(game: string, maxPlayers = 2) {
  if (!supabaseConfigured || !supabase) throw new Error('Configure Supabase before creating online rooms.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in before creating a room.');
  const { data, error } = await supabase.from('game_rooms').insert({
    game, host_user_id: user.id, max_players: maxPlayers, status: 'waiting'
  }).select('id, game, status, max_players').single();
  if (error) throw error;
  return data;
}
export async function joinGameRoom(roomId: string) {
  if (!supabaseConfigured || !supabase) throw new Error('Configure Supabase before joining online rooms.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in before joining a room.');
  const { data, error } = await supabase.from('game_room_players').upsert({
    room_id: roomId, user_id: user.id
  }, { onConflict: 'room_id,user_id' }).select().single();
  if (error) throw error;
  return data;
}
export async function submitGameScore(game: string, score: number, won: boolean) {
  if (!supabaseConfigured || !supabase) throw new Error('Configure Supabase before submitting scores.');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in before submitting a score.');
  const { data, error } = await supabase.from('game_scores').insert({
    game, user_id: user.id, score, won
  }).select().single();
  if (error) throw error;
  return data;
}
// This is not a complete real-time game protocol. Do not trust client scores in production;
// add server-side validation and synchronized moves before public launch.
