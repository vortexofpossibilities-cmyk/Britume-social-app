# BRITUME Royal Blue 3D Claymorphism theme update

## Included
- Updated the default BRITUME Special palette to the Royal Blue 3D Claymorphism palette.
- Made the Light/Dark mode switch change the active surface, text, border, and background palette.
- Added a shared route wrapper so the active material background is applied behind all 37 route screens.
- Applied the shared themed background to the root navigator and tab navigator.
- Increased clay surface, tile, button, icon, and tab-navigation depth/shadow treatment.
- Updated the shared Page/Panel/Action/Field UI primitives to use the live theme context.
- Existing route components and their business logic were retained; route wrappers do not change navigation handlers or screen state.

## Files
- 44 requested theme/screen files were updated (37 route screens, 2 layouts, 5 shared theme files).
- 2 supporting component files are included: `src/components/ThemeScreen.tsx` and the theme-aware `src/components/UI.tsx`.

## Validation
- Parsed all 72 app/src TypeScript and TSX files with the TypeScript transpiler: no syntax errors.
- Full `tsc --noEmit` validation could not be completed in this environment because project dependencies and the Expo TypeScript base config are not installed in this extracted archive. Run `npm install` and then `npm run typecheck` after replacing the files in your project.
