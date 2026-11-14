export type GameCategory = 'skill' | 'strategy' | 'social' | 'practice';

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

// All games marked ready below have a playable local practice loop.
// Online multiplayer and scheduled tournament services are separate backend work.
export const BRITUME_GAMES: GameDefinition[] = [
  { id: 'number-guess', name: 'Guess the Number', description: 'Outthink the robot and find its hidden number.', category: 'skill', icon: 'number-outline', accent: '#48C6A9', mode: 'practice', players: 'Solo vs robot', status: 'ready' },
  { id: 'math-duel', name: 'Math Sprint Duel', description: 'Solve three timed maths questions against a robot rival.', category: 'skill', icon: 'calculator-outline', accent: '#F4B942', mode: 'competition', players: '2 (robot practice)', status: 'ready' },
  { id: 'trivia', name: 'Trivia Tournament', description: 'Five rounds of general knowledge against the clock.', category: 'skill', icon: 'help-circle-outline', accent: '#58A6FF', mode: 'competition', players: 'Solo vs robot', status: 'ready' },
  { id: 'memory-match', name: 'Memory Match', description: 'Find matching pairs in a colourful card grid.', category: 'skill', icon: 'grid-outline', accent: '#C084FC', mode: 'practice', players: 'Solo', status: 'ready' },
  { id: 'obstacle-dash', name: 'Obstacle Dash', description: 'Choose the safe lane and survive ten fast stages.', category: 'skill', icon: 'flash-outline', accent: '#FB7185', mode: 'competition', players: 'Solo vs robot', status: 'ready' },
  { id: 'ice-bridge', name: 'Ice Bridge', description: 'Cross slippery platforms by remembering safe tiles.', category: 'strategy', icon: 'snow-outline', accent: '#67D4F2', mode: 'practice', players: 'Solo', status: 'ready' },
  { id: 'business-tycoon', name: 'Business Tycoon', description: 'Build a small business through five smart decisions.', category: 'strategy', icon: 'business-outline', accent: '#F0B44D', mode: 'competition', players: 'Solo vs robot', status: 'ready' },
  { id: 'word-scramble', name: 'Word Scramble', description: 'Unscramble words before the robot does.', category: 'skill', icon: 'text-outline', accent: '#A78BFA', mode: 'competition', players: 'Solo vs robot', status: 'ready' },
  { id: 'race-rush', name: 'Lane Racer', description: 'Dodge traffic and collect points over ten stages.', category: 'skill', icon: 'car-sport-outline', accent: '#F97316', mode: 'practice', players: 'Solo vs robot', status: 'ready' },
  { id: 'arena-tactics', name: 'Wrestling Tactics', description: 'A friendly turn-based sports strategy contest.', category: 'strategy', icon: 'shield-outline', accent: '#F87171', mode: 'competition', players: 'Solo vs robot', status: 'ready' },
  { id: 'city-builder', name: 'City Builder', description: 'Balance homes, parks and services to grow a city.', category: 'strategy', icon: 'business-outline', accent: '#34D399', mode: 'practice', players: 'Solo', status: 'ready' },
  { id: 'science-battle', name: 'Science Battle', description: 'Answer science questions and beat the robot score.', category: 'skill', icon: 'flask-outline', accent: '#22D3EE', mode: 'competition', players: 'Solo vs robot', status: 'ready' },
  { id: 'geography-quiz', name: 'Geography Challenge', description: 'Test your knowledge of countries and the world.', category: 'skill', icon: 'earth-outline', accent: '#4ADE80', mode: 'competition', players: 'Solo vs robot', status: 'ready' },
  { id: 'greedy-split', name: 'The Fair Deal', description: 'Make fair resource-sharing decisions in a business puzzle.', category: 'strategy', icon: 'git-branch-outline', accent: '#D97706', mode: 'practice', players: 'Solo vs robot', status: 'ready' },
  { id: 'last-standing', name: 'Last One Standing', description: 'Stay in the contest through quick knowledge rounds.', category: 'social', icon: 'trophy-outline', accent: '#E879F9', mode: 'competition', players: '2–20 (online planned)', status: 'coming-soon' },
  { id: 'pool-3d', name: '3D Pool Challenge', description: 'Aim, set power and practise your shots.', category: 'skill', icon: 'ellipse-outline', accent: '#60A5FA', mode: 'practice', players: 'Solo / friends planned', status: 'coming-soon' },
  { id: 'car-racing', name: 'Grand Distance Racing', description: 'Race across selectable distance challenges.', category: 'skill', icon: 'speedometer-outline', accent: '#F97316', mode: 'competition', players: 'Multiplayer planned', status: 'coming-soon' },
  { id: 'maths-classroom', name: 'Maths Classroom', description: 'Multiplayer maths challenges across school topics.', category: 'skill', icon: 'school-outline', accent: '#FBBF24', mode: 'competition', players: 'Multiplayer planned', status: 'coming-soon' },
  { id: 'restaurant-empire', name: 'Restaurant Empire', description: 'Plan menus, staff and customer service.', category: 'strategy', icon: 'restaurant-outline', accent: '#FB923C', mode: 'practice', players: 'Solo / friends planned', status: 'coming-soon' },
  { id: 'market-master', name: 'Market Master', description: 'Learn supply, demand and budgeting in a simulation.', category: 'strategy', icon: 'stats-chart-outline', accent: '#2DD4BF', mode: 'practice', players: 'Solo / friends planned', status: 'coming-soon' },
  { id: 'detective-battle', name: 'Detective Battle', description: 'Solve fictional mysteries using clues and logic.', category: 'skill', icon: 'search-outline', accent: '#A3A3A3', mode: 'competition', players: 'Multiplayer planned', status: 'coming-soon' },
];
