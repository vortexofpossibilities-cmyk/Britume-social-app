# BRITUME Games — Combined Stage 4 Update

This package builds on the Stage 3 Live Guess Duel project. It expands the playable game catalogue and improves the daily/weekly/monthly competition practice hub.

## Newly playable games
- Maths Classroom — five mixed maths questions.
- Detective Battle — five fictional clue and reasoning questions.
- Restaurant Empire — five restaurant management decisions.
- Market Master — five supply, demand and budgeting decisions.

## Updated screens
- `src/games/gameCatalog.ts` — marks the four games as ready.
- `app/games/[game].tsx` — implements the new game rounds.
- `app/(tabs)/games.tsx` — adds routes for the new games.
- `app/games/competitions.tsx` — daily, weekly and monthly practice challenge cards now open playable games.

## Important status
This is a playable practice expansion, not a completed online championship backend. Daily/weekly/monthly cards are practice formats. Global leaderboards, verified tournament registration, scheduled multiplayer brackets, anti-cheat validation for every game, and admin tournament controls still require backend work and testing. The existing live Guess the Number duel remains the only game with the Stage 3 live-duel backend.

All games in this package are free practice experiences using non-transferable demo scores. There are no wagers, paid entries, cash prizes or withdrawals.

## Install
Extract the ZIP and use the `Britume-social-app-main` folder as the project root. If updating an existing checkout manually, replace the four files listed under Updated screens and add this README. Run the project typecheck/build in your development environment before deploying.
