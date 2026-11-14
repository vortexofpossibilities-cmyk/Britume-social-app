# BRITUME Games Arena — Stage 2

This update adds the first secure online-room layer to the existing Games Arena.

## Files changed / added

1. `app/games/rooms.tsx` — replaces the planned-only room screen with game selection, Quick Match, private-room creation, room-code joining, live status refresh, player count and leave-room controls.
2. `src/games/liveRooms.ts` — typed Supabase RPC helpers and Realtime subscriptions.
3. `supabase/migrations/202611140002_games_live_rooms.sql` — secure RPCs for matchmaking, private rooms, joining/leaving, participant-only room visibility and Realtime publication setup.
4. `BRITUME-GAMES-STAGE-2-README.md` — this guide.

## Apply the new SQL

The previous migration `202611140001_games_arena_demo_foundation.sql` created the base tables. This is a **new migration**, not a replacement for that one.

1. Back up the Supabase project first.
2. Open the new file `supabase/migrations/202611140002_games_live_rooms.sql` from this ZIP.
3. Copy its full contents into Supabase SQL Editor and run it once.
4. Confirm Supabase reports success.

## What works after this stage is installed

- Signed-in players can open Quick Match rooms.
- A second player can be matched into an available room for the same game.
- Players can create a private room and share its six-character code.
- Friends can join a private room by code.
- Room membership and status changes are sent through Supabase Realtime.
- Room writes are restricted to the server-side RPC functions; clients cannot directly insert members or alter room status.

## What is still not finished

This stage does **not** yet synchronize game actions, turns, timers or final scores. It does not provide anti-cheat score verification, automated scheduled competitions, or real-world rewards. The room can become `ready`, but a fully playable human-vs-human match needs the next gameplay-sync stage.

All matches remain free practice with demo-only scores. There are no entry fees, wagers, wallet deductions or cash prizes.

## App setup

The app must already have valid `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` environment variables, and users must be signed in. Do not put a Supabase service-role key in the app.
