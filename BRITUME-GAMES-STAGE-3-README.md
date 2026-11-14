# BRITUME Games Stage 3 — Live Guess the Number Duel

This update adds the first server-controlled live multiplayer game, built on the Stage 2 room system.

## New files
- `app/games/live/[roomId].tsx` — live Guess the Number match screen.
- `src/games/liveDuel.ts` — Supabase RPC, event history and Realtime subscription helpers.
- `supabase/migrations/202611140003_live_guess_duel.sql` — private server state, visible guess events, turn validation and server-side winner/result recording.
- `BRITUME-GAMES-STAGE-3-README.md` — this guide.

## Existing file updated
- `app/games/rooms.tsx` — adds an Open Live Match action for ready/playing `number-guess` rooms.

## Apply the migration
1. Back up the Supabase project.
2. Open `supabase/migrations/202611140003_live_guess_duel.sql`.
3. Review the SQL and run it in the Supabase SQL Editor.
4. Confirm the editor reports success.

## Try it
1. Deploy/commit the updated app files.
2. Sign in with two separate BRITUME accounts on two devices/browsers.
3. On the first account, open Games → Live Match Rooms → select Guess the Number → Create Private Room.
4. Share the six-character room code with the second account.
5. On the second account, join that code.
6. Once both are in the room, both can open Live Match. One player starts the match; players take turns guessing 1–100.

## Security and limitations
- The secret number is stored in a table inaccessible to client roles.
- Turns and guesses are validated by Supabase RPC functions.
- The winner and verified result are recorded server-side.
- Realtime publishes guesses; clients refresh turn state through an authenticated RPC.
- This is a first playable online duel, not a finished multiplayer implementation for every game.
- No entry fees, wagers, wallet transfers, cash prizes or redeemable points are included.
- Test with two real accounts before announcing the feature as live.
