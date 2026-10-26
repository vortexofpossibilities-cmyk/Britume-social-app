import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'britume:games:v1';
export type GameRecord = { game: string; wins: number; plays: number; bestScore: number; updatedAt: string };
async function readAll(): Promise<Record<string, GameRecord>> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) || '{}'); } catch { return {}; }
}
export async function getGameRecord(game: string): Promise<GameRecord> {
  const all = await readAll();
  return all[game] || { game, wins: 0, plays: 0, bestScore: 0, updatedAt: new Date(0).toISOString() };
}
export async function recordGame(game: string, won: boolean, score = 0): Promise<GameRecord> {
  const all = await readAll();
  const old = all[game] || { game, wins: 0, plays: 0, bestScore: 0, updatedAt: new Date(0).toISOString() };
  const next = { ...old, wins: old.wins + (won ? 1 : 0), plays: old.plays + 1, bestScore: Math.max(old.bestScore, score), updatedAt: new Date().toISOString() };
  all[game] = next;
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
  return next;
}
export async function getAllGameRecords(): Promise<GameRecord[]> {
  return Object.values(await readAll()).sort((a,b) => b.wins-a.wins || b.bestScore-a.bestScore);
}
