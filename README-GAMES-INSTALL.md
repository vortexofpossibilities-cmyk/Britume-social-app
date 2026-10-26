# BRITUME Games Pack — integration instructions

This is an additive pack for the existing Expo Router BRITUME repository. It is source code, not a tested release build.

## Included
- `app/games-hub.tsx`: game hub route
- `app/game-sudoku.tsx`: playable Sudoku grid with a small built-in puzzle, input, reset and completion check
- `app/game-ludo.tsx`: simple local Ludo-style dice/token race against a basic robot (not official full Ludo rules)
- `app/game-chess.tsx`: chess board UI with a simple robot opponent and basic piece movement (not tournament-grade chess rules)
- `app/game-cards.tsx`: simple high-card duel against robot
- `app/game-football.tsx`: penalty shootout against robot
- `app/game-pool.tsx`: simplified pool aiming/shooting mini-game
- `src/lib/game-storage.ts`: local score/progress storage using AsyncStorage
- `supabase/games-schema.sql`: proposed tables for online rooms and scoreboards
- `src/lib/games-online.ts`: Supabase helper for room creation/joining; requires schema and configured Supabase
- `src/games.tsx`: optional hub replacement snippet, provided separately as `src/games-hub-integration.example.tsx` to avoid silently overwriting your existing screen

## Before installing
1. Download and extract this ZIP.
2. Upload the files/folders into your repository, preserving paths.
3. In `package.json`, add dependency `"@react-native-async-storage/async-storage": "^2.2.0"` to `dependencies`, then install dependencies in your build environment. Do not replace the whole package.json.
4. Commit all files to `main`.
5. Check the existing `app/_layout.tsx` and tab/menu navigation. Add a link to `/games-hub` or link individual game routes. The route files are automatically registered by Expo Router.
6. Add the SQL from `supabase/games-schema.sql` in Supabase SQL Editor only after reviewing it. Configure `.env` using your real Supabase project URL and publishable/anon key. Never put a service-role key in the app.
7. Run `npm install`, `npm run typecheck`, then test on Android.

## Important limitations
- These are starter mini-games, not polished full commercial versions.
- Ludo is a simplified race, chess uses basic movement only and does NOT enforce all chess rules (check, checkmate, castling, en passant, promotions, etc.).
- Card game is high-card duel, not a full deck game like Poker/Uno.
- Football is a penalty-shootout mini-game.
- Pool is a simplified shot simulator, not full 8-ball rules/physics.
- Sudoku includes a fixed starter puzzle, not a full generator.
- Robot opponents use simple deterministic/random choices; they are not sophisticated AI.
- Local saves use AsyncStorage and work only after dependency installation.
- Online room helpers are not enough by themselves to make real-time gameplay: each game needs synchronized moves, validation, reconnect handling, anti-cheat checks and tests. Leaderboard schema is only a foundation.
- No build or gameplay tests have been run in this pack. Do not publish to Google Play until checks pass.
