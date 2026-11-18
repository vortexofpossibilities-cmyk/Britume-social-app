# BRITUME feature fixes — 18 November 2026

## Included in this update

- Communities: added a **Full view** action that opens the full community post and its discussion; added post options for hiding, blocking the author, and deleting your own post. Community list cards now also expose Hide, Block owner, and owner-only Delete actions.
- Home: active stories are represented by author icons in the Stories strip, with profile photos where available. Story records are not treated as ordinary feed posts.
- Navigation: removed the Gifts/Rewards icon from the bottom navigation. The Games screen and game code were not changed.
- Wallet: added a plain-language explanation of purchased, earned, promotional points and separate game coins, plus a clear notice about wallet functions that are not yet enabled.
- Messages: clearing the people-search field now clears and hides stale search results. Added browser voice recording and upload for web users; microphone permission is required. Existing image/video attachment flow is retained.
- Reels: added repeat, like, comments, poll, edit and location side actions. Repeat, like and comments are connected to existing app data. Poll, edit-existing-Reel and location are clearly marked as not yet implemented. Reels now attempt unmuted autoplay immediately.
- Public profile: displays the saved profile photo when available and gives the profile owner an Add/Change photo action that opens the existing working profile-photo uploader.

## Important limitations / checks still required

- Browser autoplay policies can still prevent sound from starting automatically until the user interacts with the page. The app now requests unmuted playback immediately; no website can override browser/device autoplay restrictions.
- Voice recording is implemented for the BRITUME web app in browsers that support `MediaRecorder` and microphone access. A native Android/iOS recording implementation still needs a native audio-recording module.
- Poll creation/voting, editing an already-published Reel, and attaching/viewing Reel locations are not implemented by the existing backend, so their buttons explain that limitation rather than pretending to save data.
- Community Hide currently hides the card for the current screen session. Block is persisted using the existing `user_blocks` table. Delete is available only to the post/community owner and remains protected by the existing backend permissions.
- Wallet deposits, withdrawals, cash redemption and point transfers remain disabled; the wallet information card states this explicitly.
- TypeScript syntax transpilation passed for all edited TSX files. A full project typecheck/build could not be run because dependencies were not installed in this environment; the install attempt timed out. Run `npm install`, then `npm run typecheck` and `npm run build` before deployment.
- No SQL migration was added. Existing Supabase tables, storage buckets and RLS policies must already be configured for the current features.

## Protected scope

- No Games files or functionality were changed.
- Gifts/Rewards functionality was not changed; only its bottom-navigation icon was removed.
