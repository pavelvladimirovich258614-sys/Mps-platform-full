# Session handoff — МПС

## Current verified checkpoint — 2026-08-29

- Base REV-2 is production-deployed at `bfab6fe2845d0e780568cf8566be662c993f4d03` with Alembic `20260829_0018 (head)`, active/healthy `mps-backend`, verified production VITE values without localhost API, and passing `deploy/smoke.sh`. Rollback artifacts are `/var/backups/mps/mps-2026-08-28-123403.dump.gz` (SHA-256 `f25f5192af8ab4477570d714ab58f4dd631a5e0c3026eb6cac82d3496d22907c`) and `/root/backups/mps-frontend-rev2-bfab6fe.tar.gz` (SHA-256 `f966380e91f275550284218962fb6609e023d6bc7ed865923b59c9bc12ecefac`).
- REV-2 adds migration `20260829_0018_review_photos`: `review_photos(review_id, url, position)` permits exactly positions 0–1, backfills each legacy `reviews.photo_url` as position 0 and leaves the legacy column/API `photo_url` compatible as the first photo. `photo_urls` is now the ordered DTO collection.
- `POST /reviews` validates body ≤1000 characters and no more than two `photo_urls`; the authenticated `GET /reviews/mine` returns only the caller's pending/approved/rejected reviews. Existing public `GET /reviews` remains approved-only; editor moderation remains unchanged. Token-based reviews have no direct upload UI.
- Live follow-up diagnosis found production review `id=1` stored as `REJECTED`; PATCH moderation and fresh `/reviews/mine` already serialize `rejected`, and `Reviews.tsx` already renders «Не опубликован». The stale label was a frontend cache bug: `useReviews.moderate` removed the item from `pendingResource` but ignored the returned review and left `mineResource` at `pending`.
- The local follow-up uses the PATCH response to replace only the matching mine entry while preserving the existing queue removal. Backend code, DB, API, migration and `Reviews.tsx` are unchanged. Changed scope is `backend/tests/test_reviews.py`, new `frontend/app/src/hooks/useReviews.test.tsx`, `frontend/app/src/hooks/index.ts` and the three approved trackers.
- Follow-up RED→GREEN evidence: backend protective PATCH + `/mine` contract passed 1/1; frontend hook RED failed with received `pending` instead of expected `rejected`; hook+UI GREEN passed 2 files/9 tests. Whole backend review target passed 8/8; full backend passed `125 passed, 7 skipped`; full frontend passed 24 files/156 tests; build transformed 118 modules with only the existing chunk-size warning.
- The follow-up is locally `passing` and is being committed without push/deploy. The base production build still needs the follow-up frontend bundle before the live stale-state defect is closed there.

## Production rollout gate (requires explicit approval)

1. Push the local follow-up commit after explicit approval.
2. Create a fresh frontend rollback backup and record its path/SHA-256.
3. Fast-forward the VPS checkout, rebuild/redeploy frontend, verify production VITE settings and absence of localhost API.
4. Confirm `mps-backend` remains active/healthy without restart; no migration or backend deploy is required.
5. Run `deploy/smoke.sh`.

## Known risks / next work

- Existing POST `/media` deliberately has no review-specific provisional ownership or orphan cleanup. A cancelled/failed review submission can leave an uploaded media file; no cleanup expansion was approved for REV-2.
- Until the local follow-up is separately pushed and frontend-deployed, production can still show a stale pending label immediately after an editor moderates their own review; a reload fetches the correct rejected status.
- F47 remains optional after no N+1 was confirmed. F48c and web design remain separate backlog scopes.
