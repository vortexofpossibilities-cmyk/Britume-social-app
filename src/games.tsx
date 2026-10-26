import React from 'react';
import { FeaturePage } from '../src/components/FeaturePage';
export default function Screen() { return <FeaturePage title={"BRITUME Games"} intro={"A home for quick games and community play."} features={[
    { title: "Planned games", description: "Ludo, chess, Sudoku, pool, cards, football and additional games." },
    { title: "Play modes", description: "Single-player and multiplayer modes need individual game engines and services." },
    { title: "Fair play", description: "Scores and leaderboards must be validated server-side." }
  ]} actions={[

  ]} />; }
