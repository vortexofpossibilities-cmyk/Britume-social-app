import { supabase } from '../lib/supabase';

export type LiveRoom = {
  id: string;
  game_id: string;
  match_type: 'quick_match' | 'private_room';
  room_code: string | null;
  status: 'waiting' | 'ready' | 'playing' | 'completed' | 'cancelled';
  max_players: number;
};

function client() {
  if (!supabase) throw new Error('Supabase is not configured. Check your project environment variables.');
  return supabase;
}

function parseRoom(data: unknown): LiveRoom {
  if (!data || typeof data !== 'object' || !('id' in data)) {
    throw new Error('The server returned an invalid room. Please try again.');
  }
  return data as LiveRoom;
}

export async function findQuickMatch(gameId: string): Promise<LiveRoom> {
  const { data, error } = await client().rpc('britume_quick_match', { p_game_id: gameId });
  if (error) throw error;
  return parseRoom(data);
}

export async function createPrivateRoom(gameId: string): Promise<LiveRoom> {
  const { data, error } = await client().rpc('britume_create_private_room', { p_game_id: gameId });
  if (error) throw error;
  return parseRoom(data);
}

export async function joinPrivateRoom(code: string): Promise<LiveRoom> {
  const { data, error } = await client().rpc('britume_join_private_room', { p_room_code: code });
  if (error) throw error;
  return parseRoom(data);
}

export async function leaveGameRoom(roomId: string): Promise<void> {
  const { error } = await client().rpc('britume_leave_game_room', { p_room_id: roomId });
  if (error) throw error;
}

export function subscribeToGameRoom(roomId: string, onChange: () => void) {
  return client()
    .channel(`britume-room-${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'britume_game_rooms_v2', filter: `id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'britume_game_room_members_v2', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();
}

export async function getGameRoom(roomId: string): Promise<LiveRoom> {
  const { data, error } = await client()
    .from('britume_game_rooms_v2')
    .select('id, game_id, match_type, room_code, status, max_players')
    .eq('id', roomId)
    .single();
  if (error) throw error;
  return data as LiveRoom;
}

export async function getRoomPlayerCount(roomId: string): Promise<number> {
  const { count, error } = await client()
    .from('britume_game_room_members_v2')
    .select('user_id', { count: 'exact', head: true })
    .eq('room_id', roomId);
  if (error) throw error;
  return count ?? 0;
}
