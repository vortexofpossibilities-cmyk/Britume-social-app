# BRITUME localization — Phase 1

## Included
- Repaired `src/contexts/LanguageContext.tsx`. In the supplied archive it was an accidental duplicate of `app/settings.tsx`, not a language provider.
- Added a language selector containing 120+ language choices.
- Added device-locale detection on first launch.
- Added persistent manual language selection using AsyncStorage.
- Added English and Setswana translation dictionaries for Settings and bottom navigation.
- Connected the bottom navigation labels to the language context.
- Added `expo-localization` to dependencies.

## Important translation status
A language appearing in the selector does **not** mean its full translation has been completed. This first phase includes complete dictionaries only for English and the initial Setswana strings supplied here. Other choices currently fall back to English and Settings displays a notice when a full pack is not installed. Do not advertise all 120+ languages as fully translated yet.

The app does not translate posts, comments, or private messages. User-created content stays in its original language.

## Install
From the project root run:

```bash
npx expo install expo-localization
npm install
npx tsc --noEmit
```

If Expo asks to align package versions, accept the SDK 54 compatible version it recommends.

## Next phase
Add reviewed translation packs for the remaining languages and connect every screen's interface strings to `useLanguage().t(...)`. This must include authentication, Home/feed, profile, communities, messages, notifications, AI, stories, privacy, and all dialogs/errors.
