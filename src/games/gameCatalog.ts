
export type GameCategory =
  | 'skill'
  | 'strategy'
  | 'social'
  | 'practice';

export type GameDefinition = {
  id: string;
  name: string;
  description: string;
  category: GameCategory;
  icon: string;
  accent: string;
  mode: 'practice' | 'competition';
  players: string;
  status: 'ready' | 'coming-soon';
};

export const BRITUME_GAMES: GameDefinition[] = [
  {
    id: 'pooled-spin',
    name: 'Pooled Spin Wheel',
    description: 'Explore a colourful practice wheel.',
    category: 'practice',
    icon: 'sync-circle-outline',
    accent: '#9B59B6',
    mode: 'practice',
    players: 'Solo',
    status: 'ready',
  },
  {
    id: 'trivia',
    name: 'Trivia Tournament',
    description: 'Answer questions and test your knowledge.',
    category: 'skill',
    icon: 'help-circle-outline',
    accent: '#3498DB',
    mode: 'competition',
    players: '1–20',
    status: 'ready',
  },
  {
    id: 'last-standing',
    name: 'Last One Standing',
    description: 'Compete in rounds of knowledge challenges.',
    category: 'skill',
    icon: 'trophy-outline',
    accent: '#E67E22',
    mode: 'competition',
    players: '2–20',
    status: 'coming-soon',
  },
  {
    id: 'daily-challenge',
    name: 'Daily Challenge',
    description: 'Complete a fresh daily puzzle.',
    category: 'skill',
    icon: 'calendar-outline',
    accent: '#16A085',
    mode: 'practice',
    players: 'Solo',
    status: 'ready',
  },
  {
    id: 'prediction-pot',
    name: 'Prediction Pot',
    description: 'Practice making predictions using sample events.',
    category: 'practice',
    icon: 'analytics-outline',
    accent: '#2980B9',
    mode: 'practice',
    players: 'Solo',
    status: 'coming-soon',
  },
  {
    id: 'greedy-split',
    name: 'The Greedy Split',
    description: 'Solve resource-sharing decisions.',
    category: 'strategy',
    icon: 'git-branch-outline',
    accent: '#D35400',
    mode: 'competition',
    players: '2',
    status: 'coming-soon',
  },
  {
    id: 'lowest-bid',
    name: 'Lowest Unique Bid',
    description: 'Find the lowest unique number in a practice round.',
    category: 'strategy',
    icon: 'calculator-outline',
    accent: '#8E44AD',
    mode: 'competition',
    players: '2–20',
    status: 'coming-soon',
  },
  {
    id: 'number-guess',
    name: 'Number Guess',
    description: 'Use logic to discover the hidden number.',
    category: 'skill',
    icon: 'number-outline',
    accent: '#27AE60',
    mode: 'practice',
    players: 'Solo',
    status: 'ready',
  },
  {
    id: 'rocket',
    name: 'Crash / Rocket',
    description: 'Explore a non-monetary rocket timing simulation.',
    category: 'practice',
    icon: 'rocket-outline',
    accent: '#E74C3C',
    mode: 'practice',
    players: 'Solo',
    status: 'coming-soon',
  },
  {
    id: 'minefield',
    name: 'Minefield Battle',
    description: 'Test your memory on a safe puzzle grid.',
    category: 'strategy',
    icon: 'grid-outline',
    accent: '#C0392B',
    mode: 'competition',
    players: '1–4',
    status: 'coming-soon',
  },
  {
    id: 'mystery-box',
    name: 'Mystery Box',
    description: 'Explore a free mystery-box experience.',
    category: 'practice',
    icon: 'gift-outline',
    accent: '#F39C12',
    mode: 'practice',
    players: 'Solo',
    status: 'coming-soon',
  },
];
