# Session handoff — МПС

## Current verified state — 2026-08-26

F15–F35 are complete and production-deployed. The production revision remains `86a67e5` (`main`, `origin/main` and VPS `/opt/mps-platform` synchronized); `mps-backend` is active, Alembic is `20260825_0012 (head)`, and `deploy/smoke.sh` passed. F36 Package 1 is local-only and not deployed: it adds forum topic/message keyset pagination, SQL search, grouped country counts and migration `20260826_0013`; F36 remains `in_progress` until Packages 2–4.

## F36 Package 1 — local completion, deployment unapproved

- API contract: `GET /countries/{country_id}/topics` and `GET /topics/{topic_id}/messages` return `{items, next_cursor}`. They accept `limit` 1–50 (default 20) and opaque `id DESC` keyset `cursor`; the frontend appends subsequent results behind «Показать ещё» and removes the control on `next_cursor=null`.
- Scalability changes: topic search uses SQL `ILIKE`; country cards use one `LEFT JOIN + GROUP BY` count query. `20260826_0013` adds `ix_forum_topics_country_id_created_at_id`, `ix_forum_topics_author_id`, and `ix_forum_messages_topic_id_created_at_id`.
- Verification: backend RED — 3 expected failures; GREEN `test_forum.py` — 7 passed, including temporary PostgreSQL 16 Cyrillic search. Temporary PostgreSQL migration and all three indexes were observed. Frontend RED exposed the array-to-page-envelope crash; GREEN `Forum.test.tsx` — 2 passed. Full backend — 83 passed in 69.10s; frontend — 19 files / 114 passed; build — success, 115 modules. `./init.sh` stopped only at the external global Hermes/desktop pip-check before MPS tests.
- Next approved work candidate: F36 Package 2 — atomic forum write counters/topic quota and write rate limiting. Do not deploy Package 1 or alter the known Unisender/HostKey boundary without separate approval.

## F35 complete cycle

- Session 1 — Subscriptions: public `GET /users/{id}/followers` and `/following` provide `id`, `name`, `avatar_url` and viewer-relative `is_following`; the UI supplies Followers/Following lists with immediate «Подписаться» / «Подписан» controls. Publications stayed a regression baseline through existing `GET /posts?author_id=`.
- Session 2 — Replies: `GET /users/{id}/comments` returns the user's own comments with post context. The owner sees approved/pending/rejected entries; all others see only approved. A moderation label is visible only to an admin on that admin's own profile.
- Session 3 — Likes: public `GET /users/{id}/likes` returns `liked_at`; cards render only a non-empty real cover and UTC liked date. Successful in-tab post toggles refresh the shared current-user likes list; no cross-window sync and no Like card button were added.
- Session 4a — activity_log: migration `20260825_0012` creates normalized ActivityLog with pagination index and historical backfill. Events are `post_published`, `comment_created`, `post_liked`, `user_followed`; activity creation/removal is atomic with posts/comments/likes/follows and unlike/unfollow.
- Session 4b — Activity: `GET /users/{id}/activity` has opaque `(created_at, id)` keyset cursors, chunked batch context resolution and public/owner visibility filtering. PublicProfile renders four event types, UTC dates, «Показать ещё» and the exact empty state. Production Activity for Pavel shows four historical events — publication, like and two comments — dated 24.08.2026; `next_cursor` is null, so no load-more button is needed for that profile.

## Verification and production evidence

- Fresh closeout: backend — 79 passed in 20.90s; frontend — 18 files / 112 passed; `npm run build` succeeded (115 modules; standard chunk-size warning only).
- Final `./init.sh` stopped only at the known external Hermes/desktop global `pip check` conflicts before MPS tests. It is not an MPS code failure.
- Session 4a deployment: `2e58222`, fresh PostgreSQL backup, Alembic/backfill with four historical rows, backend readiness and smoke passed.
- Session 4b deployment: VPS fast-forward `2e58222 → 86a67e5`; backend readiness on attempt 2; frontend `index-CwPpAkwf.js`; rollback copies `/root/backups/mps-backend-f35-s4b-20260825T032415Z.tgz` and `/root/backups/mps-frontend-f35-s4b-20260825T032415Z`; smoke, public API and browser UI checks passed.

## Known boundary and next candidate

Email delivery remains blocked by the external Unisender/HostKey network path. Keep `EMAIL_LOGIN_ENABLED=false`; Telegram is the only visible login path. Do not change email transport, credentials, firewall or VPS networking without a separate decision.

The next candidate is read-only diagnosis of slow personal-profile loading (F32 from the original findings list). It has not yet been investigated; do not implement a performance fix before diagnosis and a confirmed plan.
