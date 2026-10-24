# BRITUME — start here (phone-friendly guide)

Welcome! This is the BRITUME mobile-app starter project. Keep a copy of this ZIP as your backup.

## Important before uploading

- This is a starter project, not a finished or production-ready social network.
- Do not delete or replace your existing `Britume-` website repository.
- The recommended destination is the currently empty `Britume` repository: https://github.com/vortexofpossibilities-cmyk/Britume
- Do not upload `.env` files or passwords/API secrets to GitHub. `.env.example` is safe as a template; real secret files must stay private.
- You do not need to install Supabase on your phone or computer. If you choose Supabase as the hosted backend, you configure it through its website. The app will not have real cloud sign-in/posts until a backend project is configured and tested.

## Upload the extracted project to GitHub

1. Download this ZIP to your Android phone.
2. Open your phone's Files / My Files app, go to Downloads, and extract the ZIP into a new folder.
3. Open https://github.com/vortexofpossibilities-cmyk/Britume and sign in.
4. If GitHub shows the empty repository, tap **Add file** → **Upload files** (the wording may vary on mobile).
5. Select the extracted project files and folders. Upload the *contents* of the extracted project, not the ZIP itself. Keep folder paths such as `app/`, `src/`, and `supabase/` intact.
6. Scroll down to **Commit changes**. Use a message such as `Add BRITUME mobile starter`, then commit to `main`.
7. If the phone's file picker cannot select multiple files/folders while preserving folders, stop and tell ChatGPT what options you see. Do not upload only a few files; we will choose another phone-friendly route.

## What is in this starter

- Expo + React Native + TypeScript app structure
- Email/password authentication screens wired for a configured hosted backend
- Starter Home/feed, Discover, Create, Profile, and settings screens
- Supabase client setup and initial SQL schema / row-level security policies
- Example environment-variable template

## What is not finished

This starter has not been verified as a complete production release. Before real users rely on it, the project must be installed, type-checked, tested on an Android device, and its backend configuration and security policies reviewed. Advanced features such as shared media uploads, comments/likes/follows, messaging/calls, AI, live weather, a music studio, multiplayer games, notifications, and moderation are not all implemented as live services here.

## Next steps after uploading

1. Check that all files appear in the repository.
2. Review `README.md` for setup instructions.
3. Configure a hosted backend and environment variables without publishing secrets.
4. Run checks and test the app before publishing.

Never put a Supabase `service_role` key or any private AI/API key in a mobile app or public GitHub repository.
