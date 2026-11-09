
import type { GameDefinition } from './gameCatalog';

export type GameScreenStatus =
  | 'idle'
  | 'playing'
  | 'completed';

export type GameSession = {
  id: string;
  gameId: GameDefinition['id'];
  status: GameScreenStatus;
  score: number;
  startedAt: number;
  completedAt?: number;
};

export type GameResult = {
  gameId: GameDefinition['id'];
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
};

export type GamePlayer = {
  id: string;
  displayName: string;
  score: number;
  isCurrentPlayer: boolean;
};

export type GameFilter =
  | 'all'
  | 'skill'
  | 'strategy'
  | 'social'
  | 'practice';
