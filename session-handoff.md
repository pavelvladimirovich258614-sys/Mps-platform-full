# Session handoff — МПС

## Current verified state — 2026-08-25

F01–F34 remain passing and deployed. F35 is locally `passing`: Sessions 1–3 are deployed at `c12e102`; Session 4a Activity infrastructure is deployed at `2e58222`; Session 4b Activity API/UI is locally verified and awaits separate production deployment approval. The current production frontend rollback remains `/root/backups/mps-frontend-f35-s3-20260825T014224Z`.

## F35 Session 1 — subscriptions and publications baseline

- Existing `GET /posts?author_id={id}` and the Publications tab are regression-covered; their behavior was not changed.
- `GET /users/{id}/followers` and `GET /users/{id}/following` now return public users only, ordered by `UserFollow.created_at desc`, with `id`, `name`, `avatar_url` and viewer-relative `is_following`.
- PublicProfile now has «Подписчики» / «Подписки» sub-tabs, cards with avatar and name, and immediate «Подписаться» / «Подписан» state through the existing follow toggle API.
- There is no migration or dependency change. Approved backend+frontend production rollout completed: Alembic check passed, backend readiness succeeded on attempt 2, served bundle contains F35 markers and `deploy/smoke.sh` passed.

## Verification evidence

- RED backend: missing list routes returned 404 — 1 expected failure / 8 passed; GREEN `test_public_profile.py` — 9 passed.
- RED frontend: subscriptions tab was still the placeholder — 1 expected failure / 6 passed; GREEN PublicProfile + routing — 28 passed.
- Full backend — 72 passed in 22.10s; full frontend — 18 files / 107 passed; Vite production build — success, 115 modules.
- Final `./init.sh` stopped only at the external Hermes/desktop global `pip check`, before MPS tests. This external blocker is unchanged.

## F35 Session 2 — replies deployed

- `GET /users/{id}/comments` returns own comments with `body`, `created_at`, `status`, `post.slug`, and `post.title`, ordered newest first. The authenticated profile owner sees all own approved/pending/rejected rows; guests and any other viewer see only approved rows.
- PublicProfile renders article link, UTC date and exact empty state: «Пока нет ответов. Ваши ответы появятся здесь.»
- Status badges are strict: only `currentUser.role === 'admin' && currentUser.id === profile.id` shows them. Admin viewing another profile and every non-admin see no badge.
- RED backend was 1 expected 404 / 9 passed; GREEN 10 passed. RED frontend was 3 expected failures / 27 passed; GREEN targeted 30 passed. Full backend 73 passed in 20.15s, full frontend 18 files / 109 passed, build success with 115 modules. Final init stopped only at the external Hermes/desktop pip-check blocker before MPS tests. Approved rollout fast-forwarded VPS `fe00787 → 72ce494`, Alembic check passed, backend became ready, remote frontend build and `deploy/smoke.sh` passed; served bundle and public comments API returned 200 evidence.

## F35 Session 3 — Likes UX deployed

- Public `GET /users/{id}/likes` now emits `liked_at` normalized to UTC from `post_likes.created_at`; no migration and no access change.
- Likes cards render a non-empty real cover, «Понравилось {дата}» and retain only «Читать публикацию» — no like/dislike card button or gradient fallback.
- App refreshes an App-level current-user likes cache after each successful in-tab toggle; there is intentionally no cross-window synchronization.
- RED backend was 1 expected failure / 9 passed; GREEN 10 passed. RED frontend was 2 expected failures / 29 passed; GREEN targeted 31 passed. Full backend 73 passed in 22.95s, full frontend 18 files / 110 passed, build success with 115 modules. Final init stopped only at the external Hermes/desktop pip-check blocker before MPS tests.
- Approved rollout fast-forwarded VPS `72ce494 → c12e102`; `mps-backend` reached readiness on attempt 2, remote frontend built `index-DL7pFkN2.js`, public Likes returned 200 and `deploy/smoke.sh` passed.

## F35 Session 4a — Activity infrastructure deployed

- Migration `20260825_0012` creates `activity_log` with `user_id`, `event_type`, polymorphic `reference_id`, `created_at`, `(user_id, created_at, id)` pagination index and unique positive-event constraint. It backfills published posts, all comments, current likes and current follows.
- The only event types are `post_published`, `comment_created`, `post_liked` and `user_followed`. Draft saving has no event; direct publish and draft→published do. Unlike/unfollow remove the corresponding reversible event in the same transaction.
- No endpoint or frontend implementation was added in Session 4a; Session 4b adds the display context and visibility contract.
- RED expected missing-model collection error; GREEN activity tests 4 passed. Full backend 77 passed in 21.70s; `alembic heads` returned `20260825_0012`; final init stopped only at the external Hermes/desktop pip-check blocker before MPS tests.
- Approved backend-only rollout completed: fresh PostgreSQL backup `/root/backups/mps-activity-log-pre-20260825T030157Z.dump`, migration/backfill applied, backend readiness and `deploy/smoke.sh` passed. Direct production SQL found 4 activity_log rows and verified event_type/user_id/reference_id/created_at samples.

## F35 Session 4b — Activity API/UI locally complete

- `GET /users/{id}/activity` has opaque `(created_at, id)` keyset pagination. It batch-resolves posts, comments and followed users, then reads raw chunks until the response page is visibly filled. Owners see all their own comment statuses; guests/other visitors see only approved comments and currently accessible published posts.
- PublicProfile renders a chronological event list for `post_published`, `comment_created`, `post_liked` and `user_followed`, each with a UTC date, a «Показать ещё» button and exact empty state: «Пока нет активности. Здесь появятся ваши публикации, ответы, лайки и подписки.»
- RED backend — 2 expected 404 failures; GREEN `test_activity_feed.py` — 2 passed. RED frontend — Activity placeholder lacked the event text; GREEN targeted PublicProfile + routing — 33 passed. Full backend — 79 passed in 23.39s; full frontend — 18 files / 112 passed; production build succeeded with 115 modules (standard chunk-size warning only). Final init stopped only at external Hermes/desktop pip-check blocker before MPS tests.
- Session 4b is not deployed. It needs a separately approved backend+frontend production rollout.

## Next task

Obtain separate approval to deploy F35 Session 4b (backend and frontend).

## Known boundary

Email delivery remains blocked by the external Unisender/HostKey network path. Keep `EMAIL_LOGIN_ENABLED=false`; do not change email transport, credentials, firewall or VPS networking.
