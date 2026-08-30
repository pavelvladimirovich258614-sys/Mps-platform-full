# Session handoff — МПС

## Next session first — P0 checklist gate

1. Read `AGENTS.md`; run `./init.sh`; read `claude-progress.md`, `feature_list.json` and this handoff; fetch and confirm local/origin/VPS SHA, clean tracked trees and backend health before any change.
2. WIDG-4 stages 1–2 are accepted commits `b8b6568` and `0d98e14`; stage 3 remains an uncommitted 13-file working-tree package and WIDG-4 is `in_progress`. Resume from the detailed handoff below; do not restart diagnosis or discard the working tree.
3. Keep F47 and F48c separate from WIDG-4 completion. Preserve Plan → Approve → Code, RED→GREEN and a separate production approval for every new package.
4. Preflight SSH in BatchMode with the currently authorized replacement key before a future deploy. If access fails again, stop and diagnose key authorization/provider-console recovery; do not guess credentials.

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
- `WIDG-4` is `in_progress`. Accepted commits: `b8b6568` recommendations and `0d98e14` search/PostgreSQL indexes. Stage 3 is implemented but uncommitted; no static recommendation data was introduced, and production has none of WIDG-4 until a separately approved deploy.
- Historical stage-3 frontend evidence before interruption: missing components/hooks produced the expected RED; targeted GREEN passed 4 files/15 tests and follow-refresh integration passed 1/1. Full frontend passed 28 files/187 tests; build passed with 122 modules and existing warnings only. Browser light/dark at 375/768/1024/1440 passed 8/8 for rail order, 44px controls, focus/ARIA, reduced-motion, contrast 4.88:1 light / 7.53:1 dark and zero horizontal overflow. This evidence was not rerun during the documentation closeout and must not be treated as the final post-fix gate.
- REV-2 is production-deployed `passing` at package SHA `58a49f5038141b967324e581f0856757cba08dd8`, included in final application SHA `7ba81997f6dd165350395967f89789283c245918`, with Alembic `20260829_0018 (head)`.
- Reviews support up to two ordered photos, a 1000-character body limit and authenticated `/reviews/mine` statuses. Public `/reviews` remains approved-only; editor moderation remains role-gated.
- The live stale-state follow-up is included in the same production SHA: `useReviews.moderate` replaces the matching mine entry with the review returned by PATCH, so reject immediately renders «Не опубликован» while preserving queue removal.
- Local verification for the follow-up: backend protective PATCH + `/mine` contract 1/1; frontend RED received `pending` instead of expected `rejected`; hook+UI GREEN 2 files/9 tests; full backend `125 passed, 7 skipped`; full frontend 24 files/156 tests; build 118 modules.
- Production evidence: rollback `/root/backups/mps-frontend-rev2-mine-fix-58a49f5.tar.gz`, SHA-256 `339b994a0990db83ada5969a01536603b200ebf670e3cfed1fd6b61564d4e75f`; served bundle `index-DOiIEML6.js` contains production API/bot values and no localhost API; `mps-backend` stayed PID `891354`, active/healthy without restart; `deploy/smoke.sh` passed.
- Fresh closeout check again observed VPS SHA `58a49f5038141b967324e581f0856757cba08dd8`, backend `active` with health `ok`, production bundle guards and smoke `[OK]`.

## WIDG-4 stage 3 — exact uncommitted working-tree handoff

### Files already changed

- `backend/app/api/discovery.py`: `/discovery/recommended-authors` accepts repeated `exclude_ids`, caps them at 50 through FastAPI validation and adds `User.id.not_in(exclude_ids)` to the existing eligible-author conditions.
- `backend/tests/test_discovery.py`: adds the contract that excluded eligible authors are absent and 51 IDs return 422.
- `frontend/app/src/App.tsx`: creates discovery search/recommendation state, loads per-user hidden IDs, wires both panels, and after following waits for parallel recommendation and subscription reloads.
- `frontend/app/src/App.routing.test.tsx`: extends API fixtures for discovery/following and adds the recommendation-follow synchronization integration test.
- `frontend/app/src/components/Layout.tsx`: adds the optional search/recommendation panel props and renders `JournalSearchPanel → RecommendedPanel → SubscriptionsPanel → presence`.
- `frontend/app/src/components/Layout.test.tsx`: covers the exact right-rail order and authenticated recommendation rendering.
- `frontend/app/src/hooks/index.ts`: adds discovery response types, 300ms debounced search with `AbortController`/stale-response guard/retry, recommendation loading with at most 50 exclude IDs, and 30-day per-user localStorage hidden-ID state.
- `frontend/app/src/hooks/useDiscovery.test.tsx` (new): covers debounce, request cancellation/stale result suppression, TTL pruning and the 50-ID cap.
- `frontend/app/src/components/JournalSearchPanel.tsx` and `.test.tsx` (new): separate journal search with idle/loading/empty/error states and grouped article/author/forum-topic results.
- `frontend/app/src/components/RecommendedPanel.tsx` and `.test.tsx` (new): real author cards with avatar/initials, bio, profile navigation, follow action, accessible dismiss and loading/empty/error states.
- `frontend/app/src/styles.css`: only additive WIDG-4 styles using the existing theme tokens; includes 44px interactive targets and overflow-safe text/layout.

### What is already observed, but not sufficient for final `passing`

- Frontend RED failed because the new components/hooks did not exist; targeted GREEN later passed 4 files / 15 tests.
- App follow-refresh integration passed 1/1 after waiting for the recommendation to load.
- Full frontend passed 28 files / 187 tests; `npm run build` passed with 122 modules and only existing CJS/chunk-size warnings.
- Browser light/dark passed 8/8 at 375/768/1024/1440: desktop order, 44px controls, focus, dismiss aria-label, reduced-motion, no console errors and zero horizontal overflow. Secondary-copy contrast measured 4.88:1 light / 7.53:1 dark.
- Backend exclude-ID test had a real RED (excluded authors were returned) and a targeted GREEN 1/1. Two later control invocations never reached the tests because pytest cleanup hit Win32 Error 5 on `basetemp`; the protected temporary directories were removed.

### Remaining before the stage-3 code commit

1. Add a RED integration/component contract for selecting an exact forum topic from `JournalSearchPanel`. Current `App.tsx` ignores `topicId` in `onOpenForumTopic` and navigates only to `/countries/{countryId}`; the current pathname route has no topic ID, while `Forum` keeps the selected topic only in local state. Decide and implement the smallest route/state contract that opens the requested topic rather than merely its country.
2. Rerun the changed backend exclude-ID target outside the Windows sandbox restriction and run the relevant backend regression suite. Do not count a Win32 Error 5 setup/cleanup failure as a test result.
3. After the topic-navigation fix, rerun targeted component/hooks/App tests, the full frontend suite and `npm run build`.
4. Repeat the light/dark browser matrix at 375/768/1024/1440, including exact topic opening, debounce/abort, loading/empty/error, keyboard focus, aria-label, 44px targets, contrast, reduced-motion and zero horizontal overflow.
5. Review the complete 13-file implementation diff, run `git diff --check`, verify JSON/trackers as applicable, and stage only the intended stage-3 files. Then create a separate code commit; update WIDG-4 to `passing` only after fresh observed output from every required gate.
6. Push/deploy only under new explicit approvals. Production rollout must remain a separate DB/frontend backup + migration + health/smoke/browser cycle.

## Known risks / boundaries

- Existing POST `/media` deliberately has no review-specific provisional ownership or orphan cleanup. A cancelled/failed review submission can leave an uploaded media file; no cleanup expansion was approved for REV-2.
- The theme fonts are loaded from Google Fonts with `display=swap`; live browser verification loaded all required weights, but offline clients still fall back to the declared system/Georgia stacks.
- Global `init.sh` pip-check can stop on unrelated shared Hermes/desktop dependency conflicts; record this separately and verify MPS suites directly.
- SSH incident: `mps_deploy_key` disappeared from VPS `authorized_keys`; the root cause remains unknown. Access was restored with replacement key `s048_rotate`, whose local Windows ACL had to be restricted before OpenSSH accepted it. Every deployment must begin with a BatchMode key check; if it repeats, use read-only diagnosis and HostKey console/authorized_keys recovery rather than password guessing. Never record or print credentials in trackers or logs.
- F47 and F48c are both currently marked `in_progress` despite the tracker rule that only one feature may be in progress. Do not change their statuses during startup without an owner-confirmed P0 ordering decision.
