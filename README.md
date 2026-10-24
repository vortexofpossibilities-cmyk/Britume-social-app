# BRITUME — organized native app foundation

Expo + React Native + TypeScript + Expo Router + Supabase.

## Separate screens
- `app/(auth)/sign-in.tsx`
- `app/(auth)/sign-up.tsx`
- `app/(tabs)/index.tsx` — Home/feed
- `app/(tabs)/discover.tsx` — real public profiles
- `app/(tabs)/create.tsx` — create text posts
- `app/(tabs)/offline.tsx` — honest empty state until downloads are implemented
- `app/(tabs)/profile.tsx` — edit profile, visibility, sign out, Settings shortcut
- `app/settings.tsx` — separate Settings screen
- `src/auth/AuthProvider.tsx` — session state
- `src/lib/supabase.ts` — backend client
- `supabase/schema.sql` — starter database schema and RLS policies

## Setup
1. Install Node.js LTS and Git on a computer.
2. Create a project at Supabase.
3. In Supabase SQL Editor, run `supabase/schema.sql`.
4. Copy `.env.example` to `.env` and fill in your Supabase project URL and publishable/anon key.
5. Run:
   ```sh
   npm install
   npx expo install --fix
   npm run typecheck
   npx expo start
   ```
6. Open the project in Expo Go or an Android emulator. Confirm signup, email verification, login, profile editing, public-profile discovery, text-post publishing, feed refresh, and sign out.

## Important
- No seeded/fake profiles, posts, songs, likes, or counts.
- Supabase project URL and publishable/anon key are client values; NEVER put a `service_role` key in the app or commit secrets.
- The public/private profile setting affects profile discovery. Full private-account semantics, follow approvals, and visibility of all related data need additional implementation and security tests before launch.
- Photo/video upload, comments, likes, follows, communities, messaging/calls, music, offline downloads, notifications, report/block tools, and moderation are not implemented in this first foundation.
- A working app foundation is not the same as a production-ready social network or Google Play approval.

## Android release
Before release, confirm the Android package ID, configure EAS Build, create a signed Android App Bundle, test on real devices, publish a privacy policy, complete Play Console Data safety/content declarations, and implement user safety/moderation requirements. Google Play review and any required testing period are separate from generating the build.
