# Session handoff — МПС

## Current verified checkpoint — 2026-08-29

- P0-LIGHT-THEME is locally `passing` and intentionally not pushed/deployed. New users default to light before React mounts; saved `dark` and `light` remain authoritative and update the matching `theme-color`.
- Exact approved light/dark tokens are defined in `frontend/app/src/styles.css`; semantic aliases remain compatible. Inter replaces all four Manrope rules, and Playfair Display loads 600/700/900.
- Local commit `613faab` adds 2px outlined header actions, an account initial/chevron, and a separate sidebar `Создать` shortcut wired to the existing publication composer. The central create action remains in place.
- Local commit `85cb16a` adds `SubscriptionsPanel` backed by the existing `/users/{currentUser.id}/following` hook. The widened right rail renders the first eight real subscriptions in four columns and keeps presence as a separate block; it remains hidden at ≤900px.
- Contrast decision A is applied: small readable text uses `--text`/`--card-text`, no small text color uses `--muted`, and `--gold-ink` appears only on the 40px hero heading. Header, sidebar, central cards/forms/modals and the current presence column were themed in that order.
- Structure/subscriptions verification: `SubscriptionsPanel` RED failed on the absent component import; component GREEN passed 2/2 and targeted component/Layout/App integration passed 52/52. Full frontend passed 25 files/164 tests; build passed with 119 modules plus only the chunk-size warning.
- Browser verification: bundled Playwright/Chrome produced 8 light/dark screenshots at 375/768/1024/1440 with 0 failures. Reload persistence, Inter/Playfair loading, focus-visible, reduced-motion, zero horizontal overflow and zero theme-toggle reflow passed. The rail is hidden at 375/768; at 1024/1440 it is 252/280px wide with 8 following records, 4 CSS columns and presence.
- The external design reference `D:/Профессиональный редизайн сайта/Мир под солнцем.dc.html` remained read-only and was not copied or tracked.
- `WIDG-4` is planned, not implemented: journal/user search, recommendations, recommendation descriptions/algorithm and hidden-card state require a separate backend+frontend contract. No static recommendation data was introduced.
- REV-2 is production-deployed `passing` at application SHA `58a49f5038141b967324e581f0856757cba08dd8` with Alembic `20260829_0018 (head)`.
- Reviews support up to two ordered photos, a 1000-character body limit and authenticated `/reviews/mine` statuses. Public `/reviews` remains approved-only; editor moderation remains role-gated.
- The live stale-state follow-up is included in the same production SHA: `useReviews.moderate` replaces the matching mine entry with the review returned by PATCH, so reject immediately renders «Не опубликован» while preserving queue removal.
- Local verification for the follow-up: backend protective PATCH + `/mine` contract 1/1; frontend RED received `pending` instead of expected `rejected`; hook+UI GREEN 2 files/9 tests; full backend `125 passed, 7 skipped`; full frontend 24 files/156 tests; build 118 modules.
- Production evidence: rollback `/root/backups/mps-frontend-rev2-mine-fix-58a49f5.tar.gz`, SHA-256 `339b994a0990db83ada5969a01536603b200ebf670e3cfed1fd6b61564d4e75f`; served bundle `index-DOiIEML6.js` contains production API/bot values and no localhost API; `mps-backend` stayed PID `891354`, active/healthy without restart; `deploy/smoke.sh` passed.
- Fresh closeout check again observed VPS SHA `58a49f5038141b967324e581f0856757cba08dd8`, backend `active` with health `ok`, production bundle guards and smoke `[OK]`.

## Next session — P0 structure/subscriptions push/deploy gate

1. Read `AGENTS.md`; run `./init.sh`; read `claude-progress.md`, `feature_list.json` and this handoff; fetch and confirm local/origin/VPS synchronization before changes.
2. Treat local commits `613faab` and `85cb16a` plus the tracker checkpoint as the completed implementation boundary. Do not amend their scope, push or deploy without a separate explicit owner instruction.
3. Before any approved push/deployment, rerun the required fresh frontend suite/build and confirm the exact local/origin/VPS divergence. Keep production rollback, served-bundle VITE/no-localhost checks and live smoke as a separately approved rollout sequence.
4. Keep `WIDG-4`, F47 (optional N+1 guard) and F48c (subscription while delivery is externally blocked) separate from this checkpoint.

## Known risks / boundaries

- Existing POST `/media` deliberately has no review-specific provisional ownership or orphan cleanup. A cancelled/failed review submission can leave an uploaded media file; no cleanup expansion was approved for REV-2.
- The theme fonts are loaded from Google Fonts with `display=swap`; live browser verification loaded all required weights, but offline clients still fall back to the declared system/Georgia stacks.
- Global `init.sh` pip-check can stop on unrelated shared Hermes/desktop dependency conflicts; record this separately and verify MPS suites directly.
- F47 and F48c are both currently marked `in_progress` despite the tracker rule that only one feature may be in progress. Do not change their statuses during startup without an owner-confirmed P0 ordering decision.
