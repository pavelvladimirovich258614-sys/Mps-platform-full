# claude-progress.md — журнал прогресса МПС

## Current Verified State
- Repository root directory: mps-platform/
- Standard startup path: ./init.sh, затем `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Standard verification path: `python -m pytest backend/tests -q`
- Feature state: F01–F34 passing. F35 remains in_progress: Sessions 1–2 are deployed. Existing `GET /posts?author_id=` remains the Publications regression baseline; subscriptions are deployed. Replies use `GET /users/{id}/comments`: only the profile owner sees all own statuses, while visitors receive only approved comments; frontend status labels require an admin viewing their own profile. Likes remain as existing liked posts, while Activity needs a separate product decision. `init.sh` uses `python -m pip`; its global Python pre-flight remains an external Hermes/desktop blocker, so complete MPS suites are verified separately.
- Deploy state: платформа развёрнута и живая на `https://mir.pod-solncem.ru`; F35 Session 2 revision `72ce494` deployed from `fe00787`, mps-backend was restarted and readiness was green. Frontend rollback is `/root/backups/mps-frontend-f35-s2-20260825T010604Z`; served `index-DQG_KskE.js` contains Replies and production API only, `GET /users/{id}/comments` returned 200 with 2 items, and `deploy/smoke.sh` passed. Migration check made no schema changes. F25 production venv contains `pillow-heif==1.5.0`; nginx permits 11m, backend raw-file limit is 10 MiB. Migration `20260824_0011` is applied on PostgreSQL; `comments_moderation_enabled=false`. MPS uses separate PostgreSQL DB/role, Redis DB 2 and backend on `127.0.0.1:8001`.
- Audit boundary: C-05 остаётся отдельно согласованной security-задачей и не менялся; I-01, I-06a, I-13, I-15, I-16, I-18 и I-20 закрыты 2026-08-20. I-21 отложен до pre-launch юридической проверки. I-06b (единая sanitization policy) остаётся открытым и требует продуктового решения о допустимом содержимом полей.
- Auth/UI state: production build uses `https://mir.pod-solncem.ru/api/v1` and `Reg_Under_the_sun_bot`; F27 hides email form/copy, leaving Telegram Login Widget as the sole visible guest path. Re-enable only by setting `EMAIL_LOGIN_ENABLED` after Unisender/HostKey repair. F28 adds owner-only logout through the own public-profile ••• menu; visitors never receive it. F29 production picker accepts current JPEG/PNG/WebP/HEIC/HEIF/AVIF set and permits repeated selection of the same file. Role storage remains compatible with legacy `ADMIN` and current lower-case values.
- Email state: UnisenderGo transport использует официальный default `goapi.unisender.ru` (с возможностью override на go1/go2) и `X-API-KEY`; payload `message/recipients/body/subject/from_email` проверен mock-тестами. Production delivery сейчас заблокирована внешним TCP timeout до сети Unisender `31.184.200.*:443`: goapi и go1 недоступны, при этом ya.ru/google.com доступны, а local UFW/iptables outgoing не блокируют. Email-код и digest не работают до восстановления маршрута или смены транспорта/provider.
- Next best action: continue only an independently approved remaining F35 sub-session; do not alter current Likes. Activity still requires a separate product decision. Do not change Unisender transport without a separate decision: the external network blocker remains separate.

## Session Record

### Session 67 — 2026-08-25 (Codex, F35 Session 2 replies)
- Goal: replace only the «Ответы» placeholder with the profile owner's own-comments list, preserving the approved-only public visibility boundary and Pavel's strict admin-own-profile status-label rule.
- Completed: backend adds `GET /users/{id}/comments` with comment text/date/status and post slug/title. The authenticated profile owner receives all own approved/pending/rejected comments; guests and other viewers receive only approved. Frontend renders article link, UTC date and exact empty text «Пока нет ответов. Ваши ответы появятся здесь.»; status labels render only when `currentUser.role === 'admin' && currentUser.id === profile.id`. No migration or dependency change.
- Verification run: backend RED — expected 404 / 9 passed; backend GREEN — 10 passed. Frontend RED — 3 expected failures / 27 passed; frontend GREEN targeted — 30 passed. Full backend — 73 passed in 20.15s; full frontend — 18 files / 109 passed; build — success, 115 modules. Final `./init.sh` stopped only at external Hermes/desktop global pip-check conflicts before MPS tests.
- Evidence recorded: F35 remains `in_progress`; approved production rollout later deployed `72ce494`, passed Alembic/readiness/build/smoke and served-bundle/API checks.
- Commits: `72ce494` — Session 2 code.
- Known risks: status data is intentionally present in the DTO but pending/rejected rows are not exposed to visitors; UI labels remain hidden unless both admin and own-profile conditions hold.
- Next best action: obtain separate approval to deploy Session 2, or continue only an independently approved remaining F35 sub-session.

### Session 66 — 2026-08-25 (Codex, F35 Session 1 subscriptions)
- Goal: keep the existing Publications path as a regression baseline and replace only the public-profile Subscriptions placeholder with real followers/following lists and per-person follow state.
- Completed: backend adds public `GET /users/{id}/followers` and `/following`; both filter anonymous/banned people, order by `UserFollow.created_at desc`, and expose `id`, `name`, `avatar_url`, plus `is_following` relative to the optional current viewer. Frontend adds hooks, a generic existing-follow endpoint toggle, sub-tabs «Подписчики»/«Подписки», avatar/name cards and immediate «Подписаться»/«Подписан» state. No migration or dependency change.
- Verification run: backend RED — 1 expected 404 failure / 8 passed; backend GREEN — 9 passed. Frontend RED — 1 expected placeholder failure / 6 passed; frontend GREEN targeted — 28 passed. Full backend — 72 passed in 22.10s; frontend — 18 files / 107 passed; build — success, 115 modules. Final `./init.sh` stopped only at external Hermes/desktop global pip-check conflicts before MPS tests.
- Evidence recorded: F35 remains `in_progress`; the separately approved Session 1 rollout later deployed `fe00787`, passed Alembic/readiness/smoke and served-bundle checks.
- Commits: `fe00787` — Session 1 code; `38ce5e5` — Session 1 production evidence.
- Known risks: list endpoints deliberately hide profiles later made anonymous/banned; list buttons use the existing follow endpoints but do not change the viewed profile's counters.
- Next best action: F35 Session 2 — own-comments «Ответы» API/UI with exact empty text approved by Pavel.

### Session 65 — 2026-08-25 (Codex, final F29–F34 closeout)
- F29: avatar picker now accepts F25 modern formats and clears its file input after capture, so same-file retry produces a new change event.
- F30: drafts list supports confirmation-gated `DELETE /posts/{id}` without opening composer; successful deletion removes only that local card.
- F31–F33: explicit composer `cover_url` has precedence over inline media; F32 made cover and old gradient DOM branches mutually exclusive; F33 then removed the fallback branch by final product decision, leaving no top element for posts without a cover.
- F34: presence sidebar uses real avatar_url with gradient fallback and anchored green dot; public profile receives the dot only for users currently in `/online`; authenticated appearance reloads presence and a 30-second poll is cleaned up correctly.
- Final production evidence: `3451397` pushed and VPS fast-forwarded `e7e97b7 → 3451397`; rollback copy exists at `/root/backups/mps-frontend-f34-20260824T172052Z`; served `index-C-CVCK1W.js` returned 200, F34 markers were present and `deploy/smoke.sh` passed. Backend was not restarted and remained active. Guest browser DOM confirmed sidebar avatar+dot; no Telegram-authenticated session was available, and an online user expired from the 120-second window before public-profile live inspection.
- Known boundary: Unisender/HostKey network delivery remains blocked; email UI stays intentionally disabled through `EMAIL_LOGIN_ENABLED=false`. Next unstarted product scope is F35 personal-cabinet real tabs and subscribers-list follow action.

### Session 64 — 2026-08-25 (Codex, F34 profile avatars and presence)
- Goal: синхронизировать реальные аватары в виджете присутствия и добавить заметный online indicator на sidebar avatar и public profile, не меняя уже согласованную 120-second `last_seen_at` semantics.
- Diagnosis: backend middleware обновляет `last_seen_at` на каждом authenticated HTTP request; `/online` выдаёт non-anonymous users за последние 120 секунд с `avatar_url`, без WebSocket. Layout ранее игнорировал доступный `avatar_url`, а прежняя зелёная точка была positioned после имени через negative margins. Header уже использует `auth.user.avatar_url`; `useAuth.update` сохраняет PATCH `/me` response в state, поэтому новый avatar available immediately.
- Completed: Layout показывает `<img>` для online `avatar_url`, сохраняет gradient fallback и помещает dot внутрь avatar wrapper. App передаёт `isOnline` from `/online` в PublicProfile; hook refreshes immediately when the authenticated viewer appears, then every 30 seconds and clears its interval. CSS anchors the visible dot lower-right over round avatars.
- Verification run: RED targeted — 4 expected failures / 28 passed: missing sidebar avatar/dot, public-profile dot and App presence propagation. GREEN targeted — 5 files / 32 passed. `test_presence.py` baseline — 2 passed. Full backend unchanged — 71 passed in 18.75s; full frontend — 18 files / 106 passed; build — success, 115 modules. Final `./init.sh` stopped only at the known external Hermes/desktop global pip check after MPS requirements installation.
- Evidence recorded: no backend/API/database/dependency/email configuration change. Production deployment was not performed and requires separate approval.

### Session 63 — 2026-08-25 (Codex, F33 remove no-cover fallback)
- Goal: по финальному продуктовому решению полностью убрать градиент «Под солнцем» из ленты и полной статьи, когда `cover_url` не задан.
- Completed: в `Feed` и `ArticleComments` взаимно исключающий тернарник заменён на условный standalone `<img>` без else-ветки. При непустом trimmed URL сохраняется F32 image branch; при отсутствии URL cover DOM не создаётся, следующий `post-tag` идёт сразу. `styles.css` намеренно не менялся.
- Verification run: RED Feed/ArticleComments — 2 expected failures / 10 passed, оба из-за остававшегося `<span>Под солнцем</span>`. GREEN targeted — 2 files / 12 passed. Full frontend — 16 files / 102 passed; full backend unchanged — 71 passed in 19.84s; build — success, 115 modules. Final `./init.sh` остановился только на известном external Hermes/desktop global pip check после установки MPS requirements.
- Evidence recorded: F33 frontend-only production deploy at `e4c302f`; old dist at `/root/backups/mps-frontend-f33-20260824124812`; served `index-CXtH547q.js` has the explicit image branches and no fallback className literals; `deploy/smoke.sh` passed and backend stayed active without restart. Live guest DOM on an existing no-cover article confirmed feed/detail `fallback=false`, `coverImage=false`, exact placeholder text absent and next content class `post-tag`.
- Commits: `e4c302f` — F33 code/tests, followed by tracker checkpoint.
- Known boundary: authenticated creation of a new explicit-cover article was not needed for the no-cover production fix; positive cover branch remains covered by F32/F33 regression tests and served-bundle verification.

### Session 62 — 2026-08-25 (Codex, F32 critical cover fallback hotfix)
- Goal: устранить production-симптом, когда градиентный fallback-container оставался в DOM при `cover_url`.
- Diagnosis: F31 проверял условный дочерний `img/span`, но оба render paths всегда создавали `.article-cover`/`.article-hero`, несущие gradient CSS. Скриншот также показывает, что картинка ниже заголовка — inline TipTap body media, а не cover.
- Completed: cover branch теперь создаёт только standalone `article-cover-image`/`article-hero-image`; fallback branch создаёт только прежний gradient-container. `trim()` защищает от whitespace-only URL.
- Verification run: RED Feed/ArticleComments — 2 expected failures / 10 passed, потому что fallback containers оставались в cover DOM. GREEN targeted — 2 files / 12 passed. Full frontend — 16 files / 102 passed; full backend unchanged — 71 passed in 20.50s; build — success, 115 modules. Final `init.sh` остановился только на известном external Hermes/desktop global pip check.
- Evidence recorded: F32 production frontend deploy at `02823b9`; old dist at `/root/backups/mps-frontend-f32-20260824121451`; served bundle `index-BGDRzZT7.js` includes both new image branches; `deploy/smoke.sh` passed and backend stayed active.
- Commits: `02823b9` — F32 hotfix code/tests, followed by tracker checkpoint.
- Known risks: public feed was empty during unauthenticated browser inspection; no temporary content was created without a Telegram session. Owner needs the final real-content visual acceptance.

### Session 61 — 2026-08-24 (Codex, F31 explicit article cover)
- Goal: activate existing `Post.cover_url` end-to-end through an explicit composer cover selector, not automatic inline-image extraction.
- Completed: posts DTO now returns `cover_url` for list, published detail and draft detail; existing PATCH persists it. Composer uploads cover through existing `POST /media` with the F25 MIME set, shows preview and preserves the URL across draft/article edit prefill and create/update payloads. Feed and full article show the chosen image with object-fit: cover; articles without it retain the `Под солнцем` fallback.
- Verification run: RED backend — 1 expected failure / 5 passed (DTO omitted cover); RED frontend — 4 expected failures / 17 passed (picker/preview/render absent). GREEN backend targeted — 6 passed; frontend targeted including App PATCH — 4 files / 41 passed. Full backend — 71 passed in 33.49s; full frontend — 16 files / 102 passed; build — success, 115 modules. Final `./init.sh` installed MPS requirements and stopped only at external Hermes/desktop global pip check.
- Evidence recorded: F31 marked passing locally; no schema migration or dependency change. Explicit cover has precedence over inline body images, by rendering rule rather than extraction.
- Commits: F31 deployment reached `9bc70d4`; F32 is the follow-up critical hotfix.
- Next best action: owner performs authenticated visual acceptance of both F32 cover branches.

### Session 60 — 2026-08-24 (Codex, F30 draft deletion and cover diagnosis)
- Goal: диагностировать тёмный блок обложки статьи и добавить согласованное удаление черновика из списка, не меняя cover без product approval.
- Diagnosis: `Feed` PostCard and `ArticleComments` always render dark-gradient `Под солнцем`; `RichTextContent` renders TipTap inline images only inside the body. Backend `Post.cover_url` exists, но его не выдаёт DTO и не используют frontend ApiPost, composer или renderer. Блок therefore is hard-coded fallback/design, not a failed image upload.
- Completed: Draft card is restructured as an article with separate open and accessible delete buttons (no nested button). Delete opens the existing F15-style confirmation; only confirmed existing `DELETE /posts/{id}` runs, and success filters that draft from local state without navigation. Backend unchanged.
- Verification run: RED `Drafts.test.tsx` + `App.routing.test.tsx` — 4 expected failures / 19 passed. GREEN targeted — 2 files / 23 passed. Full frontend — 16 files / 96 passed; build — success, 115 modules. Full backend unchanged — 70 passed in 17.70s. Final `./init.sh` installed MPS requirements and stopped only at external Hermes/desktop global pip check.
- Evidence recorded: F30 marked passing locally; all requested delete paths are covered. Cover remains deliberately unchanged pending separate product choice.
- Commits: local F30 completion commit created; production push remains unapproved.
- Next best action: await explicit F30 frontend deploy approval; then validate deletion live and separately approve either first-inline-image cover or a dedicated cover_url flow.

### Session 59 — 2026-08-24 (Codex, F29 profile avatar picker alignment)
- Goal: диагностировать сообщение о неработающей загрузке аватара и устранить подтверждённые UI-барьеры, не меняя уже рабочий backend flow.
- Diagnosis: Profile button is a real label-associated file input: `onChange → auth.uploadAvatar → POST /media → PATCH /me`. `avatar_url` exists in model, initial users migration, schema and API. Production `/users/2/profile` returned a local `/media/*.png` avatar that HEAD returned 200 image/png, proving the current image is not Telegram `photo_url`. The picker lagged behind F25 with only JPEG/PNG/WebP, and kept its selected value so choosing the identical file again did not emit `change`.
- Completed: Profile accept now includes JPEG, PNG, WebP, HEIC, HEIF and AVIF; its input clears immediately after capturing the File. The existing `useAuth` POST/PATCH regression remains unchanged and green. No backend/API/database/dependency change.
- Verification run: RED `Profile.test.tsx` — 1 expected failure / 3 passed. GREEN targeted `Profile` + `useAuth` — 2 files / 7 passed. Full frontend — 15 files / 92 passed; build — success, 115 modules. Full backend unchanged — 70 passed in 17.96s. Final `./init.sh` installed MPS requirements and stopped only at external Hermes/desktop global pip check.
- Evidence recorded: F29 marked passing locally; picker and media backend now share the F25 modern-image support contract, and repeat selection is explicitly covered.
- Commits: pending local F29 completion commit.
- Next best action: await explicit F29 frontend deploy approval; then Pavel confirms HEIC/HEIF and same-file repeat behavior in a real Telegram session.

### Session 58 — 2026-08-24 (Codex, F28 logout from own public profile)
- Goal: дать владельцу `/users/{id}` доступ к существующему logout-flow, не показывая его на чужих профилях.
- Diagnosis: «Выйти» физически был только в modal `Profile.tsx`. В `PublicProfile.tsx` already-working ••• menu had only copy/share actions, so it is the natural owner-only insertion point.
- Completed: `PublicProfile` receives optional `onLogout`, closes its menu before the callback and renders «Выйти» only for the owner. `App` reuses `auth.logout()` and then routes to guest feed; no duplicated auth or backend change.
- Verification run: RED `PublicProfile` + `App.routing` — 2 expected failures / 22 passed. GREEN targeted `PublicProfile`, `App.routing`, `useAuth` — 27 passed. Full frontend — 15 files / 91 passed; build — success, 115 modules. Full backend unchanged — 70 passed in 18.79s. Final `./init.sh` installed MPS requirements and stopped only at external Hermes/desktop global pip check.
- Evidence recorded: F28 marked passing locally. Owner menu callback closes menu, posts `/auth/logout`, clears the token/session and redirects `/users/7` to `/`; visitor menu has no logout action.
- Commits: pending local F28 completion commit.
- Next best action: await explicit F28 frontend deploy approval; then Pavel confirms the owner logout path in a real Telegram session.

### Session 57 — 2026-08-24 (Codex, F27 temporary Telegram-only login UI)
- Goal: скрыть вводящий в заблуждение email-code путь из guest UI из-за внешней недоступности доставки, не удаляя исправный backend API.
- Completed: `Profile.tsx` получил documented `EMAIL_LOGIN_ENABLED = false`; email form, CTA и copy рендерятся только при включении флага. Telegram widget остаётся единственным видимым path и использует неизменный callback. `useAuth` email callbacks и backend `/auth/email/request`/`verify` не менялись.
- Verification run: RED `Profile` + `App.routing` — 2 expected failures / 19 passed, оба нашли visible email input. GREEN targeted `Profile`, `TelegramLogin`, `App.routing` — 3 files / 23 passed. Backend email API baseline `test_auth.py` — 6 passed. Full frontend — 15 files / 89 passed; build — success, 115 modules; production VITE markers verified. Full backend — 70 passed in 17.36s. Final `./init.sh` installed MPS requirements and stopped only at external Hermes/desktop global pip check.
- Evidence recorded: F27 marked passing. Email input/code/CTA/copy absent; official widget script loads and forwards signed payload. No live Telegram account is available to Codex.
- Commits: pending local F27 completion commit.
- Known risks: until the external Unisender/HostKey path is repaired, email API is intentionally not exposed by frontend. Restore it only by enabling the flag and re-verifying real delivery; do not change mail transport/network under this scope.
- Next best action: await explicit F27 frontend deploy approval, then Pavel performs the authenticated Telegram login smoke.

### Session 56 — 2026-08-24 (Codex, F26 composer closes after successful save)
- Goal: устранить подтверждённый UI-дефект, при котором composer не закрывался после сохранения draft или публикации; не менять не воспроизведённый поток открытия draft.
- Completed: PostComposer получил optional `onClose` и вызывает его только после успешного `await` POST/PATCH; rejected server response сохраняет modal и error notice. Feed передаёт callback, сбрасывающий `composerOpen`; App передаёт его edit modal, сбрасывая `editingPost`, поэтому draft/article PATCH закрывает composer.
- Verification run: RED `PostComposer.test.tsx` — 3 expected failures / 4 passed (нет onClose после draft/publish/PATCH; error rejection была unhandled). GREEN targeted — `PostComposer`, `Feed`, `App.routing`: 3 files / 28 passed. Full frontend — 15 files / 89 passed; production build — success, 115 modules, only standard chunk-size warning; production VITE markers verified. Full backend — 70 passed in 20.79s. Final `./init.sh` installed MPS requirements and stopped only at the unrelated external Hermes/desktop global pip check.
- Evidence recorded: F26 marked passing. App routing regression confirms draft click performs GET detail, opens prefilled dialog, and now closes it after successful PATCH; PostComposer regression proves error does not close it.
- Commits: pending local F26 completion commit.
- Known risks: draft-list click failure was not reproduced in source/tests; it needs a live authenticated browser repeat after separately approved deploy. Production remains at F25; email network boundary unchanged.
- Next best action: await explicit approval for frontend-only F26 rollout, then perform live draft-list click/open/save/publish/error smoke.

### Session 55 — 2026-08-24 (Codex, F25 iPhone/modern media formats)
- Goal: диагностировать сообщение о неработающей загрузке фото и добавить отображаемую поддержку HEIC/HEIF, а также AVIF, без production deploy.
- Completed: pre-code inspection подтвердила, что стандартная PNG/JPEG цепочка `onChange → apiForm POST /media → insertImageAtDocumentStart` сохранена с F16–F24; жалобу объясняли HEIC/HEIF, заблокированные и file picker MIME accept, и backend allowlist. Добавлен `pillow-heif==1.5.0`, registered HEIF opener, HEIC/HEIF normalisation в WebP, AVIF passthrough и понятная русская 422 для оставшихся неподдерживаемых типов. Composer принимает новые MIME-типы.
- Verification run: RED frontend — 1 failed / 18 passed, accept не содержал новые типы. RED backend после установки dependency — 4 failed / 7 passed, HEIC/HEIF/AVIF отвечали 422 и сообщение не перечисляло новые форматы. GREEN targeted — backend 11 passed, frontend 19 passed. Full frontend — 15 files / 85 passed; build — success, 115 modules. Full backend — 70 passed in 21.04s. Final `./init.sh` установил MPS requirements и остановился только на external Hermes/desktop global pip check.
- Evidence recorded: F25 marked passing. HEIC/HEIF test fixture загружается с 200, сохранённый файл имеет `.webp` и Pillow format `WEBP`; AVIF upload returns 200 and remains `AVIF`; PNG frontend contract still sends POST and inserts returned URL.
- Commits: pending local F25 completion commit.
- Known risks: production remains on F24 revision until explicit approval; no authenticated live browser session was available, therefore local frontend regression plus authenticated ASGI API tests are evidence, not a production browser smoke. Email/Unisender network boundary is unchanged.
- Next best action: on explicit approval, deploy F25 backend and frontend together, then perform authorized HEIC/HEIF/AVIF upload smoke and cleanup.

### Session 54 — 2026-08-24 (Codex, финальное состояние F22–F24)
- Goal: закрыть и задеплоить весь согласованный цикл rich-text/composer и приватных черновиков F22–F24.
- Completed: F22 добавил реактивное обновление toolbar B/I/S и остальных formatter flags по TipTap `selectionUpdate`/`transaction`, не меняя toggle-команды. F23 по финальному продуктовому решению расширил Bold/Italic/Strike с `inclusive: false`: ввод сразу после правой границы mark сбрасывает форматирование, тогда как ввод внутри mark и shortcuts сохраняются; это намеренно отличается от Word/Google Docs. F24 добавил private `GET /posts/drafts` и `GET /posts/drafts/{id}`, `posts.updated_at`, перевод draft→published с `published_at`, editor/admin drafts list + F15 modal prefill; composer хранит id первого draft и далее PATCH-ит тот же Post без дубликатов. Черновики видит только автор.
- Verification run: F22/F23/F24 прошли RED→GREEN и соответствующие full frontend/backend suites; итог F24 — frontend 15 files / 84 passed, build 115 modules, backend 66 passed. `init.sh` в MPS-части корректно использует `python -m pip`; останавливается только на отдельном внешнем Hermes/desktop pip-check. Production F24: PostgreSQL backup создан и проверен, Alembic head `20260824_0011`, backend health 200/active, production frontend asset 200, `deploy/smoke.sh` passed; temporary own draft POST 201, list/detail 200, PATCH publish 200, public feed confirmation и DELETE 204 cleanup.
- Evidence recorded: `9872364` pushed; local main, origin/main и VPS observed на `9872364655cb…`. Foreign-draft `404` covered by F24 tests; live check не выполнен, потому что production содержал только один editor/admin.
- Commits: `1a680db` (F22), `e6e9012` (init infrastructure), `46de239` (F23), `9872364` (F24).
- Known risks: email delivery остаётся заблокированной внешним Unisender/HostKey network path; не менять transport, credentials, firewall или VPS networking без отдельного решения. При появлении второй тестовой editor/admin учётной записи повторить live foreign-draft 404 smoke.
- Next best action: новый scope выбирает Павел; F15–F24 завершены и deployed.

### Session 53 — 2026-08-24 (Codex, F24 private post drafts)
- Goal: дать editor/admin доступ только к собственным черновикам, с сохранением ID при первом draft save и последующим PATCH/publish без дубликата.
- Completed: добавлены Alembic head `20260824_0011` (`posts.updated_at`), private `GET /posts/drafts` summary и `GET /posts/drafts/{id}` detail до public slug route; оба фильтруют `author_id` текущего editor/admin, чужой draft отвечает 404. PATCH чужого draft также закрыт 404; published F15 semantics не менялись. При draft→published устанавливается `published_at`. Frontend получил editor/admin-only `/drafts`, список title/date, F15 modal prefill и composer state, который после первого POST сохраняет Post ID и далее PATCH-ит тот же draft.
- Verification run: backend RED — 404 list; GREEN `test_posts.py` 5 passed. Additional RED — `published_at` оставался null; GREEN 5 passed. Frontend RED — list/prefill и second PATCH отсутствовали; targeted GREEN 2 files / 21 passed. Full frontend — 15 files / 84 passed; build — success, 115 modules (standard Vite chunk-size warning). Full backend — 66 passed in 19.73s. Alembic history confirms new head. Final `./init.sh` остановился только на external global Hermes/desktop pip check; full MPS suites completed separately.
- Evidence recorded: F24 marked passing, checklist and handoff updated. Production intentionally unchanged.
- Commits: F24 local completion commit `F24: private editor drafts [passing]`.
- Known risks: F24 needs explicit production approval because it changes the database schema and backend. Do not expose cross-author drafts or broaden admin visibility without a new product decision.
- Next best action: on approval, push F24, backup PostgreSQL, apply Alembic `20260824_0011`, restart `mps-backend`, rebuild frontend with production VITE values, smoke private draft create/list/detail/PATCH/publish and cleanup.

### Session 52 — 2026-08-24 (Codex, F23 non-inclusive B/I/S marks)
- Goal: по финальному product decision отключить наследование Bold/Italic/Strike на правой границе mark, сохранив форматирование внутри текста и F22 toolbar reactivity.
- Completed: StarterKit перестал регистрировать только встроенные B/I/S; существующие TipTap `Bold`, `Italic` и `Strike` подключены через `extend({ inclusive: false })`. Toggle-команды, Ctrl+B/Ctrl+I shortcuts, HTML serialization, toolbar subscriptions, backend и production не менялись. Отдельно `init.sh` переведён с отсутствующего `pip` launcher на эквивалентный `python -m pip` и закоммичен отдельным инфраструктурным commit до F23.
- Verification run: RED `npm test -- --run src/components/RichTextEditor.test.tsx` — 3 failed / 15 passed: boundary input сериализовался внутри B/I/S marks. GREEN targeted — 18 passed. Full frontend — 15 files / 82 passed; build — success, 114 modules. Full backend — 65 passed in 15.72s. Final `./init.sh` после установки MPS requirements дошёл до внешнего global `pip check` и остановился на Hermes/desktop conflicts; MPS suite отдельно зелёный.
- Evidence recorded: F23 marked passing in `feature_list.json`; `clean-state-checklist.md` and handoff updated. Production deploy intentionally not performed.
- Commits: separate init infrastructure fix and F23 completion commit are recorded independently.
- Known risks: Product intentionally differs from Word/Google Docs at a right mark boundary. External global Python `pip check` has unrelated conflicts and is not changed.
- Next best action: await owner approval to push/deploy F23 frontend-only, then perform authenticated composer smoke for B/I/S boundary and in-mark typing.

### Session 51 — 2026-08-24 (Codex, F22 TipTap toolbar state)
- Goal: устранить залипание B/I/S toolbar state в composer после изменения selection, не меняя TipTap toggle-команды или stored HTML.
- Completed: B/I/S уже корректно использовали `toggleBold`/`toggleItalic`/`toggleStrike`; причина была в React render без подписки на editor state. `RichTextEditor` теперь пересчитывает только toolbar flags по `selectionUpdate` и `transaction` для marks, H1-H3, lists, quote и link. Реальные команды и формат HTML не менялись. Test-only transaction mock стабилизирован и поддерживает editor lifecycle `on/off`.
- Verification run: RED `npm test -- --run src/components/RichTextEditor.test.tsx` — 3 failed / 9 passed: B/I оставались aria-pressed=false после toggle, H1 не сбрасывался после перехода в обычный текст. GREEN targeted — 12 passed. F15 regression `RichTextEditor`, `PostComposer`, `ArticleComments`, `App.routing` — 4 files / 36 passed: prefill, PATCH, delete confirmation и redirect зелёные. Full frontend — 15 files / 76 passed; `npm run build` — success, 114 modules (standard chunk-size warning). Full backend — 65 passed in 17.56s via Hermes venv. Final `./init.sh` installed MPS requirements then stopped only at known external Hermes `pip check` missing charset-normalizer.
- Evidence recorded: F22 marked passing in `feature_list.json`; production deployment intentionally not performed.
- Commits: local F22 completion is recorded in Git history; push and production deployment remain unapproved.
- Known risks: no production change; its toolbar retains the old non-reactive behavior until explicitly approved frontend deployment. Link is intentionally active only inside its non-inclusive mark, covered by regression.
- Next best action: await explicit owner approval for a frontend-only production rollout and authenticated composer smoke.

### Session 50 — 2026-08-24 (Codex, итоговый цикл F15–F21)
- F15: editor/admin кнопки «Редактировать»/«Удалить» на полной статье; composer prefill, PATCH на том же slug, confirmation modal и DELETE/redirect.
- F16: `@tiptap/extension-image` 3.30.2, toolbar/file input и `POST /api/v1/media` для JPEG/PNG/WebP.
- F17: lazy Pillow decoding повреждённого `image/png` исправлен через `image.load()`; контрактный `422 «Некорректное изображение»` вместо 500.
- F18: строгая `figure[data-carousel="images"]` + `img[src,alt]`, ограниченный nh3/DOMPurify allowlist и React-карусель с Prev/Next/точками.
- F19: ImageCarousel NodeView в editor, SVG picture-icon, удалён единственный selector «Тип публикации», добавлены крестики удаления img/кадра.
- F20: TipTap chain + GapCursor после вставки исключают замену первого image-node; второй/третий файлы расширяют карусель.
- F21: nginx ingress limit повышен с default 1m до 11m при сохранении backend limit 10 MiB; изображения всегда нормализуются в единую leading-группу независимо от cursor position.
- Verification evidence: RED→GREEN и полные suites выполнены для каждого scope; финальный F21 — backend 65 passed, frontend 15 files / 73 passed, build 114 modules success. `./init.sh` останавливается только на известном внешнем Hermes `pip check` missing charset-normalizer.
- Production evidence: `ada1f52` pushed/deployed; nginx `-t`/graceful reload, production VITE bundle и smoke passed. Live smoke: PNG 4.32 MB и 3.63 MB → 200 без 413; одна leading-карусель была опубликована и переключалась; temporary post DELETE → 204 с redirect, оба temporary media удалены. `mps-backend` не перезапускался.
- Open boundary: email delivery всё ещё заблокирована внешней сетью к Unisender/HostKey; не менять transport или сетевую конфигурацию без отдельного решения.

### Session 49 — 2026-08-23 (Codex, F20 repeated image upload selection hotfix)
- Goal: исправить live-дефект F19, при котором вторая последовательная toolbar-загрузка заменяла выделенный первый image-node и требовала ручного End/ArrowRight для создания карусели.
- Completed: RED-тест теперь воспроизводит browser-like NodeSelection внутри TipTap chain вместо ложноположительного jsdom-сценария. В uploadImage setImage и reposition selection объединены в одну chain: позиция берётся сразу после вставленного узла, впереди выбирается text selection, а на конце документа — GapCursor. После этого существующий groupAdjacentImages получает два реально соседних img. ImageCarouselNode, backend, sanitizer, dependencies и database не менялись.
- Verification run: RED single test — 1 failed / 6 skipped ожидаемо, HTML содержал только `/media/two.webp` без figure и первого URL. GREEN той же командой — 1 passed / 6 skipped. Related targeted — 3 files / 16 passed. Full frontend `npm test` — 15 files / 72 passed. `npm run build` — success, 114 modules и только стандартный chunk-size warning. Full backend `python -m pytest tests -q --color=no --basetemp .pytest-f20-full` — 63 passed in 14.19s. Final `./init.sh` остановился до MPS tests только на известном внешнем Hermes pip check missing charset-normalizer.
- Evidence recorded: F20 marked passing in feature_list.json; singleton, middle-of-text, 2/3 uploads and standalone/carousel removal covered. Production intentionally unchanged pending separate approval.
- Commits: локальный F20 commit создан; push ожидает отдельного подтверждения владельца.
- Known risks: production ещё выполняет старый selection path до отдельного deploy; drag-and-drop/paste/reorder/autoplay вне scope.
- Next best action: после явного approval выполнить frontend-only F20 deploy и browser-authenticated smoke двух последовательных загрузок без ручного движения курсора.

### Session 48 — 2026-08-23 (Codex, F19 composer/carousel polish)
- Goal: закрыть четыре находки живого использования F18 — диагностировать неправильный preview карусели, заменить image icon, убрать бессмысленный type select и дать пользователю удалить отдельное изображение; backend/SSR не менять.
- Completed: production diagnosis до кода доказал, что uploaded JPEG URLs возвращают 200, published React carousel и served CSS работают, а Next переключает реальный кадр. Дефект локализован в composer: non-leaf ImageCarouselNode не имел NodeView. Добавлены React NodeViews с обязательным скрытым TipTap contentDOM и видимым reusable ImageCarousel preview; stored HTML остаётся строгим `figure[data-carousel="images"]` + `img`. Обычное и активное carousel-изображение имеют доступный крестик; удаление из пары разворачивает оставшийся img, а остальной текст сохраняется. Toolbar получил inline picture SVG без зависимости; single-option select удалён, payload остаётся `type: article`.
- Verification run: RED targeted — 3 files failed, 6 failed / 9 passed. GREEN targeted — 3 files / 15 passed. Full frontend `npm test` — 15 files / 71 passed. `npm run build` — success, 114 modules, стандартный chunk-size warning. Full backend `python -m pytest tests -q --color=no --basetemp .pytest-f19-full` — 63 passed in 16.62s. Final `./init.sh` stopped before MPS tests only at the known external Hermes pip check missing charset-normalizer.
- Evidence recorded: F19 marked passing in feature_list.json. Temporary production diagnostic article: two media uploads 200, post 201, browser real-image/CSS/navigation checks passed; cleanup DELETE 204, post and both media GET 404. Backend, sanitizer, dependencies, database and production deployment unchanged.
- Next best action: await explicit approval for frontend-only F19 production deploy; then verify production VITE values, served bundle and authenticated composer image delete/carousel preview. Advanced drag/paste/reorder/autoplay remains separate.

### Session 47 — 2026-08-23 (Codex, F18 multi-image carousel)
- Goal: закрыть F14 Phase 3 минимальной интерактивной каруселью для двух и более соседних изображений в TipTap composer, не начиная drag-and-drop, paste, reorder или autoplay.
- Completed: добавлен строгий stored-HTML формат `figure[data-carousel="images"]` с прямыми `img[src,alt]`. nh3 и DOMPurify разрешают только этот carousel-attribute и существующие image-атрибуты, удаляя class/style/event handlers/лишние data attributes. Повторная загрузка соседних изображений объединяет top-level image/carousel blocks в custom `ImageCarousel` TipTap node; один img остаётся обычным. RichTextContent безопасно выделяет только валидные carousel figures в React-компонент с prev/next и dots; добавлены золотые стили.
- Verification run: RED backend — 1 expected failure (figure removed allowlist); RED frontend — 3 expected failures (нет controls/markup/grouping). GREEN targeted — backend 4 passed; frontend 2 files / 9 passed. Full backend `python -m pytest tests -q --color=no --basetemp .pytest-f18-full-confirm` — 63 passed in 18.97s. Frontend `npm test` — 15 files / 67 passed; `npm run build` — success, 113 modules (standard Vite chunk-size warning only). Final `./init.sh` stopped only at external Hermes pip check missing charset-normalizer before MPS tests.
- Evidence recorded: F18 marked passing and deployed: 6ab2e40 was pushed and VPS fast-forwarded 61ebd31→6ab2e40 after a successful backup. Backend restart reached loopback health; frontend remote build verified public VITE markers/no localhost; deploy smoke passed. Temporary three-PNG API smoke rendered a guest-visible carousel with working Next/Previous and a separate ordinary image, then DELETE 204/API GET 404 and exact media cleanup completed. Literal authenticated toolbar upload was not browser-executed because no Telegram browser session was available; local DOM regression and served build cover that composer path.
- Next best action: separately scope F19; do not start it automatically.

### Session 46 — 2026-08-23 (Codex, F17 corrupted media validation)
- Goal: устранить F03/F16 production finding — повреждённый файл с допустимым image/png MIME возвращал 500 вместо 422.
- Completed: причина — lazy Pillow decoding: Image.open и thumbnail проходили, но `image.save()` позже выбрасывал `OSError: image file is truncated` вне validation branch. Добавлен `image.load()` до thumbnail; `OSError` и `UnidentifiedImageError` возвращают существующее `422 «Некорректное изображение»`. Повреждённый файл не достигает filesystem.
- Verification run: RED media — 1 expected failure with full OSError trace from image.save. GREEN targeted — 6 passed, включая valid-signature/MIME truncated PNG → 422/detail и отсутствие media file. Full backend `python -m pytest tests -q --basetemp .pytest-f17-full` — 62 passed in 16.95s. Final `./init.sh` stopped only at external Hermes pip check missing charset-normalizer before MPS tests.
- Evidence recorded: F17 marked passing in feature_list.json; no frontend/dependency/database changes. Production backend-only deploy `35f6914`: fast-forward ca0880f→35f6914, restart ready on attempt 2, smoke passed; live corrupted PNG→422/no file and valid JPEG/PNG/WebP→200 with test media cleanup.
- Next best action: return to separately approved F14 Phase 3 carousel.

### Session 45 — 2026-08-23 (Codex, F16 image upload in composer)
- Goal: добавить единичную загрузку изображения в TipTap composer для создания и редактирования, без начала drag-and-drop/paste или карусели.
- Completed: добавлено согласованное официальное `@tiptap/extension-image` 3.30.2. Toolbar «Вставить изображение» открывает скрытый file input с JPEG/PNG/WebP; файл отправляется как FormData на существующий `/media`, возвращённый URL вставляется в текущую TipTap selection с alt из имени файла. Ошибка остаётся локальным alert и не сбрасывает редактор. Existing RichTextContent allowlist отображает `/media/...` img в опубликованной статье.
- Verification run: RED — RichTextEditor 3 expected failures, потому что button/input отсутствовали; RichTextContent 3 passed. GREEN targeted — 2 files / 6 passed. Full frontend `npm test` — 15 files / 64 passed; `npm run build` — 111 modules, success. Full backend `python -m pytest tests -q --basetemp .pytest-f16-full` — 61 passed in 12.31s. Final `./init.sh` stopped only at external Hermes pip check missing charset-normalizer before MPS tests.
- Evidence recorded: F16 marked passing in feature_list.json. Backend не менялся; production не менялся и ждёт отдельного подтверждения. npm install showed 5 transitive audit findings; no audit fix was applied outside scope.
- Production: F16 `7a793f0` pushed and deployed frontend-only; VPS fast-forwarded 8255d55→7a793f0, remote build embedded both public VITE values with no localhost, rollback `/root/backups/mps-frontend-f16-20260823T131817Z`, smoke passed and backend remained active. Valid PNG POST /media→200, public temporary article rendered one img in guest browser, invalid MIME→422 detail, then DELETE 204/GET 404 cleanup. Authenticated browser session was unavailable, so the literal toolbar click/toast was not live-browser executed; served marker and local DOM tests cover it. Corrupted image/png bytes returned 500, not the F03-documented 422.
- Next best action: F14 Phase 3 multi-image carousel only after a separate decision. Separately prioritize the F03 corrupted-image 500→422 contract fix; do not deploy F16 again without an explicit reason.

### Session 44 — 2026-08-23 (Codex, F15 posts editing/deletion UI)
- Goal: добавить frontend UI редактирования и удаления уже опубликованной статьи, не меняя F03 backend contract.
- Completed: editor/admin видит «Редактировать»/«Удалить» только на полной статье. Edit modal повторно использует TipTap composer с title/type/body; «Сохранить изменения» отправляет PATCH и обновляет локальную статью на текущем slug URL. Delete modal требует подтверждения текста «Это действие нельзя отменить», затем DELETE 204 reloads feed and routes to `/`. Reader, premium и guest actions не видят. Frontend-only production rollout `8255d55` опубликован без restart backend.
- Verification run: RED targeted — 3 expected failures (prefill absent, management actions absent). GREEN targeted — 3 files / 24 passed. Full frontend `npm test` — 15 files / 61 passed; `npm run build` — 110 modules, success. Full backend `python -m pytest tests -q --basetemp .pytest-f15-full` — 61 passed in 14.11s. Final `./init.sh` stopped only at external Hermes pip check missing charset-normalizer before MPS tests.
- Evidence recorded: F15 marked passing in feature_list.json; rollback `/root/backups/mps-frontend-f15-rollback-20260823T124845Z`; served bundle has F15 marker and production API without localhost; deploy/smoke passed. Authorized temporary editor/admin API smoke created a marked post (201), PATCH returned 200 and preserved slug with updated body, DELETE returned 204, GET then returned 404.
- Commits: source `8255d55` pushed; production evidence checkpoint pending.
- Known risks: title PATCH deliberately keeps existing slug URL because backend does not regenerate slug. Production UI role/modal behavior is covered by the served bundle and frontend tests; no interactive Telegram/email browser session was available. VPS has pre-existing/unattributed untracked `.deploy-backups/`, `frontend/app/.env.production`, `venv.py310.failed/` and `\\/`; they were not modified or cleaned.
- Next best action: F14 Phase 2 image upload in a new feature/session. Do not touch the noted VPS untracked paths without separate investigation/approval.

### Session 43 — 2026-08-23 (Codex, final state checkpoint)
- Completed: F14 rich-text composer полностью на production (modal composer, Bold-space hotfix), его UI-серия (подзаголовок, без `fishka`, единый «Статьи», CTA после comments), configurable comments moderation default-off и UI лайков в Feed/article с local toggle.
- Production evidence: code revision `d042d46` deployed frontend-only; served JS includes like marker and production API, `deploy/smoke.sh` passed, `mps-backend` remained active. Documentation checkpoints `92d7d07` and `9e85aa1` are pushed; the latter restores valid feature_list JSON.
- Verification baseline: likes targeted GREEN 20 passed; frontend full 55 passed; build 110 modules; backend full 61 passed. `./init.sh` stops only at unrelated Hermes `pip check` missing charset-normalizer.
- Next evening scope: (1) frontend UI for edit/delete of an already published article; composer currently supports creation only. (2) F14 Phase 2 image upload in composer: backend `POST /api/v1/media` and nh3 `img[src,alt]` allowlist exist, frontend upload UI does not. (3) Phase 3 multi-image carousel only after Phase 2.

### Session 40 — 2026-08-22 (Codex, F14 final UX fixes and configurable comment moderation)
- Completed F14 delivery: rich-text TipTap composer сохраняет разрешённый HTML, открывается только в modal, а не inline в Feed; критичный Bold-space regression исправлен заменой ручного `setContent` на штатный TipTap `onUpdate`.
- Completed UI series: общий подзаголовок ленты заменён на «Реальные истории, честные отзывы и разборы направлений — живые впечатления от путешествий»; `fishka` исключена из editor composer; основной фильтр упрощён до неинтерактивного заголовка «Статьи»; CTA «Подобрать тур в боте» на полной статье перенесён после блока обсуждения.
- Completed comment moderation change: key-value setting `comments_moderation_enabled` добавлен со значением по умолчанию `false`; data migration `20260822_0010` явно выставляет `false` на production; `PATCH /admin/settings` меняет настройку. При `false` комментарии сразу `approved` и доступны через GET; при `true` остаются `pending`, а UI сообщает автору «Комментарий отправлен на проверку». Премодерация reviews не менялась.
- Verification: RED→GREEN покрыли pending/approved ветки и UI-feedback; чистая SQLite migration проверена. Полный backend pytest — 61 passed; frontend `npm test` — 15 suites / 51 passed; `npm run build` — success (110 modules). `./init.sh` остановился до MPS tests только на внешнем Hermes `pip check` из-за missing `charset-normalizer` у pdfminer-six/reportlab/requests.
- Production: PostgreSQL upgraded to `20260822_0010`; backend updated/restarted and active; frontend rebuilt с проверенными production VITE API/bot values and deployed; `deploy/smoke.sh` passed. Live API verification toggled `comments_moderation_enabled` through `PATCH /admin/settings`, confirmed a new comment returns `approved` and appears in GET; final setting restored to `false`. Deployed revision `8f8978c`.
- Next best action: read-only diagnosis of why likes are absent on published articles; this scope was not started in the session.

### Session 41 — 2026-08-23 (Codex, F03 likes UI repair)
- Goal: подключить давно готовый backend like-toggle к карточкам ленты и полной статье, не меняя API, БД или production.
- Completed: добавлен `usePostLike`; `App` держит локальный `likes_count` по post id, поэтому успешный toggle немедленно обновляет и ленту, и открытую статью без reload. В Feed и ArticleComments добавлена доступная золотая кнопка-сердце со счётчиком. Гость открывает существующую modal «Войти» до вызова API.
- Verification run: RED — targeted frontend suite упал ожидаемо: отсутствовал button `Нравится: 3` на полной статье. GREEN targeted — 3 files / 20 passed. Final frontend `npm test` — 15 files / 55 passed; `npm run build` — success, 110 modules. Full backend `python -m pytest tests -q --basetemp .pytest-likes-full` — 61 passed in 15.65s. Final `./init.sh` через Git Bash остановился только на внешнем Hermes `pip check` из-за missing `charset-normalizer` до MPS tests.
- Evidence recorded: F03 `ui_likes_evidence` в feature_list.json; clean-state checklist и handoff обновлены.
- Commits: pending `feat: подключить UI лайков к постам (карточка ленты + полная статья)`.
- Known risks: production deploy и live authenticated click не выполнялись — ожидают отдельного подтверждения владельца. Unisender не менялся.
- Next best action: после подтверждения выполнить frontend-only production rollout с backup, VITE/bundle checks, smoke и authenticated live like toggle.

### Session 42 — 2026-08-23 (Codex, likes UI frontend-only production deploy)
- Goal: по явному подтверждению владельца пересобрать и опубликовать UI лайков без изменения backend.
- Completed: текущий DNS production VPS revalidated; preflight подтвердил old revision `8f8978c`, backend active, `.env.production` с production VITE values и `dist`. VPS fast-forwarded до `d042d46`; old dist moved to `/root/backups/mps-frontend-likes-20260823T001009Z`; `npm ci` и `npm run build` completed (110 modules), both production VITE values were verified in `dist`, and localhost API string was absent. `chmod -R a+rX dist` applied. Backend was not restarted.
- Verification run: `/usr/bin/bash deploy/smoke.sh` with `BASE_URL=https://mir.pod-solncem.ru` — `[OK]`. Served nginx asset `/assets/index-DNKgKGJH.js` contains `Нравится:` and `https://mir.pod-solncem.ru/api/v1`, without localhost API; remote revision `d042d46`, `mps-backend` active.
- Evidence recorded: F03 ui_likes_evidence, handoff and clean-state checklist updated.
- Commits: implementation `d042d46`; deployment checkpoint pending.
- Known risks: no authenticated production browser account/session was used, so live visual/click confirmation remains owner-hand-off. Unisender untouched.
- Next best action: Pavel signs in and confirms one real like toggle; if needed, record that manual result without modifying backend.

### Session 39 — 2026-08-22 (Codex, feed filter heading production deploy)
- Goal: убрать избыточные интерактивные табы «Все/Статьи», не меняя API и backend-типы публикаций.
- Completed: лента показывает один неинтерактивный заголовок «Статьи»; data flow и `fishka`/`video_review` support на backend не менялись.
- Verification run: RED — 2 expected failures for absent heading and present buttons; targeted GREEN — 13 passed; final frontend `npm test` — 48 passed; `npm run build` — success, 110 modules. Production frontend-only rollout `d67155c -> 4b17239`: staging bundle verified with production VITE API/bot values and without localhost API; rollback `/root/backups/mps-feed-heading-20260822T151100Z`; `deploy/smoke.sh` — `[OK]`; served JS heading marker verified. Backend diff empty, `mps-backend` not restarted and active.

### Session 38 — 2026-08-22 (Codex, F14 composer typing hotfix)
- Goal: устранить потерю пробелов в Bold-режиме TipTap и уточнить публичный текст/доступные editor-типы публикаций.
- Root cause: нестандартный `EditorContent.onInput` вручную вызывал `setContent(innerHTML, { emitUpdate: false })` на каждом вводе, переписывая документ вне ProseMirror transaction state. RED regression при Bold-вводе `привет мир` зафиксировал ровно один такой вызов.
- Completed: удалён ручной `onInput`; HTML синхронизируется только штатным TipTap `onUpdate`. Подзаголовок ленты заменён на утверждённый общий текст; composer и его общий `PostDraft` больше не допускают `fishka` (video option не существовал и не добавлялся).
- Verification run: targeted — 4 suites / 6 passed; final frontend `npm test` — 48 passed; `npm run build` — success, 110 modules. Commit `7da63d4` pushed to `origin/main`.
- Production deploy: frontend-only VPS rollout `17a1a2d -> d67155c`; staging build с явными VITE API/bot values verified, localhost API absent; previous static dist retained as rollback `/root/backups/mps-f14-typing-hotfix-20260822T145900Z`; `deploy/smoke.sh` — `[OK]`; served JS confirms the new feed subtitle. Backend diff was empty, so `mps-backend` was not restarted and remains active.

### Session 37 — 2026-08-22 (Codex, F14 composer modal production hotfix)
- Goal: убрать навязчивый inline TipTap composer из верхней части ленты и открыть его только по компактному действию editor/admin.
- Completed: composer перенесён в modal overlay; кнопка «Создать публикацию» сохраняет золотой визуальный акцент платформы. Модалка закрывается по Escape, клику на фон и кнопке закрытия; подзаголовок ленты не менялся.
- Verification run: RED — 2 ожидаемых frontend failures (composer был в initial DOM и кнопка отсутствовала); targeted GREEN — 2 passed. Final frontend `npm test` — 46 passed; `npm run build` — success, 110 modules. Production frontend-only deploy: VPS fast-forwarded `c549085 -> 17a1a2d`; staging build с явными VITE API/bot values verified, localhost API absent; previous static `dist` retained as rollback `/root/backups/mps-f14-composer-modal-20260822T143700Z`; `deploy/smoke.sh` — `[OK]`; served JS has composer-modal markers. `git diff c549085 17a1a2d -- backend` was empty, so `mps-backend` was not restarted and remains active.
- Commit: `17a1a2d fix: composer публикации как модальное окно вместо инлайн-формы`, pushed and deployed.

### Session 36 — 2026-08-22 (Codex, F14 production deploy)
- Goal: единый production rollout backend sanitizer и TipTap frontend для F14.
- Completed: rollback backup `/root/backups/mps-f14-20260822T140321Z`; VPS fast-forwarded `fff502a -> c549085`. `mps-backend` restarted; after one short startup refusal loopback `/api/v1/health` returned 200 and service stayed active. Frontend executed `npm ci` and `npm run build` using verified production VITE API/bot settings; bundle contains the required public values and no localhost API; dist permissions were refreshed for nginx.
- Verification run: `deploy/smoke.sh` — `[OK] smoke passed: https://mir.pod-solncem.ru`. Direct authenticated HTTPS `POST /api/v1/posts` created a temporary draft with `<p>test</p><script>alert(1)</script>`; API returned exactly `<p>test</p>`, proving sanitization, and the draft was deleted by trap. A final DB read verified zero remaining F14 smoke drafts; exact VPS revision `c549085`, service active and live new JS bundle confirmed.
- Evidence recorded: feature_list.json → F14 production evidence.
- Commits: deployed code `c837e40`, verification checkpoint `c549085`; deployment record follows.
- Known risks: no media upload/preview/autosave/embeds in this phase. npm ci reports 5 transitive audit findings; no forced dependency upgrade was applied in the rollout.
- Next best action: manually log in as editor and create one real publication to evaluate the writing UX; media upload and advanced editor actions remain separate packages.

### Session 35 — 2026-08-22 (Codex, F14 базовый rich-text редактор)
- Goal: добавить с нуля editor-only composer на TipTap и безопасный HTML pipeline для публикаций без миграции БД.
- Completed: подключены `@tiptap/react`, starter-kit, extension-link и DOMPurify. Editor даёт bold/italic/strike, H1–H3, оба списка, link и blockquote; сохраняет HTML через существующий `POST /posts`. Backend получил явный nh3 allowlist `p/br/strong/em/s/h1-h3/ul/ol/li/blockquote/a[href]/img[src,alt]` для create и patch. Feed, article и public profile повторно санитизируют rich HTML на чтении; legacy plain/Markdown остаётся текстом с переносами. Composer виден только editor/admin. Также frontend понимает фактический API `fishka` и legacy test-fixture `tip`.
- Verification run: backend RED — 1 expected failure (default nh3 сохранял `<code>`); backend targeted GREEN — 3 passed; frontend RED — отсутствующие rich-text компоненты/composer; frontend targeted GREEN — 4 passed. Final frontend `npm test` — 44 passed; `npm run build` — 110 modules, success. Full backend pytest — 59 passed in 12.65s. `./init.sh` via Git Bash остановился только на внешнем Hermes pip check: missing charset-normalizer у pdfminer-six/reportlab/requests, до MPS tests.
- Evidence recorded: F14 → passing in feature_list.json after code commit and push.
- Commits: `c837e40 feat: rich-text редактор публикаций на TipTap (F14, базовое форматирование)` pushed to `origin/main`; documentation checkpoint follows.
- Known risks: no media upload, preview, drafts-editing, autosave, undo/redo UI, embeds or full-screen Substack canvas in this phase. Browser visual verification attempted through agent-browser after reading its skill, but its CLI is absent in this environment; no screenshot claim is made. `npm install` reports 5 transitive audit findings; fixing them is deliberately outside this scoped feature.
- Next best action: owner reviews F14 locally, then explicitly approves a frontend+backend production deployment; follow-on editor phase can add media upload using already allowed `img` tags.

### Session 34 — 2026-08-22 (Codex, F13 production deploy)
- Goal: frontend-only rollout отдельного раздела «Фишки» и упрощённого фильтра ленты.
- Completed: перед изменением сохранён static backup `/root/backups/mps-f13-20260822T130855Z`; VPS fast-forwarded `3d660a0 -> fff502a`. Backend diff был пуст, поэтому `mps-backend` не рестартовался и оставался active. Frontend rebuilt с проверенными production VITE API/bot values; bundle содержит их и не содержит localhost API URL; права `dist` обновлены для nginx.
- Verification run: `deploy/smoke.sh` — `[OK]`; live `/fishki` — HTTP 200. Served JS asset содержит `/fishki` и sidebar «Фишки», а video-filter marker отсутствует; article filter marker присутствует. `GET /api/v1/posts` вернул `[]`, поэтому production не содержит карточек для буквальной визуальной проверки filter; тестовая/искусственная публикация не создавалась.
- Evidence recorded: feature_list.json → F13 production evidence.
- Commits: deployed code `fff502a`; deployment record commit follows.
- Known risks: до появления опубликованных фишек live UI покажет корректное empty state, но не может продемонстрировать filtering на карточках. video-review tab возвращается отдельным scope с реальным контентом.
- Next best action: наполнение платформы реальным контентом или выбрать следующий независимый product/infrastructure scope.

### Session 33 — 2026-08-22 (Codex, F13 «Фишки»)
- Goal: вернуть отдельный раздел «Фишки» в навигацию и убрать из фильтра ленты вводящие в заблуждение вкладки фишек и видеообзоров.
- Completed: добавлен shareable route `/fishki`; desktop sidebar помещает «Фишки» между «Страны» и «Отзывы», mobile sheet тоже содержит пункт, сохраняя прежние три быстрые нижние кнопки. Экран переиспользует Feed/PostCard и показывает только `type=tip`, включая существующие ссылки на автора. Фильтр основной ленты теперь содержит только «Все» и «Статьи». `video_review` не удалён: API, тип и карточка сохранены, UI-вкладка лишь скрыта до появления реального видеоконтента.
- Verification run: RED — 2 F13 tests failed (route fallback, sidebar item absent). GREEN targeted — 11 passed; final frontend `npm test` — 40 passed; `npm run build` — 49 modules, success. Full backend pytest — 58 passed in 11.45s. `./init.sh` остановился только на внешнем Hermes `pip check`: missing `charset-normalizer` у `pdfminer-six`, `reportlab`, `requests`, до MPS tests.
- Evidence recorded: feature_list.json → F13 passing.
- Commits: `feat: раздел Фишки в сайдбаре + упрощение фильтра ленты`.
- Known risks: определять видимость видео-tab по загруженной странице ленты ненадёжно; сознательно выбран предсказуемый UI-only hide. Возврат tab после появления реального video content — отдельный небольшой scope.
- Next best action: дождаться подтверждения Павла на frontend-only production deploy F13; backend restart и migration не нужны.

### Session 32 — 2026-08-22 (Pavel, final production confirmation)
- Goal: зафиксировать пользовательское подтверждение завершённых production F11 и F12.
- Completed: Павел подтвердил вживую единый rollout F11 «Публичный профиль, часть Б»: UserFollow и follow API, реальные счётчики, вкладка «Лайки» и ссылки на профили авторов. F12 «Вход в публичный профиль и UI шапки» также задеплоена и подтверждена скриншотом: клик на avatar/name открывает собственный public profile, как задумано.
- Verification run: для F11 ранее пройдены миграция `20260822_0009`, safe live follow/unfollow smoke и `deploy/smoke.sh`; для F12 — frontend production deploy и `deploy/smoke.sh`. Подтверждённый Павлом F12 flow: header avatar/name → `/users/{own id}`, «Редактировать профиль» открывает существующую modal, меню `...` выполняет copy-link.
- Evidence recorded: delivery records F11 `394df80` и F12 `3d660a0`; подтверждение Павла добавлено в session record и handoff.
- Commits: F11 code `ed9025d`, `dedc865`, `6c09ae4`, `994c072`; F12 code `bdd8962`; deployment records `394df80`, `3d660a0`.
- Known risks: строка «Посмотреть подписчиков · N» и счётчики `N подписчиков · N подписок` пока дублируют информацию; функциональный список подписчиков намеренно не добавлялся. Unisender TCP blocker остаётся внешней инфраструктурной проблемой.
- Next best action: выбрать один отдельный scope — косметически убрать дублирование счётчиков, сделать follower list, решить Unisender routing или наполнить платформу реальным контентом.

### Session 31 — 2026-08-22 (Codex, F12 production deploy)
- Goal: frontend-only deploy входа в собственный public profile и profile-header UI.
- Completed: перед deploy создан backup `/root/backups/mps-f12-20260822T124402Z`; VPS fast-forwarded to `bdd8962`. Backend diff verified empty, поэтому `mps-backend` не перезапускался и всё время оставался active. Frontend rebuilt after positive checks of production `VITE_API_URL` and `VITE_TELEGRAM_BOT_USERNAME`; generated bundle contains both values and no localhost API URL.
- Verification run: `deploy/smoke.sh` against `https://mir.pod-solncem.ru` — `[OK]`. Live `GET /users/1` returned SPA 200; served JS asset verified owner edit, actions menu and copy-link strings. Literal authenticated browser clicks were not run: no user Telegram session is available and no access token or new public smoke account was exposed/created.
- Evidence recorded: feature_list.json → F12 production evidence.
- Commits: code `bdd8962`; deployment record commit will follow.
- Known risks: `navigator.clipboard`/`navigator.share` physical browser permissions require manual user-device smoke; no backend restart or migration was required.
- Next best action: separate plan for followers list or username-handle, if prioritised.

### Session 30 — 2026-08-22 (Codex, F12 profile entry and header UI)
- Goal: перевести вход из шапки на существующий public profile, переиспользовать настройки владельца и довести шапку по Substack-референсу без backend-расширений.
- Completed: name/avatar в desktop-шапке и «Мой профиль» в mobile sheet ведут авторизованного пользователя на `/users/{id}`; гостю по-прежнему открывается login modal. Owner получает «Редактировать профиль», открывающее прежний `Profile` modal, где остаётся logout. Public profile получил компактную композицию name/счётчики/actions/avatar, неактивный текст «Посмотреть подписчиков», owner/visitor actions и доступное меню `...`: clipboard copy, Web Share с copy fallback, Escape/outside close и toast. Username и follower-list намеренно не добавлены.
- Verification run: RED — 2 F12 tests failed before implementation. GREEN targeted — 13 passed; frontend `npm test` — 38 passed; `npm run build` — 49 modules, success; backend full pytest — 58 passed in 17.00s. Final `./init.sh` вне sandbox остановился только на чужом Hermes pre-flight: missing `charset-normalizer` у `pdfminer-six`, `reportlab`, `requests`.
- Visual review: встроенный просмотр подтвердил референсную композицию; agent-browser skill прочитан, но executable отсутствует, поэтому реальный browser screenshot не выполнялся. CSS/DOM сохраняет компактную верхнюю зону, отдельную строку подписчиков, ряд action buttons и underline tabs; mobile перестраивает avatar/actions без горизонтального overflow.
- Evidence recorded: feature_list.json → F12 passing.
- Commits: будет создан `feat: навигация к публичному профилю через шапку + доводка UI`.
- Known risks: production не менялся; для настоящей ссылки «Посмотреть подписчиков» нужны новый API endpoint и view. Username требует отдельного DB field/unique policy/migration.
- Next best action: получить подтверждение Павла на единый F12 production deploy.

### Session 29 — 2026-08-22 (Codex, F11 production deploy)
- Goal: единым rollout задеплоить соцграф, подписки, «Лайки» и ссылки на профили авторов.
- Completed: origin/main и VPS обновлены до `30d65de`; перед изменением создан server-side backup `/root/backups/mps-f11-20260822T115405Z`. PostgreSQL Alembic upgraded `20260820_0008 -> 20260822_0009`; `mps-backend` restarted and readiness passed. Frontend rebuilt with production VITE API/bot variables verified inside generated assets; localhost API URL excluded from bundle; permissions on `dist` refreshed.
- Verification run: `deploy/smoke.sh` against `https://mir.pod-solncem.ru` — `[OK]`; final VPS state: SHA `30d65de`, service active, Alembic `20260822_0009 (head)`, SPA `/users/1` — 200. Safe API smoke completed follow 201 with counter increment, duplicate 409, self-follow 422, unfollow 200 with decrement; both synthetic non-personal accounts were returned to anonymous state.
- Production-data boundary: database currently has `0` published posts and `0` approved comments. Consequently no pre-existing live card can demonstrate the Likes tab or an author click from feed/comment; no production content or approved comments were created solely for smoke. Local F11 frontend/API tests remain the verification for those rendered interactions.
- Known risk: manual Alembic invocation must load `/etc/mps-platform/backend.env`; without it it uses no production DATABASE_URL and fails authentication. The deployment command now used the systemd environment successfully. `./init.sh` external Hermes blocker is unchanged.
- Next best action: seed/approve real editorial content through the normal product workflow, then perform a browser click smoke for Likes/feed/comments when fixtures exist.

### Session 28 — 2026-08-22 (Codex, public profile part B)
- Goal: реализовать соцграф публичного профиля, реальную вкладку «Лайки» и переходы на автора, не выполняя production deploy.
- Completed: UserFollow с составным PK, self-follow CHECK, FK CASCADE и индексом; Alembic `20260822_0009`; POST/DELETE follow с auth, 422 self-follow, 409 duplicate, 404 для anonymous/banned. Public profile отдаёт реальные followers/following counts и viewer-specific `is_following`. UI показывает счётчики и follow/unfollow только для чужого профиля. «Лайки» выводят только published posts пользователя. API post DTO содержит минимальный public author; автор кликабелен в Feed и comments.
- Verification run: RED follow — 2 failed; GREEN profile package — 7 passed. SQLite clean Alembic upgrade до `20260822_0009`; PostgreSQL DDL compile проверяет PK/CHECK/CASCADE. Likes RED — 1 failed, GREEN — 8 profile tests. Author RED KeyError, GREEN posts+profile — 10 passed. Final frontend `npm test` — 36 passed; `npm run build` — 49 modules, success. После обновления local `backend/.env` до official goapi final backend без override — 58 passed in 11.41s.
- Commits: `ed9025d` feat: UserFollow модель и API; `dedc865` feat: UI подписки и счетчиков; `6c09ae4` feat: вкладка Лайки публичного профиля; `994c072` feat: ссылки на профили авторов.
- Known risks: `./init.sh` reached pre-flight and stopped on external Hermes packages missing `charset-normalizer` (`pdfminer-six`, `reportlab`, `requests`). Per approved boundary this is not an F11 blocker. Production is intentionally untouched.
- Next best action: after Pavel’s approval, deploy F11 as one unit with normal backup/smoke workflow.

### Session 27 — 2026-08-22 (Codex, public profile production regressions)
- Goal: завершить часть А публичного профиля и последовательно устранить найденные на production регрессии без ручных правок данных PostgreSQL и без раскрытия secrets.
- Completed: публичный профиль (header + вкладка «Публикации») задеплоен. Исправлены: nginx `/media/` (конфликт alias/try_files, regex precedence и права каталога), PostgreSQL `SELECT DISTINCT + ORDER BY` для стран профиля, а также два варианта несовместимого historical `User.role`.
- Completed: первоначальный `values_callable` устранил production `LookupError` для lower-case `editor`, затем выявил legacy `ADMIN`. Финальный `RoleStorage` TypeDecorator читает оба регистра из существующего VARCHAR и записывает новые роли канонически как lower-case; данные и схема PostgreSQL не менялись. SQL-level role filters не найдены: все проверки прав работают с уже загруженным Python `Role`.
- Completed: ранее закрытые production UI/auth fixes подтверждены в составе состояния: правильные build-time API URL и Telegram bot username, logout, avatar upload, имя вместо technical role, золотой online indicator, toast above modal и email input type. `PostStatus` проверен как internally consistent name-based SQLAlchemy convention (`PUBLISHED`), изменения ему не потребовались.
- Verification run: RED legacy raw `ADMIN` -> ORM `LookupError`; GREEN targeted role tests — 2 passed; full backend pytest — 54 passed. Предыдущий full backend pytest для DISTINCT/profile — 53 passed. `./init.sh` воспроизводимо блокируется до project tests внешним Hermes `pip check` из-за отсутствующего `charset-normalizer` у `pdfminer-six`/`reportlab`/`requests`; MPS source/dependencies не менялись.
- Production: backend commits `5114aaf`, `1942262`, `7e8eb07` pushed and deployed. После каждого relevant deploy `mps-backend` restarted/healthy and `deploy/smoke.sh` passed. `GET /api/v1/users/1/profile` returned 200 with public-only fields. Safe server-side Telegram callback for the legacy ADMIN returned 200; no token, Telegram ID or secret was output.
- Commits: `17c7be2` public profile part A; `276a2b3`, `f9f4c97`, `887583d` media/nginx fixes; `5114aaf` lower-case role fix; `1942262` PostgreSQL DISTINCT/order and PostStatus guard; `7e8eb07` mixed-case role resilience.
- Known risks: Unisender TCP route remains externally blocked; email-code and digest are unavailable despite correct code/configuration. VPS Python remains `3.11.0rc1`. Audit I-06b, I-19a/I-19b, C-05 remain open; I-21 stays deferred to pre-launch.
- Next best action: handle the Unisender egress blocker separately or select a different delivery transport/provider; do not change production firewall without a separate approved diagnosis.

### Session 26 — 2026-08-21 (Codex, production login/profile hardening)
- Goal: диагностировать и точечно устранить production-проблемы авторизации и Profile после первого deploy, сохранив secrets вне чата и Git.
- Completed: production frontend получил build-time `VITE_TELEGRAM_BOT_USERNAME=Reg_Under_the_sun_bot` и `VITE_API_URL=https://mir.pod-solncem.ru/api/v1`; это устранило запросы browser к localhost:8000. Profile получил logout с server-side `POST /auth/logout`, upload avatar через existing media endpoint и PATCH `/me`, отображение user name вместо technical role и золотой online indicator. Toast поднят над modal backdrop, email input стал `type=email`; функциональный RTL-тест покрывает error toast при открытом Profile (визуальный stacking вручную подтверждается live-проверкой).
- Completed: UnisenderGo default переключён с go1 на официальный routing-host goapi с documented override на go1/go2; mailer исправлен с `Authorization: Bearer` на `X-API-KEY`. RED respx mock не принял прежний go1/Bearer request; GREEN и full suite проверяют goapi + exact header и обязательный `from_email` без изменения payload format.
- Production: commits `4804202`, `89a9a6a`, `61f82a0`, `6a40a7d`, `4ef4a07` pushed and applied. Static assets updated; backend at `4ef4a07` restarted, health returned `status: ok`, `mps-backend.service` active and `deploy/smoke.sh` passed. Backup copies of the previous static dist and backend app were created server-side before each deploy.
- Verification run: frontend — 29 tests passed and `npm run build` successful. Backend — targeted RED then GREEN, full `python -m pytest backend/tests -q --basetemp ...` — 48 passed. `./init.sh` ran but its global `pip check` was blocked by the external Hermes Python environment missing `charset-normalizer` for unrelated packages; no project dependency or source workaround was made.
- Security and infrastructure finding: a previously pasted Unisender API key is treated as compromised and must not be used. No secret was read, written or logged. Pavel rotated the key and updated the runtime host, but transport still cannot open TCP to `31.184.200.*:443`: both goapi/go1 timed out before HTTP. UFW allows outgoing traffic, iptables OUTPUT has no blocking rule, and ya.ru/google.com succeeded; this is a selective external route/filtering issue, not an application failure. Email-code and digest remain unavailable pending a HostKey/Unisender routing resolution, SMTP fallback or provider change.
- Next best action: public profile page only after a separate plan/approval; email infrastructure is a separate external follow-up and does not block other platform work.

### Session 25 — 2026-08-20 (Codex, финальная production control point)
- Goal: зафиксировать завершённые audit-доработки, legal-тексты и реальный первый VPS deploy без раскрытия production secrets.
- Completed: I-18, I-20 закрыты; I-21 явно отложен до pre-launch юридической проверки. В Legal опубликованы тексты Политики обработки персональных данных и Пользовательского соглашения (152-ФЗ); реквизиты оператора остаются динамическими public settings. На VPS `https://mir.pod-solncem.ru` развёрнут MPS: изолированные PostgreSQL DB/role и Redis DB 2, backend на `127.0.0.1:8001`, production nginx, certbot, HSTS, systemd backend/digest/backup units, PostgreSQL/Redis автозапуск, ежедневный backup и первый Telegram admin.
- Verification run: frontend tests — 24 passed; frontend build успешен; backend pytest — 47 passed; `./init.sh` — 47 passed. VPS: Alembic до `20260820_0008`; nginx config test успешен; TLS certificate выпущен; `certbot.timer` enabled/active и адресный `certbot renew --dry-run --cert-name mir.pod-solncem.ru` successful; backend active на 8001; первый `mps-backup.service` — `Result=success`, непустой читаемый dump; `deploy/smoke.sh` — `[OK] smoke passed: https://mir.pod-solncem.ru`.
- Evidence recorded: systemd `mps-backend.service`, `mps-digest.timer`, `mps-backup.timer`, `postgresql`, `redis-server` и `certbot.timer` enabled/active; HSTS header получен; один admin создан по server-side `ADMIN_TG_ID` без вывода ID.
- Commits: `3a723c2 fix: deploy MPS backend on port 8001`; `594652d fix: enable HSTS after MPS TLS verification`; `4a1d7aa fix: proxy MPS sitemap and robots`; `786aefb docs: тексты политики персональных данных и пользовательского соглашения (152-ФЗ)`.
- Known risks: на VPS используется уже установленный Python `3.11.0rc1`; это технический долг до планового перехода на поддерживаемый stable Python 3.11+. Relay/Unisender поля остаются незаполненными; I-06b, I-19a/I-19b и C-05 не закрывались этой сессией.
- Next best action: Павел заполняет незаполненные поля напрямую в `/etc/mps-platform/backend.env`, затем выполняет ручную сквозную проверку `docs/TZ.md` §7; не передавать секреты в чат.

### Session 24 — 2026-08-20 (Codex, I-20 legal-compliance)
- Goal: дополнить публичные реквизиты ОГРН, воспроизводимо заполнить чистую БД и проверить ограниченную UI-часть 152-ФЗ.
- Completed: Alembic `20260820_0008` добавляет официальные public settings; Legal показывает оператора (наименование и адрес), формы требуют явного UI-согласия и дают ссылку на policy. I-21 открыт для server-side consent evidence и cookie gating.
- Verification run: RED public settings — 1 failed из-за отсутствия `legal_ogrn`; targeted backend — 3 passed; frontend tests — 23 passed; build successful; full backend — 47 passed; final `./init.sh` — `pip check` без конфликтов, 47 passed.
- Next best action: I-21 только по отдельному продуктовому решению.

### Session 23 — 2026-08-20 (Codex, audit I-20)
- Goal: убрать фиктивные юридические и контактные данные из production UI без внесения реальных данных в репозиторий.
- Completed: `legal_name`, `legal_inn`, `contact_email`, `contact_phone`, `contact_address` записываются через существующий защищённый `PATCH /admin/settings`. Публичный `GET /settings/public` выдаёт только эти пять ключей. Footer и About получают settings по API, показывают настроенные значения и скрывают блоки при пустой конфигурации.
- Verification run: baseline `./init.sh` — 46 passed; RED backend `python -m pytest tests/test_admin.py -q --basetemp .pytest-i20-red` — 1 failed: `GET /settings/public` вернул 404; RED frontend — фиктивный `ИП Иванова И.И.` присутствовал в DOM; targeted backend — 3 passed; targeted frontend — 2 passed; full frontend — 6 files, 23 passed, build successful; full backend — 47 passed; final `./init.sh` — `pip check` без конфликтов, 47 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-20; backend test доказывает whitelist без `cta_bot_url`, frontend test — отсутствие placeholders и отображение настроенных значений.
- Commits: будет создан `fix: audit I-20 — публичные настраиваемые реквизиты`.
- Known risks: полноценного admin UI пока нет; до его реализации реквизиты задаются защищённым backend admin API. Валидация формата email/URL относится к согласованной следующей подзадаче I-19a/I-19b.
- Next best action: ручной VPS deploy либо отдельный план I-19a; не подставлять реальные данные в исходники.

### Session 22 — 2026-08-20 (Codex, audit I-18)
- Goal: сделать первый nginx/certbot bootstrap воспроизводимым и дать digest service production environment до VPS deploy.
- Completed: добавлен HTTP-only `deploy/nginx.pre-cert.conf` с ACME challenge и `YOUR_DOMAIN`; `DEPLOY.md` задаёт порядок bootstrap → `certbot certonly --webroot` → HTTPS config. `mps-digest.service` запускается как `mps:mps` и читает `/etc/mps-platform/backend.env`.
- Verification run: baseline `./init.sh` вне sandbox — `pip check` без конфликтов, 44 passed; RED `python -m pytest tests/test_deploy_bootstrap.py -q --basetemp .pytest-i18-red` — 2 failed: отсутствовал pre-cert template, digest не содержал User/Group/EnvironmentFile; targeted `--basetemp .pytest-i18-target-final` — 2 passed; final `python -m pytest tests -q --basetemp .pytest-i18-full-final` — 46 passed; final `./init.sh` вне sandbox — `pip check` без конфликтов, 46 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-18; тест фиксирует HTTP-only template без SSL/certificate paths и production service account/environment для digest.
- Commits: будет создан `fix: audit I-18 — deploy bootstrap (nginx pre-cert, digest unit)`.
- Known risks: реальный `nginx -t`, certbot и запуск digest требуют VPS и credentials; они намеренно не выполнялись локально.
- Next best action: отдельный план I-20; не начинать его без нового подтверждения.

### Session 21 — 2026-08-20 (Codex, audit I-13)
- Goal: синхронизировать локальный state Profile с существующим пользователем после login без перезаписи draft на том же user ID.
- Completed: `Profile` сбрасывает name, bio и anonymous только при изменении `user.id`. Email и Telegram login уже reload `/me`; после перехода anonymous → user форма сразу показывает сохранённые поля и больше не может отправить пустые defaults.
- Verification run: RED `npm run test:quiet -- src/components/Profile.test.tsx` — 1 failed: после rerender name остался пустым вместо «Павел»; frontend `npm run test:quiet` — 5 files, 21 passed; `npm run build` — 48 modules, успешно; full `python -m pytest tests -q --basetemp .pytest-i13-full` — 44 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 44 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-13; `Profile.test.tsx` проверяет rerender без unmount и существующие name/bio/anonymous.
- Commits: будет создан `fix: audit I-13 — синхронизация Profile state после login`.
- Known risks: state намеренно синхронизируется по ID, не по каждому обновлению user object; это сохраняет незавершённый draft пользователя.
- Next best action: VPS deploy по `DEPLOY.md` либо отдельная оценка следующего audit-пункта.

### Session 20 — 2026-08-20 (Codex, audit I-06a)
- Goal: устранить возможность закрыть JSON-LD script через данные Article, не расширяя scope до общей sanitization policy.
- Completed: `json_ld()` сериализует Article через `json.dumps()` и кодирует `<`, `>` и `&` Unicode escapes перед HTML embedding. I-06b оставлен открытым: post.title/excerpt, forum title/body, QA question/answer, profile name/bio и review author name требуют продуктового решения о допустимом содержимом.
- Verification run: RED `python -m pytest tests/test_seo.py -q --basetemp .pytest-i06a-red` — 1 failed: raw `</script><script>window.__injected…</script>` присутствовал в HTML; targeted `python -m pytest tests/test_seo.py -q --basetemp .pytest-i06a-target` — 3 passed; full `python -m pytest tests -q --basetemp .pytest-i06a-full` — 44 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 44 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-06a; `test_json_ld_escapes_html_significant_characters` проверяет отсутствие raw injection, escaped `<`/`>`/`&` и корректный JSON parsing с исходными значениями.
- Commits: будет создан `fix: audit I-06a — безопасное экранирование JSON-LD`.
- Known risks: I-06b не реализован намеренно; этот фикс защищает JSON-LD, но не вводит единую policy sanitization для остальных boundary.
- Next best action: VPS deploy по `DEPLOY.md` либо отдельное согласование I-06b.

### Session 19 — 2026-08-20 (Codex, audit I-16)
- Goal: сделать повторную moderation и internal QA-answer идемпотентными до VPS deploy.
- Completed: повторное одинаковое moderation решение возвращает `200` без нового notification; противоположное решение после final state возвращает `409`. QA retry возвращает `200` только при точном равенстве `answer` и `answered_by_name`; любой отличающийся payload возвращает `409` и сохраняет первый ответ/автора.
- Verification run: RED `python -m pytest tests/test_comments.py tests/test_reviews.py tests/test_qa.py -q --basetemp .pytest-i16-red` — 3 failed: все conflicting retries возвращали `200`; targeted `python -m pytest tests/test_comments.py tests/test_reviews.py tests/test_qa.py -q --basetemp .pytest-i16-target-final` — 9 passed; full `python -m pytest tests -q --basetemp .pytest-i16-full` — 43 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 43 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-16; tests фиксируют отсутствие duplicate notifications, `409` для противоречащей moderation/QA и строгое сравнение QA answer/author.
- Commits: будет создан `fix: audit I-16 — идемпотентность moderation и qa-answer`.
- Known risks: `409` — намеренное breaking change для клиентов, которые раньше перезаписывали уже принятые решения или ответы; приблизительное сравнение QA payload не применяется.
- Next best action: VPS deploy по `DEPLOY.md` либо отдельная оценка следующего audit-пункта.

### Session 18 — 2026-08-20 (Codex, audit I-15)
- Goal: применить forum lock и сохранять ID нового сообщения в notification.
- Completed: закрытая тема отклоняет `POST /topics/{id}/messages` с `423` до записи; открытая тема делает `flush()` и сохраняет фактический ID forum message в notification payload.
- Verification run: RED `python -m pytest tests/test_forum.py -q --basetemp .pytest-i15-red` — 2 failed: locked topic вернул `201`, notification содержал `message_id: null`; targeted `python -m pytest tests/test_forum.py -q --basetemp .pytest-i15-target` — 3 passed; full `python -m pytest tests -q --basetemp .pytest-i15-full` — 40 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 40 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-15; `test_forum_rejects_messages_in_locked_topic` проверяет `423` и отсутствие записи/notification, success-path проверяет payload с фактическим message ID.
- Commits: будет создан `fix: audit I-15 — forum lock и message id`.
- Known risks: `423` намеренно меняет прежнее неявное разрешение на точный API-отказ для закрытых тем; миграция не нужна.
- Next best action: I-16 — идемпотентность повторной moderation/answer.

### Session 17 — 2026-08-20 (Codex, audit I-01)
- Goal: устранить ложный success подписки при отказе Unisender до VPS deploy.
- Completed: `POST /api/v1/subscribe` возвращает контролируемый `502` с русским сообщением, если `send_confirm()` не принял письмо. Неподтверждённая подписка и её confirm-token сохраняются; повторный запрос использует тот же токен.
- Verification run: RED `python -m pytest tests/test_subscribe.py -q --basetemp .pytest-i01-red` — 1 failed, endpoint вернул ложный `201` при Unisender `503`; targeted `python -m pytest tests/test_subscribe.py -q --basetemp .pytest-i01-target` — 3 passed; full `python -m pytest tests -q --basetemp .pytest-i01-full` — 39 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, pytest exit 0.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-01; `test_subscription_reports_unisender_delivery_failure_without_losing_token` фиксирует Unisender `503` → API `502`, persisted unconfirmed subscription и неизменный token при retry.
- Commits: будет создан `fix: audit I-01 — честный отказ подписки`.
- Known risks: delivery state/outbox и отложенный retry не добавлялись; пользователь выполняет retry вручную, а существующая запись остаётся unconfirmed.
- Next best action: I-15 — применить forum lock и записывать ID сообщения в notification.

### Session 0 — 2026-08-18 (Claude, подготовка)
- Goal: собрать обвязку проекта по методике Harness Engineering.
- Completed: AGENTS.md, init.sh, feature_list.json (F01–F10), документы docs/ (ТЗ, спека, роадмап, решения встречи, аудит фронта), промпты P00–P10.
- Verification run: json-валидация feature_list.json — OK; кода ещё нет.
- Evidence recorded: —
- Commits: первый коммит делает Павел после копирования в репо.
- Known risks: подписка Codex до конца месяца — M2 в приоритете; Telegram-релей зависит от доступа к боту «Под солнцем».
- Next best action: сессия P01 в Codex (фича F01) — фронтенд уже в репо, шаг 2 README выполнен.

<!-- Каждая следующая сессия добавляет запись НИЖЕ по этому же шаблону -->

### Session 1 — 2026-08-18 (Codex, F01)
- Goal: реализовать каркас async FastAPI-бекенда и проверяемый health endpoint.
- Completed: созданы app factory, Settings через pydantic-settings, async SQLAlchemy engine/session/Base, async Alembic и начальная пустая миграция, `GET /api/v1/health`, test app на aiosqlite, `.env.example`, `.gitignore` и requirements. `init.sh` скорректирован, чтобы штатно запускать pytest из `backend/`.
- Verification run: `python -m pip install -r backend/requirements.txt` — успешно; `DATABASE_URL=sqlite+aiosqlite:///:memory: python -m alembic upgrade head` — upgrade до `20260818_0001`; `python -m pytest backend/tests -q` — `1 passed in 0.27s`; локальный Uvicorn + GET `/api/v1/health` — `{"status":"ok","version":"0.1.0"}`; `./init.sh` — `[OK] Верификация прошла`, `1 passed in 0.26s`.
- Evidence recorded: feature_list.json → F01.evidence.
- Commits: будет создан локальный коммит `F01: каркас бекенда [passing]`.
- Known risks: миграция подтверждена на SQLite in-memory; подключение к реальному PostgreSQL остаётся задачей среды деплоя.
- Next best action: F02 — реализовать авторизацию Telegram/email с JWT и ролями.

### Session 2 — 2026-08-18 (Codex, F02)
- Goal: реализовать пользователей, Telegram/email авторизацию, JWT и роли.
- Completed: модель users и миграция с CHECK identity, проверка Telegram Login HMAC и auth_date, JWT access/refresh с httpOnly cookie, Redis email-коды, `/me`, профиль, роли, presence middleware и auth rate limit.
- Verification run: SQLite Alembic upgrade до `20260818_0002`; `python -m pytest backend/tests -q` — `5 passed in 0.37s`; `./init.sh` — `[OK]`, `5 passed in 0.55s`.
- Evidence recorded: feature_list.json → F02.evidence.
- Commits: будет создан локальный коммит `F02: авторизация и роли [passing]`.
- Known risks: fakeredis выбран для тестов, так как redis-server отсутствует; production использует Redis URL из .env. Mailer намеренно логирует отправку до F05.
- Next best action: F03 — публикации и лайки.

### Session 3 — 2026-08-18 (Codex, F03)
- Goal: завершить публикации, видеообзоры, лайки и загрузку изображений.
- Completed: добавлены countries/posts/post_likes и Alembic revision `20260818_0003`; CRUD публикаций для editor, публичная лента и просмотр, toggle-like, slug с транслитерацией/коллизией, обязательный `shot_at` для video_review, Pillow upload JPEG/PNG/WebP с лимитом 10 МБ. PATCH теперь принимает частичный payload и сохраняет инвариант видеообзора. `MEDIA_DIR` поступает из Settings и изолирован в тестах.
- Verification run: `python -m pytest tests/test_posts.py tests/test_media.py -q --basetemp .pytest-tmp` — 7 passed; `DATABASE_URL=sqlite+aiosqlite:///:memory: alembic upgrade head` — upgrade до `20260818_0003`; `python -m pytest tests -q --basetemp .pytest-tmp-full` — 12 passed; `./init.sh` через Git Bash — `[OK]`, 12 passed.
- Evidence recorded: feature_list.json → F03.evidence (коды reader/editor CRUD, video validation, likes/views, partial PATCH, slug и media).
- Commits: локальный `F03: публикации [passing]`.
- Known risks: в production media должны отдаваться nginx, а видео v1 остаются URL без транскодинга; это не проверялось локально.
- Next best action: F04 — отзывы, комментарии, премодерация и реакции.

### Session 4 — 2026-08-18 (Codex, F04)
- Goal: реализовать отзывы, комментарии, модерацию, реакции и выдачу bot review-token.
- Completed: добавлены reviews/comments/comment_reactions/review_tokens/notifications и миграция `20260818_0004`; public approved-only списки, создание pending, editor moderation с pending_count, notifications автору при approve, реакции с заменой emoji, ответы только одного уровня. `/internal/review-tokens` защищён `BOT_BRIDGE_SECRET`; token одноразовый и действует 7 дней.
- Verification run: `python -m pytest tests/test_reviews.py tests/test_comments.py -q --basetemp .pytest-f04-target` — 4 passed; `DATABASE_URL=sqlite+aiosqlite:///:memory: alembic upgrade head` — upgrade до `20260818_0004`; `python -m pytest tests -q --basetemp .pytest-f04-full` — 16 passed; `./init.sh` через Git Bash — `[OK]`, 16 passed.
- Evidence recorded: feature_list.json → F04.evidence (pending visibility, roles, approve/reject, nested reply, reactions, token 201/404/410 и notifications).
- Commits: локальный `F04: модерация [passing]`.
- Known risks: review token пока возвращается внутреннему bot bridge без deep-link сборки; её доставка клиенту — интеграционный поток F05. Уведомления сохраняются, API чтения будет F08.
- Next best action: F05 — email double opt-in, дайджест и Telegram-релей вопросов.

### Session 5 — 2026-08-18 (Codex, F05)
- Goal: подписки, дайджест и вопросы Telegram.
- Completed: subscriptions/questions, Alembic 0005, Unisender Go client, digest job/timer, Q&A relay, bot bridge router.
- Verification run: target 4 passed; Alembic 0005; full pytest 20 passed; init.sh 20 passed.
- Evidence recorded: feature_list.json F05.
- Commits: F05: подписки и вопросы [passing].
- Known risks: systemd units не установлены на VPS; aiogram router должен быть подключён Павлом в существующем боте.
- Next best action: F06.

### Session 6 — 2026-08-18 (Codex, F06)
- Goal: форум по странам, темы, сообщения и лимиты.
- Completed: forum_topics/forum_messages, migration 0006, countries/topics/messages API, reader/premium limit 3, editor/admin unlimited, notification автору темы.
- Verification run: fresh Alembic -> 0006; F06 test 1 passed; full pytest 21 passed; init.sh 21 passed.
- Evidence recorded: feature_list.json F06.
- Commits: F06: форум [passing].
- Known risks: prefix search is MVP only; replace with PostgreSQL full-text at scale.
- Next best action: F07.

### Session 7 — 2026-08-18 (Codex, F07)
- Goal: добавить один автоматический ИИ-ответ Иришки в старые темы форума без ответа.
- Completed: Alembic `20260818_0007` создаёт settings и служебного editor-пользователя «Иришка · ИИ-помощник». `services/irishka.py` читает `irishka_enabled` и `irishka_delay_min` из БД, вызывает OpenAI-совместимый MiniMax `/chat/completions`, создаёт `is_ai` сообщение только в теме без сообщений; ценовые/визовые темы переадресует менеджеру и создаёт Question. AsyncIOScheduler запускает задачу каждые 5 минут в FastAPI lifespan.
- Verification run: fresh SQLite Alembic upgrade до `20260818_0007`; `python -m pytest tests/test_irishka.py -q --basetemp .pytest-f07-check` — 5 passed in 0.92s; `python -m pytest tests -q --basetemp .pytest-f07-full-check` — 26 passed in 5.26s; `./init.sh` вне sandbox — `[OK]`, 26 passed in 5.35s.
- Evidence recorded: feature_list.json → F07.evidence.
- Commits: будет создан `F07: Иришка [passing]`.
- Known risks: production requires a non-empty `MINIMAX_API_KEY`; otherwise httpx rejects the empty Bearer header. Scheduler runs in API process, so deployment must keep one scheduler instance.
- Next best action: F08 — admin settings endpoint can expose `irishka_enabled` without redeploy.

### Session 8 — 2026-08-18 (Codex, F08)
- Goal: реализовать админскую статистику, модерацию, бан пользователей, настройки, online-панель и API уведомлений.
- Completed: добавлены admin-only `GET /admin/stats`, единая очередь pending отзывов/комментариев, пагинированный `GET /admin/users`, бан через `PATCH /admin/users/{id}` и `PATCH /admin/settings` для CTA и `irishka_*`. Добавлены `/online` (120 секунд, без анонимов, max 12), пагинация уведомлений и пометка всех/выбранных собственных уведомлений прочитанными. Premium не получил отдельной логики.
- Verification run: `python -m pytest tests/test_admin.py tests/test_presence.py -q --basetemp .pytest-f08-target` — 4 passed; `python -m pytest tests -q --basetemp .pytest-f08-full` — 30 passed; `./init.sh` — 30 passed, `[OK]`.
- Evidence recorded: feature_list.json → F08.evidence (403 reader, полный набор метрик, top-5 по views, online, notifications ownership).
- Commits: будет создан `F08: админка и статистика [passing]`.
- Known risks: top_posts учитывает все публикации по текущей спецификации, включая draft; если продукту нужна только опубликованная выборка, это отдельное уточнение.
- Next best action: F09 — подключить утверждённый frontend к готовому API, не меняя Claude Design-разметку.

### Session 9 — 2026-08-18 (Codex, M3 review hardening)
- Goal: устранить замечание M3 Maintainability и добавить pre-flight dependency/network guardrails перед M4.
- Completed: F06 forum endpoints и F07 `irishka.run()` отформатированы и снабжены контрактными docstrings без изменения поведения. `init.sh` теперь запускает `python -m pip check` перед pytest. Глобальный strict `respx` fixture блокирует незамоканный HTTPX до сетевого соединения; отдельный тест фиксирует этот контракт, а F07 MiniMax mocks остаются рабочими.
- Verification run: `python -m pytest tests/test_network_guard.py tests/test_forum.py tests/test_irishka.py -q --basetemp .pytest-m3-guard-target` — 7 passed; `python -m pytest tests -q --basetemp .pytest-m3-review-full` — 31 passed; `./init.sh` — `No broken requirements found`, 31 passed.
- Evidence recorded: evaluator-rubric.md → M3 Maintainability re-evaluation.
- Commits: будет создан `fix: M3 review — maintainability + dependency/network guardrails`.
- Known risks: strict respx fixture защищает HTTPX-клиенты; при добавлении другого HTTP-клиента ему потребуется собственный no-network guard.
- Next best action: F09 — подключить утверждённый frontend к готовому API, не меняя Claude Design-разметку.

### Session 10 — 2026-08-18 (Codex, F09a1)
- Goal: перенести в Vite+React каркас Claude Design, основной журнал, форум и article/comments до API/auth-этапа.
- Completed: создан frontend/app (Vite + React + TypeScript) с компонентами Layout, Feed, Forum и ArticleComments. Сохранены dark/light themes, анимации, desktop sidebar/presence, mobile sheet/nav, feed cards для article/tip/video, страны/тема и Иришка. Комментарии используют F04 API-contract `author`, aggregate `reactions`, `my_reaction` и POST toggle.
- Verification run: `cd frontend/app && npm install && npm run build` — Vite production build (36 modules) зелёный вне sandbox; визуальная сверка с dc-референсом Layout/Feed/Forum/article-comments в обеих темах и на 375px; `python -m pytest backend/tests/test_comments.py -q --basetemp .pytest-f09a1-comments` — 2 passed; полный `python -m pytest backend/tests -q --basetemp .pytest-f09a1-full` — 31 passed; `./init.sh` вне sandbox — pip check и 31 passed.
- Evidence recorded: feature_list.json → F09a1.evidence.
- Commits: будет создан `F09a1: каркас и журнал [passing]`; в push также войдёт уже готовый `75090d8 fix: F04 comment reactions contract for frontend`.
- Known risks: email/Telegram login, общий API client/hooks, реальные данные Reviews/Subscribe/QA/Profile/Notifications/About и сквозной сценарий перенесены в F09a2/F09b по утверждённой разбивке. В F09a1 login button — элемент дизайна, не auth-flow.
- Next best action: представить план F09a2 и ждать подтверждения пользователя.

### Session 11 — 2026-08-18 (Codex, F09a2)
- Goal: перенести оставшиеся Claude Design разделы и расширить навигацию, не заходя в API/auth F09b.
- Completed: добавлены Reviews, Subscribe, QA, Profile, Notifications, About, Legal и CookieBanner; Layout получил полный desktop/mobile navigation, notifications popover, profile/Q&A modal, юридический footer и QR-announce. Добавлена hash-навигация для воспроизводимой проверки экранов. В storage остаются только `mps-theme2` и `mps-cookie-consent`; reviews/subscribe/QA/profile/notifications используют только локальный presentation-state до F09b.
- Verification run: `cd frontend/app && npm run build` — 44 Vite modules, 928ms; визуальная сверка новых разделов и F09a1 regression на Vite :5173 в обеих темах и 375px; `rg -n localStorage frontend/app/src` — только theme/cookie keys; `python -m pytest backend/tests -q --basetemp .pytest-f09a2-full` — 31 passed in 6.77s; `./init.sh` вне sandbox — pip check и 31 passed.
- Evidence recorded: feature_list.json → F09a2.evidence.
- Commits: будет создан `F09a2: остальные разделы дизайна [passing]`.
- Known risks: реальные profile/notifications/reviews/subscribe/QA данные, email/Telegram login, JWT refresh и общие hooks не реализованы намеренно — это отдельная F09b.
- Next best action: представить план F09b и ждать подтверждения пользователя.

### Session 12 — 2026-08-18 (Codex, F09b)
- Goal: подключить перенесённый React-дизайн к REST API и email-авторизации.
- Completed: добавлены memory-only JWT client с refresh/retry 401, hooks auth/posts/reviews/comments/subscribe/QA/forum/notifications/online; реальные API подключены к компонентам. Email-код — рабочий UI-flow, Telegram-кнопка использует VITE_TELEGRAM_BOT_USERNAME, роль приходит из `/me`, dev role switch ограничен `import.meta.env.DEV`. Флаги стран берутся из фиксированного frontend-справочника. Отдельный commit `143e813` исправил F06 messages response: author и is_ai.
- Verification run: `python -m pytest tests/test_f09b_api_flow.py -q --basetemp .pytest-f09b-flow-final` — 1 passed: SQLite+fakeredis ASGI flow covers TZ §7.1–6, email code/JWT/refresh, reader `/me`, posts/reviews/comments/QA/forum, with explicit Unisender/Telegram respx mocks. Full `python -m pytest tests -q --basetemp .pytest-f09b-full-final` — 33 passed in 9.64s; `npm run dev -- --host 127.0.0.1` — Vite ready at :5173; `npm run build` — 46 modules, 1.11s; `./init.sh` — pip check, 33 passed.
- Evidence recorded: feature_list.json → F09b.evidence.
- Commits: `143e813 fix: F06 forum messages contract for frontend`; далее будет `F09b: подключение API и авторизации [passing]`.
- Known risks: финальная браузерная проверка с живым Postgres/Redis остаётся ручным smoke Павла на локальной машине или при F10; принятая эквивалентная ASGI SQLite+fakeredis API-верификация полностью пройдена. Внешние Telegram/Unisender/MiniMax намеренно не вызываются, их transport contracts замоканы.
- Next best action: F10 — деплой и production/manual browser smoke.

### Session 13 — 2026-08-18 (Codex, F10)
- Goal: подготовить production deploy, SEO и backup для финальной фичи.
- Completed: добавлены nginx HTTPS/static/API/media template, backend systemd unit, daily pg_dump backup timer, smoke script и DEPLOY.md. SEO endpoints `/sitemap.xml`, `/robots.txt`, bot-specific `/posts/{slug}` OG/meta+Article JSON-LD; обычный browser получает собранный index.html. Добавлена `python -m app.management.create_admin` с email/TG identity и интерактивным вводом без default credentials. Иришка остаётся в FastAPI lifespan, scheduler unit не нужен.
- Verification run: F10 target tests — 4 passed; localhost staging-double `deploy/smoke.sh` — [OK]; shell syntax OK; full pytest — 37 passed; Vite build — 46 modules; `./init.sh` — pip check + 37 passed.
- Evidence recorded: feature_list.json → F10.evidence.
- Commits: будет создан `F10: деплой и SEO [passing]`.
- Known risks: реальные DNS/certbot/HSTS/systemd/pg_dump/production curl и ручная регистрация webmaster выполняются Павлом на VPS по DEPLOY.md. HSTS намеренно закомментирован до первого корректного HTTPS.
- Next best action: Павел выполняет DEPLOY.md и production smoke, затем вручную проходит browser login/click smoke.

### Session 14 — 2026-08-18 (Codex, audit remediation)
- Goal: закрыть три launch blocker из `docs/AUDIT_REPORT.md` до production deploy.
- Completed: F02 email-код теперь реально отправляется через Unisender с атомарной очисткой Redis при отказе; F09b использует официальный Telegram Login Widget и `/auth/telegram`; F10 frontend переведён с hash на pathname/history routing с прямыми статьями и странами, отдельными 404/API-error состояниями.
- Verification run: frontend `npm test` — 4 files, 20 passed; `npm run build` — 48 modules; backend full pytest — 38 passed; storage grep — только theme/cookie-consent.
- Commits: `522a00d` email delivery; `937a6a5` Telegram Widget; текущий `fix: launch blocker — client-side routing по pathname вместо hash`.
- Result: audit-remediation launch blockers завершены; оставшиеся пункты «Важно»/«Желательно» остаются для отдельной приоритизации перед или после реального VPS deploy.

### Session 15 — 2026-08-18 (Codex, C-04/C-06 remediation)
- Goal: исправить confirm URL подписки и сделать PostgreSQL backup unit готовым к первому VPS-запуску без затрагивания C-05 и остальных audit-задач.
- Completed: confirm-письмо ведёт на `BASE_URL/api/v1/subscribe/confirm/{token}`; тест переходит по ссылке из реального HTML payload. Backup использует отдельный `PG_DUMP_URL`, проверяет pg_dump/права/непустой результат, атомарно публикует архив и удаляет файлы старше 14 дней. Systemd пишет понятные `mps-backup: ERROR/OK` в journal и запускает script через `/usr/bin/bash`.
- Verification run: targeted subscribe — 2 passed; `bash -n deploy/backup.sh` — OK; missing-env smoke — явный exit 1; functional backup smoke — непустой файл и rotation OK; full backend pytest — 38 passed; финальный `./init.sh` вне sandbox — pip check + 38 passed.
- Evidence recorded: feature_list.json → F05 C-04 и F10 C-06 audit remediation; DEPLOY.md содержит обязательные VPS `PG_DUMP_URL`, каталог, journal и реальный pg_dump/pg_restore steps.
- Known risks: реальный PostgreSQL/pg_dump/systemd отсутствует в локальной Windows-среде и проверяется Павлом на VPS; C-05 не изменялся.
- Next best action: выполнить DEPLOY.md на VPS и не включать backup timer в доверенный operational state до первого `mps-backup: OK` и успешного `pg_restore --list`.

### Session 16 — 2026-08-18 (Codex, финальная контрольная точка)
- Goal: зафиксировать итоговое состояние проекта перед VPS deploy без изменения логики.
- Completed: F01–F10 и F09a1/F09a2/F09b подтверждены как passing; launch blocker'ы email-кода, Telegram Widget, pathname routing, C-04 и C-06 закрыты; handoff и clean-state checklist приведены к финальному состоянию.
- Commits за день:
  - `784a8d6` F01: каркас бекенда [passing]
  - `840321f` F02: авторизация и роли [passing]
  - `01df04f` F03: публикации [passing]
  - `f108a43` F04: модерация [passing]
  - `1217779` F05: подписки и вопросы [passing]
  - `627cca8` fix: M2 review — bot_bridge deps, docstrings, handoff
  - `bcbbf53` F06: форум [passing]
  - `2f682bd` F07: Иришка [passing]
  - `4d5d8c6` F08: админка и статистика [passing]
  - `ace749f` fix: M3 review — maintainability + dependency/network guardrails
  - `75090d8` fix: F04 comment reactions contract for frontend
  - `d0d8f84` F09a1: каркас и журнал [passing]
  - `0ce03ad` F09a2: остальные разделы дизайна [passing]
  - `143e813` fix: F06 forum messages contract for frontend
  - `12786f3` F09b: подключение API и авторизации [in_progress]
  - `cca76bd` F09b: подключение API и авторизации [passing]
  - `eaa8d4f` F10: деплой и SEO [passing]
  - `3aac1fa`, `ad69967` docs: аудит проекта после F01-F10
  - `522a00d` fix: launch blocker — email-код реально отправляется через Unisender
  - `937a6a5` fix: launch blocker — реальная интеграция Telegram Login Widget
  - `d1fcd5d` fix: launch blocker — client-side routing по pathname вместо hash
  - `a981a5a` fix: launch blockers C-04, C-06 — subscribe link и pg backup
- Verification run: `python -m pytest --basetemp .pytest-final-outside` — 38 passed in 12.23s; `./init.sh` вне sandbox — `No broken requirements found`, 38 passed in 11.90s, `[OK] Верификация прошла`; `feature_list.json` — 12 passing, 0 in_progress.
- Known boundary: C-05 остаётся отдельной security-задачей по ранее утверждённому scope; реальные DNS/certbot/systemd/PostgreSQL backup проверяются при deploy по `DEPLOY.md`.
- Next best action: VPS deploy по `DEPLOY.md` либо выбранная Павлом доработка пунктов «Важно»/«Желательно» и C-05 из `docs/AUDIT_REPORT.md`.
