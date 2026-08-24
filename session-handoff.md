# Session handoff — МПС

## Verified local state — 2026-08-24

F01–F28 are recorded as passing. F27 is deployed at `6a02ddd` and live login UI shows only Telegram Login; F26 is deployed at `2be15d5`. F28 is local-only and awaits separate frontend rollout approval.

- The reported upload failure was not a PNG/JPEG regression. Current composer chain remains `onChange → apiForm(POST /media) → insertImageAtDocumentStart`; existing PNG baseline passed.
- The actual cause for iPhone photos was HEIC/HEIF being excluded by both the native file picker `accept` list and the backend MIME allowlist. The UI now accepts JPEG, PNG, WebP, HEIC, HEIF and AVIF.
- Backend now depends on `pillow-heif==1.5.0`. It registers the HEIF decoder and converts HEIC/HEIF to WebP before storage; AVIF is accepted and preserved as AVIF. An unsupported file receives `422 «Допустимы JPEG, PNG, WebP, HEIC, HEIF или AVIF»`.
- Fresh verification: F25 RED frontend 1 failed / 18 passed; RED backend after dependency 4 failed / 7 passed. GREEN media 11 passed and RichTextEditor 19 passed. Full backend 70 passed; full frontend 15 files / 85 passed; `npm run build` passed (115 modules, standard chunk-size warning).
- `./init.sh` installed MPS requirements, then stopped only at the external global Hermes/desktop `pip check`; that environment is not part of MPS and was not modified.

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
