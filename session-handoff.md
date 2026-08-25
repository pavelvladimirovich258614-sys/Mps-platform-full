# Session handoff — МПС

## Current verified state — 2026-08-25

F01–F34 remain passing and deployed. F35 remains `in_progress`; Sessions 1–3 are deployed at `c12e102`, while Session 4a Activity infrastructure is locally verified and awaits separate deployment approval. The current production frontend rollback is `/root/backups/mps-frontend-f35-s3-20260825T014224Z`.

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

## F35 Session 4a — Activity infrastructure locally complete, not deployed

- Migration `20260825_0012` creates `activity_log` with `user_id`, `event_type`, polymorphic `reference_id`, `created_at`, `(user_id, created_at, id)` pagination index and unique positive-event constraint. It backfills published posts, all comments, current likes and current follows.
- The only event types are `post_published`, `comment_created`, `post_liked` and `user_followed`. Draft saving has no event; direct publish and draft→published do. Unlike/unfollow remove the corresponding reversible event in the same transaction.
- No endpoint or frontend implementation exists yet. Session 4b must batch-load display context and enforce the Activity visibility contract.
- RED expected missing-model collection error; GREEN activity tests 4 passed. Full backend 77 passed in 21.70s; `alembic heads` returned `20260825_0012`; final init stopped only at the external Hermes/desktop pip-check blocker before MPS tests.

## Next task

Obtain separate approval to deploy F35 Session 4a, then plan and implement Session 4b Activity read API/UI.

## Known boundary

Email delivery remains blocked by the external Unisender/HostKey network path. Keep `EMAIL_LOGIN_ENABLED=false`; do not change email transport, credentials, firewall or VPS networking.
