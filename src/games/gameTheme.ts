
import { BRITUME_GAMES } from './gameCatalog';

// --------------------------------------------------
// BRITUME GAMES THEME
// Shared appearance settings for all 11 games.
// --------------------------------------------------

export type GameTheme = {
  background: string;
  surface: string;
  surfaceSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  success: string;
  warning: string;
  danger: string;
  muted: string;
};

// --------------------------------------------------
// LIGHT THEME
// --------------------------------------------------

export const GAME_THEME_LIGHT: GameTheme = {
  background: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF0F5',
  text: '#171923',
  textSecondary: '#697386',
  border: '#E1E5ED',
  primary: '#6750A4',
  success: '#16865B',
  warning: '#D58A16',
  danger: '#D94343',
  muted: '#9AA2B1',
};

// --------------------------------------------------
// DARK THEME
// --------------------------------------------------

export const GAME_THEME_DARK: GameTheme = {
  background: '#101116',
  surface: '#1B1D26',
  surfaceSecondary: '#252834',
  text: '#FFFFFF',
  textSecondary: '#A7ADBC',
  border: '#343744',
  primary: '#B49AFF',
  success: '#50D69A',
  warning: '#FFC15C',
  danger: '#FF7777',
  muted: '#777F91',
};

// --------------------------------------------------
// THEME SELECTOR
// --------------------------------------------------

export function getGameTheme(
  isDark: boolean
): GameTheme {
  return isDark
    ? GAME_THEME_DARK
    : GAME_THEME_LIGHT;
}

// --------------------------------------------------
// GAME ACCENT COLOURS
// --------------------------------------------------

export function getGameAccent(
  gameId: string
): string {
  const game = BRITUME_GAMES.find(
    (item) => item.id === gameId
  );

  return game?.accent ?? '#6750A4';
}

// --------------------------------------------------
// SHARED GAME CARD SETTINGS
// --------------------------------------------------

export const GAME_CARD_STYLE = {
  borderRadius: 20,
  padding: 16,
  marginVertical: 7,
} as const;

// --------------------------------------------------
// SHARED GAME BUTTON SETTINGS
// --------------------------------------------------

export const GAME_BUTTON_STYLE = {
  borderRadius: 14,
  minHeight: 48,
  paddingHorizontal: 20,
} as const;

// --------------------------------------------------
// GAME GRID SETTINGS
// --------------------------------------------------

export const GAME_GRID_STYLE = {
  columns: 2,
  gap: 12,
} as const;

// --------------------------------------------------
// GAME ANIMATION SETTINGS
// --------------------------------------------------

export const GAME_ANIMATION = {
  short: 180,
  normal: 280,
  slow: 450,
} as const;
