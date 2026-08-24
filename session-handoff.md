# Session handoff — МПС

## Verified local state — 2026-08-24

F01–F31 are recorded as passing. F30 is deployed at `11dff37`; F29 is deployed at `629f824`; F28 is deployed at `df2cb6b`; F27 is deployed at `6a02ddd` and live login UI shows only Telegram Login; F26 is deployed at `2be15d5`. F31 is local-only and awaits separate backend+frontend rollout approval.

- The reported upload failure was not a PNG/JPEG regression. Current composer chain remains `onChange → apiForm(POST /media) → insertImageAtDocumentStart`; existing PNG baseline passed.
- The actual cause for iPhone photos was HEIC/HEIF being excluded by both the native file picker `accept` list and the backend MIME allowlist. The UI now accepts JPEG, PNG, WebP, HEIC, HEIF and AVIF.
- Backend now depends on `pillow-heif==1.5.0`. It registers the HEIF decoder and converts HEIC/HEIF to WebP before storage; AVIF is accepted and preserved as AVIF. An unsupported file receives `422 «Допустимы JPEG, PNG, WebP, HEIC, HEIF или AVIF»`.
- Fresh verification: F25 RED frontend 1 failed / 18 passed; RED backend after dependency 4 failed / 7 passed. GREEN media 11 passed and RichTextEditor 19 passed. Full backend 70 passed; full frontend 15 files / 85 passed; `npm run build` passed (115 modules, standard chunk-size warning).
- `./init.sh` installed MPS requirements, then stopped only at the external global Hermes/desktop `pip check`; that environment is not part of MPS and was not modified.

## F29 local completion

- Diagnosis: «Загрузить аватар» is a real hidden file input in `Profile`: `onChange → auth.uploadAvatar → multipart POST /media → PATCH /me {avatar_url}`. User model, `20260818_0002_users` migration, `UserUpdate` and `PATCH /me` all already support the field. Production `/users/2/profile` returned `/media/f967a814ad4d4082ad70a662a20a8c58.png`; its HEAD was 200 image/png, proving the displayed avatar is local media rather than Telegram's external `photo_url`.
- Root cause: Profile picker accepted only JPEG/PNG/WebP although F25 media accepts HEIC/HEIF/AVIF; its retained input value also suppresses a browser `change` when the user selects the same file again. This is a partially stale UI, not a missing endpoint or placeholder.
- Fix: picker accepts JPEG, PNG, WebP, HEIC, HEIF and AVIF and clears its value after reading the File. Existing `useAuth` regression continues to cover the exact multipart POST/PATCH chain.
- Fresh evidence: RED `Profile.test.tsx` — 1 expected failure / 3 passed. GREEN targeted `Profile` + `useAuth` — 2 files / 7 passed. Full frontend — 15 files / 92 passed; build success (115 modules, standard chunk-size warning). Full backend unchanged — 70 passed in 17.96s. `./init.sh` stopped only on the known external global Hermes/desktop pip check.
- F29 frontend was subsequently deployed at `629f824`; its live smoke passed. Continue to verify HEIC/HEIF and same-file repeat behavior in a real Telegram session when available.

## F30 local completion

- Cover diagnosis: `PostCard` in Feed and `ArticleComments` always render the dark-gradient placeholder labelled `Под солнцем`. Inline TipTap images are body content rendered by `RichTextContent`, not cover candidates. Although backend `Post.cover_url` exists, the DTO does not return it and no frontend API type, composer or renderer consumes it. This is a hard-coded fallback/design rather than a failed upload.
- Completed deletion scope: every draft card now has an independent «Удалить» button, so no button is nested in a button. It opens the F15-style confirmation modal; only confirmation uses the existing `DELETE /posts/{id}`, then removes the card from in-memory draft state without routing to the feed. Backend/API/database/dependencies are unchanged.
- Fresh evidence: RED `Drafts.test.tsx` + `App.routing.test.tsx` — 4 expected failures / 19 passed. GREEN targeted — 2 files / 23 passed. Full frontend — 16 files / 96 passed; build success (115 modules, standard chunk-size warning). Full backend unchanged — 70 passed in 17.70s. `./init.sh` stopped only on the known external global Hermes/desktop pip check.
- F30 was subsequently deployed frontend-only at `11dff37`; rollback is `/root/backups/mps-frontend-f30-20260824T152645Z`, `deploy/smoke.sh` passed, the served bundle had the delete marker, and backend stayed active. Cover behavior was deliberately left for F31.

## F31 local completion

- Backend: `Post.cover_url` already existed in model and PostWrite/PostPatch. `dto()` now returns it, so it is visible from GET list, published detail and draft detail; the existing generic PATCH persists it. No migration or dependency change.
- Composer: dedicated `Выбрать обложку` picker uses existing multipart `POST /media` with JPEG/PNG/WebP/HEIC/HEIF/AVIF, previews the returned URL and retains it through draft/article edit prefill and POST/PATCH payloads.
- Rendering: Feed and ArticleComments render the explicitly selected URL as an object-fit cover image. When it is absent, the existing dark-gradient `Под солнцем` fallback remains unchanged; inline body media is never inferred as a cover.
- Fresh evidence: RED backend — 1 expected failure / 5 passed; RED frontend — 4 expected failures / 17 passed. GREEN targeted backend — 6 passed; frontend including App PATCH — 4 files / 41 passed. Full backend — 71 passed in 33.49s; full frontend — 16 files / 102 passed; build success (115 modules, standard chunk-size warning). `./init.sh` stopped only on the known external global Hermes/desktop pip check.
- Local F31 completion commit is created; production is intentionally unchanged. F31 needs separate backend+frontend deployment approval and a live authenticated upload/edit/display check.

## F28 production evidence

F28 frontend-only rollout fast-forwarded VPS `6a02ddd → df2cb6b`. Recoverable prior dist: `/root/backups/mps-frontend-f28-20260824T142351Z`. Production frontend rebuilt with production API/bot markers, served new asset `index-DIwKqQUz.js`, and `deploy/smoke.sh` passed; `mps-backend` stayed active and was not restarted.

## F28 local completion

- Diagnosis: `Profile.tsx` modal was the sole physical UI location for «Выйти». `PublicProfile.tsx` already had a functioning ••• actions menu with Copy link/Share, so the owner-only logout item belongs there; no separate menu or layout was needed.
- Fix: `PublicProfile` accepts optional `onLogout`, closes its menu before invoking it, and renders «Выйти» only for the profile owner. `App` supplies the existing `auth.logout()` flow and routes to guest feed only after it resolves. Visitor profiles remain unchanged.
- Fresh evidence: RED `PublicProfile.test.tsx` + `App.routing.test.tsx` — 2 expected failures / 22 passed. GREEN targeted `PublicProfile`, `App.routing`, `useAuth` — 27 passed. Full frontend — 15 files / 91 passed; build success (115 modules, standard chunk-size warning). Full backend unchanged — 70 passed in 18.79s. `./init.sh` stopped only on the known external global Hermes/desktop pip check.
- Production is intentionally unchanged. F28 needs separate frontend deployment approval; then verify the owner logout path in a real Telegram session.

## F26 local completion

- Root cause: Feed's composer modal had an `onClose`, but `ComposerModal` passed only `onCreate` to PostComposer; PostComposer had no callback to close after successful POST/PATCH. Thus draft save and publish both left the modal open.
- Fix: PostComposer invokes optional `onClose` only after successful awaited POST/PATCH, catches server errors into the existing notice, and never closes on error. Feed forwards the callback to reset `composerOpen`; App clears `editingPost` for article/draft edit mode.
- Fresh evidence: RED `PostComposer.test.tsx` — 3 expected failures / 4 passed; GREEN targeted `PostComposer`, `Feed`, `App.routing` — 28 passed. Full frontend — 15 files / 89 passed; build success (production API/bot markers present, localhost API absent). Full backend — 70 passed in 20.79s. `./init.sh` stopped only on the known external global Hermes/desktop pip check.
- The reported draft-list click issue was not reproduced in code or tests: `Drafts` click → GET `/posts/drafts/{id}` → `setEditingPost` → prefilled edit modal is covered. Do not change that flow. Repeat the authenticated live browser check only after an approved F26 deployment.

## F26 production evidence

F26 frontend-only rollout fast-forwarded VPS `e1a35f3 → 2be15d5`. Rollback copy: `/root/backups/mps-frontend-f26-20260824T133425Z`. Production frontend rebuilt with verified VITE markers, served asset returned 200, and `deploy/smoke.sh` passed; `mps-backend` remained active and was not restarted. An isolated browser session was guest-only, so authenticated modal-close and draft-click checks remain unverified in live browser.

## F27 production evidence

F27 frontend-only rollout was pushed as `6a02ddd`, rebuilt and deployed after approval. `deploy/smoke.sh` passed; live login page showed Telegram Login only, with no email field. Backend was not restarted.

## F27 local completion

- Root cause: production email delivery remains externally blocked by the Unisender/HostKey network path, while the UI still presented a working-looking code form.
- Fix: `Profile.tsx` has a documented `EMAIL_LOGIN_ENABLED = false`. It hides email input, code input, CTA and email-copy; Telegram Login remains the sole visible guest authentication path. The email callbacks, `useAuth` methods and backend endpoints are intentionally retained.
- Fresh evidence: RED `Profile` + `App.routing` — 2 expected failures / 19 passed; GREEN targeted `Profile`, `TelegramLogin`, `App.routing` — 23 passed. `test_auth.py` — 6 passed, proving email request/verify remain available. Full frontend — 15 files / 89 passed; build success (production API/bot markers present, localhost API absent). Full backend — 70 passed in 17.36s. `./init.sh` stopped only on the known external Hermes/desktop pip check.
- Pavel should still confirm Telegram login in a real account; Codex has no test Telegram account. Re-enable email only by changing the flag after repair and real delivery verification.

## Production evidence (F25)

Rollback backup: `/root/backups/mps-f25-20260824T131202Z` (previous revision and frontend dist). Production venv installed `pillow-heif==1.5.0`; `mps-backend` restarted active; frontend rebuilt with verified VITE markers; served asset returned 200 and `deploy/smoke.sh` passed. Authorized HTTPS smoke: synthetic HEIC returned 200 and was served as valid WebP; PNG/JPEG returned 200; a renamed text file returned the approved Russian 422; exactly three temporary media files were removed. No authenticated browser click was available, so that UI step remains covered by local frontend regression tests.

## Known unresolved boundary

Email remains blocked by the external Unisender/HostKey network path. Do not change email transport, credentials, firewall or VPS networking without Pavel's separate decision.
