
import {
  BRITUME_GAMES,
  type GameDefinition,
} from './gameCatalog';

import type {
  GameSession,
  GameResult,
  GamePlayer,
} from './gameTypes';

// --------------------------------------------------
// BRITUME GAME ENGINE
// Shared practice-game logic for all 11 games.
// --------------------------------------------------

export function getGame(
  gameId: string
): GameDefinition | undefined {
  return BRITUME_GAMES.find(
    (game) => game.id === gameId
  );
}

export function createGameSession(
  gameId: string
): GameSession {
  return {
    id: `practice-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`,
    gameId: gameId as GameDefinition['id'],
    status: 'playing',
    score: 0,
    startedAt: Date.now(),
  };
}

export function finishGameSession(
  session: GameSession,
  score: number
): GameSession {
  return {
    ...session,
    status: 'completed',
    score: Math.max(0, Math.floor(score)),
    completedAt: Date.now(),
  };
}

export function createGameResult(
  gameId: GameDefinition['id'],
  score: number,
  correctAnswers: number,
  totalQuestions: number
): GameResult {
  return {
    gameId,
    score: Math.max(0, Math.floor(score)),
    correctAnswers,
    totalQuestions,
    completedAt: new Date().toISOString(),
  };
}

// --------------------------------------------------
// TRIVIA TOURNAMENT
// --------------------------------------------------

export function calculateTriviaScore(
  correctAnswers: number,
  totalQuestions: number,
  pointsPerCorrectAnswer = 10
): number {
  const correct = Math.max(
    0,
    Math.min(
      Math.floor(correctAnswers),
      Math.floor(totalQuestions)
    )
  );

  return correct * Math.max(
    0,
    pointsPerCorrectAnswer
  );
}

// --------------------------------------------------
// NUMBER GUESS (1–100)
// --------------------------------------------------

export type GuessFeedback =
  | 'too-low'
  | 'too-high'
  | 'correct'
  | 'invalid';

export function checkNumberGuess(
  guess: number,
  secretNumber: number
): GuessFeedback {
  if (
    !Number.isInteger(guess) ||
    guess < 1 ||
    guess > 100 ||
    !Number.isInteger(secretNumber) ||
    secretNumber < 1 ||
    secretNumber > 100
  ) {
    return 'invalid';
  }

  if (guess < secretNumber) {
    return 'too-low';
  }

  if (guess > secretNumber) {
    return 'too-high';
  }

  return 'correct';
}

// Practice puzzle only. Math.random is not a secure
// random source and must never determine financial outcomes.

export function generatePracticeNumber(): number {
  return Math.floor(Math.random() * 100) + 1;
}

// --------------------------------------------------
// LOWEST UNIQUE NUMBER
// --------------------------------------------------

export function findLowestUniqueNumber(
  entries: number[]
): number | null {
  const counts = new Map<number, number>();

  for (const entry of entries) {
    if (
      !Number.isInteger(entry) ||
      entry < 1
    ) {
      continue;
    }

    counts.set(
      entry,
      (counts.get(entry) ?? 0) + 1
    );
  }

  const uniqueNumbers = entries.filter(
    (entry) =>
      Number.isInteger(entry) &&
      entry >= 1 &&
      counts.get(entry) === 1
  );

  if (uniqueNumbers.length === 0) {
    return null;
  }

  return Math.min(...uniqueNumbers);
}

// --------------------------------------------------
// THE GREEDY SPLIT
// Practice resource-sharing puzzle.
// --------------------------------------------------

export type SplitDecision = {
  offered: number;
  accepted: boolean;
  remaining: number;
};

export function evaluateGreedySplit(
  total: number,
  offered: number,
  minimumAcceptable: number
): SplitDecision {
  const safeTotal = Math.max(0, total);

  const validOffer = Math.max(
    0,
    Math.min(offered, safeTotal)
  );

  const accepted =
    validOffer >= minimumAcceptable;

  return {
    offered: validOffer,
    accepted,
    remaining: accepted
      ? safeTotal - validOffer
      : safeTotal,
  };
}

// --------------------------------------------------
// DAILY CHALLENGE
// --------------------------------------------------

export function calculateDailyChallengeScore(
  completedTasks: number,
  totalTasks: number
): number {
  if (
    !Number.isFinite(totalTasks) ||
    totalTasks <= 0
  ) {
    return 0;
  }

  const completed = Math.max(
    0,
    Math.min(completedTasks, totalTasks)
  );

  return Math.round(
    (completed / totalTasks) * 100
  );
}

// --------------------------------------------------
// MINEFIELD MEMORY PUZZLE
// --------------------------------------------------

export type GridCell = {
  id: number;
  isRevealed: boolean;
  isSafe: boolean;
};

export function createPracticeGrid(
  size = 5
): GridCell[] {
  const safeSize = Math.max(
    2,
    Math.min(Math.floor(size), 10)
  );

  return Array.from(
    { length: safeSize * safeSize },
    (_, index) => ({
      id: index,
      isRevealed: false,
      isSafe: true,
    })
  );
}

export function revealGridCell(
  grid: GridCell[],
  cellId: number
): GridCell[] {
  return grid.map((cell) =>
    cell.id === cellId
      ? {
          ...cell,
          isRevealed: true,
        }
      : cell
  );
}

// --------------------------------------------------
// PLAYER SCOREBOARD
// --------------------------------------------------

export function sortPlayersByScore(
  players: GamePlayer[]
): GamePlayer[] {
  return [...players].sort(
    (a, b) => b.score - a.score
  );
}

// --------------------------------------------------
// GAME CATALOG HELPERS
// --------------------------------------------------

export function getReadyGames(): GameDefinition[] {
  return BRITUME_GAMES.filter(
    (game) => game.status === 'ready'
  );
}

export function getGamesByCategory(
  category: GameDefinition['category']
): GameDefinition[] {
  return BRITUME_GAMES.filter(
    (game) => game.category === category
  );
}
