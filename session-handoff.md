# Session handoff — МПС

## Current verified state — 2026-08-26

F15–F36 are complete and production-deployed. F37 is `in_progress`: Session A is locally verified, but intentionally uncommitted, unpushed and undeployed pending separate approval. F36 is `passing` and production-deployed at `c380667`: Packages 1–3 are deployed at `61ff1a5`, `6128c74` and `0bc8c3e`; all local, origin and VPS `/opt/mps-platform` heads were synchronized at that rollout. Package 1 had a fresh PostgreSQL backup and Alembic `20260826_0013`; Packages 2–3 restarted the backend and passed smoke/live synthetic checks; Package 4 was frontend-only and left the backend active without restart.

## F37 Session A — local completion, deployment not approved

- Data/API: migration `20260826_0014` adds nullable `posts.emoji` and seeds generic Setting `fishka_submissions_enabled=false`. `emoji` is obligatory for `type=fishka`; `pending` and `rejected` are now explicit PostStatus values. DTOs include emoji, status and published_at.
- Authorization/moderation: with the toggle on, a reader may submit only a fishka; its status is forced to `pending` and it has no published_at. Editors/admins bypass the toggle and publish fishki immediately. Editors/admins can approve/reject pending fishki through `PATCH /posts/{id}/moderate`; pending fishki appear in the existing moderation queue. Admin-only `GET/PATCH /admin/settings` manages the setting; authenticated `GET /posts/fishki/permission` provides the effective capability for a later form.
- Compatibility/scope: frontend Session A removes legacy `tip` from the ApiPost union/filter. No fishka creation UI, admin settings screen or content import exists yet; those are F37 Sessions B, C and D respectively. No production activity was authorized.
- Evidence: RED `tests/test_posts.py tests/test_admin.py` — 3 expected failures / 9 passed; GREEN target — 13 passed. An isolated Alembic upgrade reached `20260826_0014` and observed emoji plus default-off setting. Full backend — 92 passed, 3 skipped in 36.11s; full frontend — 19 files / 118 passed; build succeeded (115 modules; only standard Vite warning). `./init.sh` stopped only at the known external Hermes/desktop global pip-check before MPS test execution.

## F36 Package 4 — production deployed

- Visible wording only: the page heading is «Страны — Форум», sidebar/mobile/footer navigation is «Форум стран», and the topic back-link is «← Форум стран». No CSS, route, API, backend or schema changed.
- RED→GREEN: targeted RED had 3 expected missing-text assertions (heading, back-link, navigation); targeted `Forum.test.tsx` + `Layout.test.tsx` GREEN — 7 passed. Full frontend `npm test -- --run` — 19 files / 118 passed; `npm run build` — success with 115 modules and only the standard chunk-size warning.
- Production evidence: `c380667` fast-forwarded the VPS; the old `dist` is recoverable at `/root/backups/mps-frontend-f36-p4-20260826T011453Z`. Remote build verified the production API marker and no localhost API, `deploy/smoke.sh` passed, and a live browser navigated via «Форум стран» to the heading «Страны — Форум».

## F36 Package 1 — production deployed

- API contract: `GET /countries/{country_id}/topics` and `GET /topics/{topic_id}/messages` return `{items, next_cursor}`. They accept `limit` 1–50 (default 20) and opaque `id DESC` keyset `cursor`; the frontend appends subsequent results behind «Показать ещё» and removes the control on `next_cursor=null`.
- Scalability changes: topic search uses SQL `ILIKE`; country cards use one `LEFT JOIN + GROUP BY` count query. `20260826_0013` adds `ix_forum_topics_country_id_created_at_id`, `ix_forum_topics_author_id`, and `ix_forum_messages_topic_id_created_at_id`.
- Verification: backend RED — 3 expected failures; GREEN `test_forum.py` — 7 passed, including temporary PostgreSQL 16 Cyrillic search. Temporary PostgreSQL migration and all three indexes were observed. Frontend RED exposed the array-to-page-envelope crash; GREEN `Forum.test.tsx` — 2 passed. Full backend — 83 passed in 69.10s; frontend — 19 files / 114 passed; build — success, 115 modules. `./init.sh` stopped only at the external global Hermes/desktop pip-check before MPS tests.
- Production evidence: forum API observed a country with one topic and one message; both page responses had `next_cursor=null`, and the current production bundle was served after build. Do not alter the known Unisender/HostKey boundary without a separate decision.

## F36 Package 3 — production deployed

- Backend: `DELETE /topics/{topic_id}` and `DELETE /messages/{message_id}` permit the author or `admin`, reject others with Russian 403 and absent resources with Russian 404. Topic deletion cascades to messages through the existing FK; SQLite enables `PRAGMA foreign_keys=ON` so local/test behavior matches PostgreSQL.
- Message deletion: after the message flushes, one SQL `UPDATE` decrements `messages_count` without going below zero. It preserves `last_message_at` if a newer message remains; otherwise it recalculates from `MAX(messages.created_at)`, falling back to `topic.created_at` when the topic becomes empty. This update and the DELETE commit together.
- Frontend: topic list items have additive `author_id`; the author/admin sees «Удалить» only for permitted topics/messages. The F15/F30 confirmation modal prevents DELETE until «Подтвердить удаление» and removes the confirmed item immediately from the current page.
- RED→GREEN: backend RED — 3 expected 404 failures; GREEN deletion target — 3 passed; full forum suite — 11 passed / 3 PostgreSQL-only skipped. Frontend RED — 2 expected missing-control failures; GREEN target — 5 passed. Final backend pytest completed successfully; frontend — 19 files / 117 passed; build — success, 115 modules. `./init.sh` stopped only at the agreed external Hermes/desktop pip-check conflicts before MPS tests.
- Production evidence: initial commit `cc89d2b` and hotfix `0bc8c3e` were synchronized to local/origin/VPS. Fresh PostgreSQL backup `mps-2026-08-25-204329.dump.gz` was nonempty; backend became healthy after restart; frontend rebuilt with rollback `/root/backups/mps-frontend-f36-p3-20260825T204509Z`; `deploy/smoke.sh` passed. A live authorized API scenario created only synthetic rows, proved non-latest deletion preserves `last_message_at` while decrementing the count, newest deletion recalculates it, and topic DELETE removes the topic from the country list.

## F36 Package 2 — production deployed

- Topic quota: reader/premium topic creation obtains a PostgreSQL `SELECT FOR UPDATE` lock on the author row before `COUNT` and `INSERT`. With only one quota slot left, concurrent requests now admit exactly one topic and return the existing Russian 403 limit error for the rest.
- Message counters: API and Иришка issue atomic SQL `UPDATE ... messages_count = messages_count + 1`, so concurrent message writes cannot lose increments. No migration or frontend contract change was needed.
- Rate limits: SlowAPI derives its key from the verified access-token `sub` (fallback IP only for unauthenticated/invalid credentials). It applies 5 topic creations/minute and 10 messages/minute per user; exceeded requests return Russian 429 `Слишком много запросов. Попробуйте через минуту.`
- Verification: real PostgreSQL RED — 5 expected failures; GREEN `tests/test_forum.py tests/test_irishka.py` — 17 passed in 9.04s. Full backend pytest completed successfully; frontend — 19 files / 114 passed; build — success, 115 modules; `./init.sh` stopped only at the external global Hermes/desktop pip check before MPS tests.
- Production evidence: commit `6128c74` was synchronized to local/origin/VPS; backend restarted and `deploy/smoke.sh` passed. A live synthetic check created a topic and two messages with `messages_count=2`, then observed Russian 429 on the sixth topic request; synthetic rows were removed. Process-local SlowAPI storage remains adequate only while production stays single-worker; Redis-backed limits are a future scaling task.

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
