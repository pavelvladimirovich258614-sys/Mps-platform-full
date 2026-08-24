# Session handoff — МПС

## Final verified state — 2026-08-25

F15–F34 are complete and deployed. Current local `main`, `origin/main` and the VPS checkout are synchronized during this checkpoint. The active production frontend includes F34 at `3451397`; its rollback copy is `/root/backups/mps-frontend-f34-20260824T172052Z`. `mps-backend` remained active throughout the frontend-only F34 rollout, and `deploy/smoke.sh` passed.

## Completed delivery cycle

- F15–F24: article edit/delete, TipTap media/carousels and formatting boundaries, plus private drafts with safe PATCH/publish flows.
- F25: JPEG/PNG/WebP plus HEIC/HEIF conversion to WebP and direct AVIF support; unsupported media receives a Russian 422 explanation.
- F26–F28: composer closes only after successful POST/PATCH, drafts remain editable through the list, and own public profile has owner-only logout through •••.
- F29: avatar picker now accepts the F25 image set and clears its input after capture, so repeated selection of the same file works.
- F30: each draft card has a confirmation-gated delete control that removes the draft without opening composer.
- F31: composer provides explicit cover selection and preview; `Post.cover_url` is returned by list/detail/draft DTOs and has priority over inline body media.
- F32: cover image and former gradient fallback were made mutually exclusive.
- F33: final product decision removed the fallback altogether. A missing/blank cover_url renders no upper cover element, no «Под солнцем» text and no reserved cover height.
- F34: sidebar presence renders real avatar_url or the existing gradient fallback; green online dots are anchored lower-right on sidebar/public-profile avatars. `/online` retains the 120-second `last_seen_at` rule without WebSocket, refreshes after auth and polls every 30 seconds with timer cleanup.

## Production evidence

- F34 rollout: VPS fast-forwarded `e7e97b7 → 3451397`; remote frontend build passed, served `index-C-CVCK1W.js` returned HTTP 200 and carries the F34 markers; `deploy/smoke.sh` returned `[OK]`; backend stayed `active` and was not restarted.
- Guest browser DOM confirmed a real sidebar avatar and its green dot. A Telegram-authenticated browser session was unavailable. The only public online user expired from the 120-second window before the public-profile dot could be rechecked live; the source and regression contracts remain green.

## Known boundary

Email delivery is still blocked by external Unisender/HostKey networking. F27 intentionally hides email login and leaves Telegram Login as the only visible guest path. The email implementation and API endpoints remain intact; restore the UI by setting `EMAIL_LOGIN_ENABLED` after the delivery infrastructure has been repaired and verified. Do not change email transport, credentials, firewall or VPS network configuration without a separate decision.

## Next unstarted feature — F35

The personal-cabinet tabs «Активность», «Публикации», «Ответы», «Лайки» and «Подписки» still render placeholders rather than real data. The «Подписаться» action in the subscribers list is also unfinished. Treat both as one next major feature F35; it has not been started.
