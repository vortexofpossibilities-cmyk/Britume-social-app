# BRITUME feature status (audit baseline)

## Existing project structure
- Expo Router + React Native + TypeScript project
- Email sign-in and sign-up screen routes
- Home feed queries public posts from Supabase when environment variables are configured
- Create, Discover, Offline Library, Profile, and Settings screens
- Supabase client helper, `.env.example`, and initial `supabase/schema.sql`
- App icon and splash screen are stored in `assets/` in the current GitHub repository; add those files to this ZIP if they are not present in the extracted copy.

## Screens added in this bundle
- Feature hub, Stories, Communities, Messages, Notifications, BRITUME AI, Studio, Games, Competitions, Dashboard, Privacy & Safety.
- These are navigable feature foundations, not claims that every service is already live.

## Still needs implementation/integration
- Verify all existing routes and Supabase SQL against the current GitHub main branch before replacing files.
- Supabase project URL/anon key configuration, SQL migration run, RLS testing and auth email settings.
- Photo/video upload, likes/comments/follows, stories expiry, communities, realtime messaging, notifications, AI provider, audio/video calling, music licensing/offline rights, games, creator Studio engine and moderation/reporting.
- Build and test Android package and web deployment.

## Important
Do not put service-role keys or AI provider secrets in the mobile app. Public sample/demo content is not proof of real users or live backend functionality.
