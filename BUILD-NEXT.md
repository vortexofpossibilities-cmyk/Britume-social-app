# BRITUME — next steps from a phone

1. Extract this ZIP in My Files or a code editor that supports ZIP files.
2. Compare it with `https://github.com/vortexofpossibilities-cmyk/Britume-social-app` before uploading; keep the repository's existing icon and splash assets.
3. Upload folders/files into the existing repo without deleting working files.
4. Check `package.json`, then install dependencies in an Expo-compatible build environment.
5. Run TypeScript checks and fix errors before adding Supabase credentials.
6. Set `.env` values using `.env.example`; configure the Supabase project and review `supabase/schema.sql` and row-level security before applying it.
7. Test authentication and each feature using real accounts. Mark features live only after end-to-end testing.

## Device note
The project is intended to be manageable from Android, but producing a signed Play Store build may require an Expo EAS build or another compatible cloud build process.
