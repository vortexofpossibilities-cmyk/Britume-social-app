# BRITUME Games Arena – first playable build

This package adds a Royal Blue and Gold Games Arena to the existing Expo Router BRITUME app.

## Playable games in this build

- Guess the Number (practice rival)
- Math Sprint Duel (three timed questions)
- Trivia Tournament (five questions)
- Memory Match (eight pairs)
- Obstacle Dash (ten lane choices)
- Ice Bridge (eight safe steps)
- Business Tycoon (five business decisions)
- Word Scramble
- Lane Racer (ten stages)
- Wrestling Tactics (friendly turn-based sports strategy)
- City Builder (five community-planning decisions)
- Science Battle (five questions)
- Geography Challenge (five questions)
- The Fair Deal (resource-sharing puzzle)

The catalogue also lists additional planned games such as 3D Pool, Grand Distance Racing, Restaurant Empire and Detective Battle. They are clearly marked **Coming Soon** rather than presented as finished games.

## Match and competition foundation

- `app/games/rooms.tsx` – match-type overview screen.
- `app/games/competitions.tsx` – daily, weekly and monthly competition calendar preview.

The new SQL migration adds data structures for Quick Match, Scheduled Match, Championship and Private Room, plus daily, weekly and monthly competition schedules. It intentionally contains no payment, wager, wallet, cash-prize or withdrawal fields.

## Important implementation boundaries

- Playable game rounds currently run locally on the device and use practice scores only.
- The robot rival is a local practice opponent, not a remote human player.
- Live multiplayer, private room invitations, realtime synchronisation, anti-cheat score validation and automated tournament scheduling still require trusted server/Realtime implementation.
- The migration is supplied for review; it has **not** been applied to your Supabase project.
- No game score is connected to the BRITUME wallet or redeemable balance.

## Files changed

- `app/(tabs)/games.tsx` – refreshed Games Arena catalogue and routes.
- `app/games/[game].tsx` – playable game screens and round logic.
- `src/games/gameCatalog.ts` – game catalogue and ready/coming-soon status.
- `supabase/migrations/202611140001_games_arena_demo_foundation.sql` – room and competition database foundation.
