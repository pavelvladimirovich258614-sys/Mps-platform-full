# Session handoff — МПС

## Current verified checkpoint — 2026-08-29

- REV-2 is production-deployed `passing` at application SHA `58a49f5038141b967324e581f0856757cba08dd8` with Alembic `20260829_0018 (head)`.
- Reviews support up to two ordered photos, a 1000-character body limit and authenticated `/reviews/mine` statuses. Public `/reviews` remains approved-only; editor moderation remains role-gated.
- The live stale-state follow-up is included in the same production SHA: `useReviews.moderate` replaces the matching mine entry with the review returned by PATCH, so reject immediately renders «Не опубликован» while preserving queue removal.
- Local verification for the follow-up: backend protective PATCH + `/mine` contract 1/1; frontend RED received `pending` instead of expected `rejected`; hook+UI GREEN 2 files/9 tests; full backend `125 passed, 7 skipped`; full frontend 24 files/156 tests; build 118 modules.
- Production evidence: rollback `/root/backups/mps-frontend-rev2-mine-fix-58a49f5.tar.gz`, SHA-256 `339b994a0990db83ada5969a01536603b200ebf670e3cfed1fd6b61564d4e75f`; served bundle `index-DOiIEML6.js` contains production API/bot values and no localhost API; `mps-backend` stayed PID `891354`, active/healthy without restart; `deploy/smoke.sh` passed.
- Fresh closeout check again observed VPS SHA `58a49f5038141b967324e581f0856757cba08dd8`, backend `active` with health `ok`, production bundle guards and smoke `[OK]`.

## Next session — P0 checklist is the mandatory first step

1. Read `AGENTS.md`; run `./init.sh`; read `claude-progress.md`, `feature_list.json` and this handoff; fetch and confirm local/origin/VPS synchronization before changes.
2. Obtain and confirm Pavel's exact P0 checklist before choosing a feature or writing code. The closeout request said «P0-чек-лист (см. ниже)», but no checklist items were present in the message or repository; do not invent them.
3. After the owner supplies the list, diagnose its items read-only and send the required file/risk/verification plan before code.
4. Keep F47 (optional N+1 guard), F48c (subscription while delivery is externally blocked) and web design as separate existing backlog; they are not substitutes for the missing P0 list.

## Known risks / boundaries

- Existing POST `/media` deliberately has no review-specific provisional ownership or orphan cleanup. A cancelled/failed review submission can leave an uploaded media file; no cleanup expansion was approved for REV-2.
- Global `init.sh` pip-check can stop on unrelated shared Hermes/desktop dependency conflicts; record this separately and verify MPS suites directly.
- F47 and F48c are both currently marked `in_progress` despite the tracker rule that only one feature may be in progress. Do not change their statuses during startup without an owner-confirmed P0 ordering decision.
