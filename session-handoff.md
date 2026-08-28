# Session handoff — МПС

## Current verified checkpoint — 2026-08-29

- REV-2 is locally complete and `passing`; commit is local-only and push/deploy are not authorised. Production remains on F48b application SHA `a19b1769f387dd2281763e1e47668d4714e99091` and Alembic `20260828_0017`.
- REV-2 adds migration `20260829_0018_review_photos`: `review_photos(review_id, url, position)` permits exactly positions 0–1, backfills each legacy `reviews.photo_url` as position 0 and leaves the legacy column/API `photo_url` compatible as the first photo. `photo_urls` is now the ordered DTO collection.
- `POST /reviews` validates body ≤1000 characters and no more than two `photo_urls`; the authenticated `GET /reviews/mine` returns only the caller's pending/approved/rejected reviews. Existing public `GET /reviews` remains approved-only; editor moderation remains unchanged. Token-based reviews have no direct upload UI.
- Reviews UI reuses authenticated POST `/media` sequentially for at most two accepted image files, supports preview/removal, blocks submit while upload is active, sends `photo_urls`, renders review photos, and keeps «Мои отзывы» with persistent status after reload. Guest users do not request `/reviews/mine`.
- RED→GREEN evidence: backend RED 4 expected failures (missing photo_urls, third photo accepted, 1001 chars accepted, `/reviews/mine` 404) → 4/4 GREEN; all `tests/test_reviews.py` 8/8. Alembic isolated SQLite upgrade reached `20260829_0018 (head)`. Frontend RED 3 expected failures → `Reviews.test.tsx` 8/8 GREEN. Full backend: `125 passed, 7 skipped` (PostgreSQL-only tests); full frontend: 23 files/155 tests; build: 118 modules with only existing chunk-size warning.
- Final `./init.sh` reran successfully through install but stopped at global `pip check` on shared Hermes/desktop dependency conflicts (including `numba` missing `llvmlite`). Earlier in-session Git Bash also hit Win32 Error 5 before execution. Neither issue is MPS code and no shared environment was changed.

## Production rollout gate (requires explicit approval)

1. Push the local REV-2 commit.
2. Create PostgreSQL and frontend rollback backups; record paths and SHA-256.
3. Update checkout, apply Alembic `20260829_0018`, restart `mps-backend`, and confirm health.
4. Rebuild/redeploy frontend; verify production VITE settings and absence of localhost fallback.
5. Run `deploy/smoke.sh`.

## Known risks / next work

- Existing POST `/media` deliberately has no review-specific provisional ownership or orphan cleanup. A cancelled/failed review submission can leave an uploaded media file; no cleanup expansion was approved for REV-2.
- F47 remains optional after no N+1 was confirmed. F48c and web design remain separate backlog scopes.
