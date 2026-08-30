# Session handoff — МПС

## Next session first — P0 post-media Stage 3 approval gate

1. Read `AGENTS.md`; run `./init.sh`; read `claude-progress.md`, `feature_list.json` and this handoff. The Git Bash Win32 Error 5/global pip-check issues remain known external blockers; rerun MPS checks directly outside sandbox when necessary.
2. `P0-POST-MEDIA` Stages 1–2 are the latest local-only commits. Stage 2 backend is GREEN; feature status remains `in_progress`. Wait for the owner's explicit confirmation before Stage 3.
3. Stage 3 scope is frontend only: consume upload variants, render responsive WebP/AVIF with fallback, add `srcset/sizes/decoding=async`, lazy-load only below-fold inline images, preserve hero priority, and keep inactive carousel sources out of the DOM until interaction. Extend both stored markup and DOMPurify/nh3 boundaries only as required by the approved attributes/elements.
4. After Stage 3 targeted GREEN, run the full frontend suite/build and the agreed browser accessibility/responsive checks, update the three trackers, create one local `[in_progress]` commit and stop. Do not start the existing-post migration, push or deploy without the next confirmation.
5. WIDG-4 remains locally verified `passing`; stages 1–2 are already in `origin/main`, stage 3 precedes the two P0 commits. Its push/deploy remains paused until all five media stages close.

## P0-POST-MEDIA Stage 2 — committed backend GREEN checkpoint

- `backend/app/api/media.py`: EXIF transpose and RGB/RGBA normalization precede resizing. One UUID produces 320/960/1600 WebP+AVIF pairs; no input JPEG/PNG is saved. `url` remains the large WebP fallback and `variants` exposes dimensions and both format URLs.
- Each medium encoding is capped at 350 KiB. Test artifacts measured two WebP medium files at 542684 bytes total and two AVIF medium files at 434952 bytes total, both under 700 KiB.
- Fresh RED: 2 failed / 11 deselected because the old endpoint omitted `variants`. Target GREEN: 2 passed / 11 deselected. Full `test_media.py`: 13 passed.
- Full backend: 130 passed / 10 known PostgreSQL-only skipped without `MPS_TEST_POSTGRES_URL`.
- No dependency, migration, frontend source, DB, existing media, VPS, push or deploy changed. `P0-POST-MEDIA` remains `in_progress` until Stages 3–5 finish.

## P0-POST-MEDIA Stage 1 — committed RED checkpoint

- Baseline outside sandbox: backend `tests/test_media.py` 11 passed; frontend RichTextContent+ArticleComments 2 files / 18 passed.
- Backend RED: 2 failed / 11 deselected. Both failures are exact: POST `/media` returns only `{url}`, so responsive variants/EXIF/format/dimension and the 700 KiB initial mobile budget are absent.
- Frontend RED/regression: `ImageCarousel.test.tsx` has 1 passing inactive-slide guard and 1 expected failure because the active image has no `srcset`; the same contract also requires `sizes` and `decoding=async` once Stage 3 starts.
- Chosen limits: generated widths 320/960/1600; initial cover + active-slide medium WebP budget 700 KiB. This accepts the existing input limit and auto-normalizes instead of disrupting the author UX with a resolution/encoded-size rejection.
- No application code, dependency, DB, VPS or production media was changed. `feature_list.json` keeps `P0-POST-MEDIA` `in_progress`; no passing/complete claim is valid yet.

## Current verified checkpoint — 2026-08-30

- Session closeout production SHA is `7ba81997f6dd165350395967f89789283c245918`. REV-2, P0-LIGHT-THEME, BUG-1/FEED-A–G and the About-navigation order are production-deployed `passing`; local `main`, `origin/main` and VPS matched this SHA before the documentation-only closeout commit.
- P0-LIGHT-THEME is production-deployed `passing`. New users default to light before React mounts; saved `dark` and `light` remain authoritative and update the matching `theme-color`. The `--card-soft` inset-surface follow-up is included in production commit `ac0235a`.
- Exact approved light/dark tokens are defined in `frontend/app/src/styles.css`; semantic aliases remain compatible. Inter replaces all four Manrope rules, and Playfair Display loads 600/700/900.
- Production commit `613faab` adds 2px outlined header actions, an account initial/chevron, and a separate sidebar `Создать` shortcut wired to the existing publication composer. The central create action remains in place.
- Production commit `85cb16a` adds `SubscriptionsPanel` backed by the existing `/users/{currentUser.id}/following` hook. The widened right rail renders the first eight real subscriptions in four columns and keeps presence as a separate block; it remains hidden at ≤900px.
- Production commit `c4f10e4` adds a shared `PageCard` around route content only. Sidebar chrome is transparent with no shadow, the active item uses `--gold-soft`, and notifications/QA/Profile overlays remain outside the center card. Existing page-root outer padding is neutralized once at the wrapper boundary; right-rail selectors were not changed.
- `design/DESIGN_SYSTEM.md` is the normative reference for flat sidebar / center PageCard / separate right-section cards and records all 25 core light/dark tokens plus 13 semantic aliases.
- Empty states and inset informational/CTA blocks inside PageCard use `--card-soft` (`#f6f3ec` light, `#1c2540` dark). Buttons, cookie-banner, notification popover and right rail retain their existing surface tokens.
- Contrast decision A is applied: small readable text uses `--text`/`--card-text`, no small text color uses `--muted`, and `--gold-ink` appears only on the 40px hero heading. Header, sidebar, central cards/forms/modals and the current presence column were themed in that order.
- Structure/subscriptions verification: `SubscriptionsPanel` RED failed on the absent component import; component GREEN passed 2/2 and targeted component/Layout/App integration passed 52/52. Full frontend passed 25 files/164 tests; build passed with 119 modules plus only the chunk-size warning.
- Browser verification: bundled Playwright/Chrome produced 8 light/dark screenshots at 375/768/1024/1440 with 0 failures. Reload persistence, Inter/Playfair loading, focus-visible, reduced-motion, zero horizontal overflow and zero theme-toggle reflow passed. The rail is hidden at 375/768; at 1024/1440 it is 252/280px wide with 8 following records, 4 CSS columns and presence.
- PageCard RED failed 1/1 because the main route content had no `.page-card` parent; targeted GREEN passed 1/1 and the full routing file passed 45/45. Fresh full frontend verification passed 25 files/165 tests; build passed with 120 modules and only the existing chunk-size warning. The new browser gate passed 8/8 after reload with exact computed card/sidebar styles; center width is 580px at 768 and 552px at 1024.
- Soft-surface RED failed 1/1 because `.empty-comments` computed transparent instead of `var(--card-soft)`; targeted GREEN passed 1/1 and full Feed passed 7/7. Fresh full frontend passed 25 files/166 tests; build passed with 120 modules and only the existing chunk-size warning. Bundled Chromium passed 8/8 light/dark checks at 375/768/1024/1440: exact active `--card-soft`, zero horizontal overflow/reflow, 2px focus and 0.01ms reduced motion. All eight screenshots were visually checked against the read-only reference.
- Production commit `367dd3e` closes BUG-1 and FEED-A–E. Root comments can open a separate one-level reply composer and send `parent_id`; feed bodies use a deterministic 3-block/420-character text preview. Carousel arrows are 44px, theme-aware and focusable; scoped media frames cover cover/hero/inline images and one carousel container without a double frame. Share copies the absolute `/posts/{slug}` URL with Clipboard API plus a legacy fallback and reports through the existing toast.
- FastAPI now injects post-specific canonical, description, Open Graph, Twitter and JSON-LD metadata into the real React SPA head for every existing published `/posts/{slug}`, not only crawler UAs. Descriptions are plain escaped text, cover images are absolute, `og:type=article` and `twitter:card=summary_large_image` are present; unknown-slug behavior remains unchanged.
- Feed package RED→GREEN: replies failed on absent `.comment-replies`; preview failed because paragraph four remained; media/share failed on 34px arrows, no frame and no share action; browser-UA SEO failed because `og:title` was absent. All narrow contracts then passed; combined frontend targets passed 26 tests and backend SEO passed 3/3.
- Feed package final verification: backend 125 passed / 7 existing PostgreSQL-only skipped; frontend 25 files / 172 passed; build 120 modules with only the existing chunk-size warning. Browser light/dark at 375/768/1024/1440 passed 8/8 for preview/media/replies/focus/reduced-motion/overflow; Clipboard held the exact absolute post URL. Real `curl.exe` requests with Mozilla, TelegramBot, WhatsApp and VKShare UAs each returned 200, React root and complete post meta.
- Production rollout for `ac0235a`/`367dd3e`: DB backup `/var/backups/mps/mps-2026-08-29-123936.dump.gz` SHA-256 `3189103688145280aab11dd420fb2a2424c43fac9e54942fcb953232cea96812`; frontend rollback `/root/backups/mps-frontend-feed-predeploy-20260829T164035Z-c4f10e4.tar.gz` SHA-256 `358ab9a9a15f0ddf101800ff419205ec3c73adb121d186328fcbed1cc2467739`. Backend restarted active/healthy, smoke passed, production served `/assets/index-Tqj8Nx_B.js`, and all four live OG User-Agents returned identical complete meta.
- Production commits `3c95711` and `4ee6a75` add the second «Назад к ленте» action and conditionally collapse only carousel segments in article previews with a separate cover; inline images stay visible, no-cover carousels stay visible, and full `/posts/{slug}` rendering stays expanded.
- FEED-G RED produced 2 expected failures / 29 passed while no-cover/full-page preservation already passed; targeted GREEN passed 3 files / 31 tests. Fresh full frontend passed 25 files / 177 tests; build passed with 120 modules plus only the existing chunk-size warning. Browser light/dark at 375/768/1024/1440 passed 8/8 with conditional expand/collapse, exact active theme, visible focus, reduced-motion, zero horizontal overflow and visually reviewed 375/1440 screenshots.
- Production commit `7ba8199` moves «О нас» immediately after «Лента», before «Форум стран», through the shared `Layout` navigation array. Desktop sidebar and mobile sheet use the same order; footer and `/about` content are unchanged.
- Navigation RED received the old order with «О нас» after «Подписка»; targeted GREEN passed 1/1 and the whole Layout file passed 7/7. Fresh full frontend passed 25 files / 178 tests; build passed with 120 modules plus only the existing chunk-size warning. Chrome light/dark at 375/768/1024/1440 passed 8/8 for exact order, `/about`, unchanged footer, focus, reduced motion and zero horizontal overflow.
- The external design reference `D:/Профессиональный редизайн сайта/Мир под солнцем.dc.html` remained read-only and was not copied or tracked.
- `WIDG-4` is locally verified `passing`. Accepted stages 1–2 remain `b8b6568` recommendations and `0d98e14` discovery search/PostgreSQL indexes; fully verified stage 3 is the latest local-only commit. No static recommendation data was introduced, and production has none of WIDG-4 until a separately approved deploy.
- Fresh stage-3 evidence: exact-topic RED expected `/countries/1/topics/9` but received `/countries/1`; minimal route/state GREEN passed 1/1. Targeted frontend passed 5 files/62 tests and backend exclude_ids target passed 1/1. Full backend passed 128 with 10 explained `MPS_TEST_POSTGRES_URL` skips; full frontend passed 28 files/188 tests; build passed with 122 modules and existing warnings only. Browser light/dark at 375/768/1024/1440 passed 8/8 for rail order, debounce/abort/states, exact topic, TTL/exclusions, follow synchronization, 44px controls, focus/ARIA, reduced-motion, contrast 4.88:1 light / 7.53:1 dark and zero horizontal overflow.
- REV-2 is production-deployed `passing` at package SHA `58a49f5038141b967324e581f0856757cba08dd8`, included in final application SHA `7ba81997f6dd165350395967f89789283c245918`, with Alembic `20260829_0018 (head)`.
- Reviews support up to two ordered photos, a 1000-character body limit and authenticated `/reviews/mine` statuses. Public `/reviews` remains approved-only; editor moderation remains role-gated.
- The live stale-state follow-up is included in the same production SHA: `useReviews.moderate` replaces the matching mine entry with the review returned by PATCH, so reject immediately renders «Не опубликован» while preserving queue removal.
- Local verification for the follow-up: backend protective PATCH + `/mine` contract 1/1; frontend RED received `pending` instead of expected `rejected`; hook+UI GREEN 2 files/9 tests; full backend `125 passed, 7 skipped`; full frontend 24 files/156 tests; build 118 modules.
- Production evidence: rollback `/root/backups/mps-frontend-rev2-mine-fix-58a49f5.tar.gz`, SHA-256 `339b994a0990db83ada5969a01536603b200ebf670e3cfed1fd6b61564d4e75f`; served bundle `index-DOiIEML6.js` contains production API/bot values and no localhost API; `mps-backend` stayed PID `891354`, active/healthy without restart; `deploy/smoke.sh` passed.
- Fresh closeout check again observed VPS SHA `58a49f5038141b967324e581f0856757cba08dd8`, backend `active` with health `ok`, production bundle guards and smoke `[OK]`.

## WIDG-4 stage 3 — completed local checkpoint

### Completed package

- `backend/app/api/discovery.py`: `/discovery/recommended-authors` accepts repeated `exclude_ids`, caps them at 50 through FastAPI validation and adds `User.id.not_in(exclude_ids)` to the existing eligible-author conditions.
- `backend/tests/test_discovery.py`: adds the contract that excluded eligible authors are absent and 51 IDs return 422.
- `frontend/app/src/App.tsx`: creates discovery search/recommendation state, loads per-user hidden IDs, wires both panels, opens exact forum-topic routes, and after following waits for parallel recommendation and subscription reloads.
- `frontend/app/src/App.routing.test.tsx`: extends API fixtures for discovery/following and covers recommendation-follow synchronization plus exact-topic navigation.
- `frontend/app/src/components/Layout.tsx`: adds the optional search/recommendation panel props and renders `JournalSearchPanel → RecommendedPanel → SubscriptionsPanel → presence`.
- `frontend/app/src/components/Layout.test.tsx`: covers the exact right-rail order and authenticated recommendation rendering.
- `frontend/app/src/hooks/index.ts`: adds discovery response types, 300ms debounced search with `AbortController`/stale-response guard/retry, recommendation loading with at most 50 exclude IDs, and 30-day per-user localStorage hidden-ID state.
- `frontend/app/src/hooks/useDiscovery.test.tsx` (new): covers debounce, request cancellation/stale result suppression, TTL pruning and the 50-ID cap.
- `frontend/app/src/components/JournalSearchPanel.tsx` and `.test.tsx` (new): separate journal search with idle/loading/empty/error states and grouped article/author/forum-topic results.
- `frontend/app/src/components/RecommendedPanel.tsx` and `.test.tsx` (new): real author cards with avatar/initials, bio, profile navigation, follow action, accessible dismiss and loading/empty/error states.
- `frontend/app/src/router.ts`: parses and builds the optional `/countries/{countryId}/topics/{topicId}` path without changing country-only routes.
- `frontend/app/src/components/Forum.tsx`: initializes the selected topic from the routed topic ID once the country's topic list loads.
- `frontend/app/src/styles.css`: only additive WIDG-4 styles using the existing theme tokens; includes 44px interactive targets and overflow-safe text/layout.

### Fresh completion evidence

- Existing component/hooks/backend RED→GREEN history was preserved. The final exact-topic RED expected `/countries/1/topics/9` but received `/countries/1`; the minimal pathname route plus `Forum.initialTopicId` fix passed 1/1.
- Targeted frontend verification passed 5 files / 62 tests, including panel states, hooks, rail order, exact-topic routing and follow-refresh integration. Backend exclude-ID target passed 1/1 outside the Windows sandbox restriction.
- Full backend passed 128 tests. Ten tests were explicitly skipped only because `MPS_TEST_POSTGRES_URL` is absent: 3 discovery, 3 forum and 4 Irishka. The three discovery PostgreSQL contracts added in accepted stage 2 were already verified on active PostgreSQL before acceptance.
- Full frontend passed 28 files / 188 tests; `npm run build` passed with 122 modules and only existing Vite CJS/chunk-size warnings.
- Isolated intercepted-API Playwright/Edge browser verification passed light/dark 8/8 at 375/768/1024/1440. Rail visibility/order, 313ms debounce, abort/stale-response suppression, loading/empty/error/retry, exact `/countries/704/topics/703` navigation, TTL pruning/exclude IDs and follow→SubscriptionsPanel synchronization passed. Interactive targets were at least 44px, focus outline was 2px, reduced-motion applied, horizontal overflow was zero, and contrast measured 4.88:1 light / 7.53:1 dark. All eight screenshots were visually reviewed without clipping or overlap.
- Final gates: complete implementation diff reviewed; `git diff --check` passed with only Windows line-ending notices; `feature_list.json` parses and records WIDG-4 `passing`.

### Publication boundary

1. `origin/main` already contains stage 1 `b8b6568`, stage 2 `0d98e14` and interrupted checkpoint `cb1124f`; the stage-3 completion commit is local-only.
2. No push, VPS mutation or deployment was performed in this session. Production remains at the earlier application checkpoint and contains none of WIDG-4.
3. Wait for the owner's explicit approval. Then run fresh HEAD/origin/VPS/clean/health and BatchMode SSH preflight before pushing or deploying.
4. The approved rollout must include DB and frontend rollback artifacts, migration/head verification, production Vite/no-localhost/served-bundle guards, backend health/smoke and the production browser matrix; verify the About-navigation checkpoint in the same cycle.

## Known risks / boundaries

- Existing POST `/media` deliberately has no review-specific provisional ownership or orphan cleanup. A cancelled/failed review submission can leave an uploaded media file; no cleanup expansion was approved for REV-2.
- The theme fonts are loaded from Google Fonts with `display=swap`; live browser verification loaded all required weights, but offline clients still fall back to the declared system/Georgia stacks.
- Global `init.sh` pip-check can stop on unrelated shared Hermes/desktop dependency conflicts; record this separately and verify MPS suites directly.
- SSH incident: `mps_deploy_key` disappeared from VPS `authorized_keys`; the root cause remains unknown. Access was restored with replacement key `s048_rotate`, whose local Windows ACL had to be restricted before OpenSSH accepted it. Every deployment must begin with a BatchMode key check; if it repeats, use read-only diagnosis and HostKey console/authorized_keys recovery rather than password guessing. Never record or print credentials in trackers or logs.
- F47 and F48c are both currently marked `in_progress` despite the tracker rule that only one feature may be in progress. Do not change their statuses during startup without an owner-confirmed P0 ordering decision.
