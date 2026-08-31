# claude-progress.md — журнал прогресса МПС

## Current Verified State

- Current checkpoint (2026-09-01): TOOLING-VITE6 and SEC-HEIF-STOPGAP are both `passing` and production-deployed. Vite 6.4.3 / Vitest 3.2.6 shipped as 06dd1b8 + 07566c8; backend-only stopgap shipped separately as 12203dd. Do not repeat historical pending-release instructions below. Native libheif 1.23.1 has NOT been upgraded or declared fixed.
- Fresh documentation-closeout preflight: `npm audit --registry=https://registry.npmjs.org --json` returned vulnerabilities={}, total=0, exit 0. VPS tracked tree is clean at 12203dd; lockfile versions are Vite 6.4.3 / Vitest 3.2.6. mps-backend active/running, health status=ok, media.py mode 644; PID 1115264 and NRestarts 51 unchanged after deployment recovery. Full suites/build/browser are accepted prior-step evidence, not rerun for these documentation-only edits.
- Retained stopgap verification: RED 10 failed / 4 passed / 6 deselected; media GREEN 20 passed; full backend 158 passed / 0 skipped on disposable migrated PostgreSQL 16; one-job flake8 passed. Production live HEIC, including JPEG MIME/filename disguise, returned 422 with the requested message; JPEG returned 200 and six WebP/AVIF files, public variants decoded successfully. Six test files and one synthetic reader removed, remaining=0. Health/smoke passed; frontend dist hashes unchanged.
- Security audit: all 13 requested categories completed as diagnosis at 07566c8. Reports are outside git: D:/mps-platform-full/security-audit-20260831/report.md and dependencies.md. Completed audit does NOT mean all findings fixed: Critical C1 is mitigated only; High H1/H2 and other findings remain open. No secrets or original sensitive log lines are copied into trackers.
- Highest-priority follow-up: (a) upgrade actually loaded libheif to >=1.23.2, then RED/GREEN restore HEIC and full regression; (b) rotate AUTH_BOT_TOKEN exposed twice in historical logs, verify dependent integrations and log handling; (c) replace VPS Python 3.11.0rc1 with a supported stable patched release and reconcile the 33 package-version differences using a reproducible fresh venv, tests and rollback. None of these follow-up changes is performed or newly authorized by this closeout.
- Known deployment risk: backup umask 077 leaked into checkout and made media.py root-owned 600, causing PermissionError and backend outage on the first restart. Recovery to 644 restored service, but this is a repeatable deploy-workflow defect, not a one-off. Review/fix the deployment script at the next opportunity: scope restrictive umask to backups, verify ownership/modes and service-user readability before restart; keep secrets protected. Intermittent SSH timeouts also delayed recovery.
- Scope/release boundary: this owner-authorized closeout changes only feature_list.json, claude-progress.md and session-handoff.md; commit/push and documentation-only VPS fast-forward are authorized, without runtime deploy/restart. Application revision remains 12203dd; the resulting documentation SHA is verified after commit rather than guessed here. Feature inventory remains 62; only the two released feature records are updated, F47/F48c and other 60 records are unchanged. Known init.sh Win32/global pip-check exceptions and `.codex/skills/*.md` text-rule gap remain unchanged.

### Historical state before the completed Vite/Vitest release (retained evidence)

- Repository root directory: mps-platform/
- Standard startup path: ./init.sh, затем `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Standard verification path: `python -m pytest backend/tests -q`
- Feature state: 61 tracker records. TOOLING-VITE6 is locally `passing` after owner-accepted Stages 1–4 and explicit approval of the final tracker commit and frontend-only release. This is not a claim that the release has already reached production. WIDG-1/WIDG-2, P0-POST-MEDIA, WIDG-4 and the other previously completed features retain their recorded `passing` states. F47 and F48c remain unchanged pre-existing `in_progress` exceptions. The known `init.sh` Win32 Error 5/global pip-check boundary and text-rule `.codex/skills/*.md` gap remain recorded; the shared Python environment was not repaired.
- Local verification state (2026-08-31): Vite 6.4.3 / Vitest 3.2.6 in local commit `06dd1b8`. Owner-accepted Stages 1–3: audit 0, frontend 32 files / 200 passed without edits, production build and dev/HMR passed, real-dist browser light/dark at 375/768/1024/1440 passed 8/8. Fresh Stage 4: audit 0; full backend with isolated PostgreSQL 16 prepared by existing Alembic migrations passed 151 tests / 0 skipped in 55.26s. No backend source or test changes.
- Deploy state: upgrade is local-only, not deployed. HEAD is `06dd1b8`, one commit ahead of the local `origin/main` reference `38c6e07`; only the three Stage 4 trackers are pending. The initial session preflight recorded `38c6e07` on HEAD/origin/VPS before the upgrade. Stage 4 did not reconnect to the VPS or revalidate production health. Historical WIDG-1/WIDG-2 rollout evidence at application SHA `9586caf`, Alembic `20260830_0020`, served bundle and smoke remains in the handoff; do not treat it as a fresh production check.
- Audit boundary: C-05 остаётся отдельно согласованной security-задачей и не менялся; I-01, I-06a, I-13, I-15, I-16, I-18 и I-20 закрыты 2026-08-20. I-21 отложен до pre-launch юридической проверки. I-06b (единая sanitization policy) остаётся открытым и требует продуктового решения о допустимом содержимом полей.
- Auth/UI state: production build uses `https://mir.pod-solncem.ru/api/v1` and `Reg_Under_the_sun_bot`; F27 hides email form/copy, leaving Telegram Login Widget as the sole visible guest path. Re-enable only by setting `EMAIL_LOGIN_ENABLED` after Unisender/HostKey repair. F28 adds owner-only logout through the own public-profile ••• menu; visitors never receive it. F29 production picker accepts current JPEG/PNG/WebP/HEIC/HEIF/AVIF set and permits repeated selection of the same file. Role storage remains compatible with legacy `ADMIN` and current lower-case values.
- Email state: UnisenderGo transport использует официальный default `goapi.unisender.ru` (с возможностью override на go1/go2) и `X-API-KEY`; payload `message/recipients/body/subject/from_email` проверен mock-тестами. Production delivery сейчас заблокирована внешним TCP timeout до сети Unisender `31.184.200.*:443`: goapi и go1 недоступны, при этом ya.ru/google.com доступны, а local UFW/iptables outgoing не блокируют. Email-код и digest не работают до восстановления маршрута или смены транспорта/provider.
- Next best action: выполнить разрешённый отдельный tracker-коммит поверх `06dd1b8` (без amend/squash), push обоих коммитов и frontend-only deploy после read-only preflight и backup. Сверить production VITE/served bundle, неизменный backend PID/health и `deploy/smoke.sh`; сохранить путь/SHA отката и итоговую ревизию. Предыдущие задачи не перезапускать: Сергей уже назначен admin и проверен; Q&A managers получают право ответа через существующую Telegram-группу без site roles/whitelist. Связио остаётся отдельной диагностикой панели: API создания сообщения подтверждён, но вкладка «Чаты», личные уведомления и назначение агента на канал/отдел не проверены без доступа к панели.

- WIDG-1 update: production-deployed `passing`. Commits `6711b0f` and `dc2e89e` are live, Alembic reached `20260830_0020`, backend health and smoke passed, and the public lead form uses the existing managers Telegram relay.
- WIDG-2 update: production-deployed `passing` at application SHA `9586cafe0885941cfcfbd6c4f3bd634751e69680`. Production build/served-bundle checks passed; the real mobile check confirmed WIDG-1 left and Svyazio right without overlap, with clickable fullscreen chat and no page/Svyazio request failures.

- P0-LIGHT-THEME update: production-deployed `passing`. New profiles default to light before React mounts; both saved values remain authoritative and synchronize `theme-color`. Exact light/dark tokens are the source for retained semantic aliases, Inter replaces Manrope, and Playfair Display uses 600/700/900. Header/sidebar/PageCard/right subscriptions rail, warm `--card-soft` inset surfaces and the About-navigation order are live in final application SHA `7ba81997f6dd165350395967f89789283c245918`.

- F37 update: `passing` and production-deployed through Session D. `Post.category` is nullable, published fishki expose/filter by category, `/posts/fishki/categories` drives the dynamic `/fishki` dropdown, and the importer retains its validated dry-run/conflict/idempotency safeguards. Production now contains 145 imported fishki plus one pre-existing fishka. The removed 15-row category has zero rows, is absent from the 12-category API response and is absent from the live dropdown.

- F38 update: `passing`; Packages 1 (`9d18156`), 2 (`a97327c`) and 3 (`21e55ac`) are production-deployed. Package 3 provides direct non-persistent «Иришка ИИ» Q&A with keyword retrieval over the supplied 248-record knowledge base, shared MiniMax timeout/retry transport, and a 10/minute verified-user limit. Duplicate-run protection is now locally completed by F45; the separate admin settings UI remains deferred.
- F39 update: `e688773` is production-deployed; the default public feed excludes fishka server-side while preserving article/video_review, `/fishki` uses the explicit fishka type filter and the UI has a defensive second filter.
- F40 update: `4f868ef` is production-deployed; its frontend bundle passed smoke with production VITE values and no localhost API, and mps-backend remained active without restart.
- F41 update: fully passing and production-activated at `1782b5a`. `POST /api/v1/internal/telegram-webhook` verifies `X-Telegram-Bot-Api-Secret-Token`, parses manager/lawyer replies and persists the existing Question/Notification transition; tg_relay logs and raises token-free failures. Fresh production verification: webhook URL registered, queue 0, no Telegram last error, backend active/healthy, #Q4 manager and #Q5/#Q6 lawyer answered with answer/responder/timestamp/message ID saved.
- F42 update: `3d6ac1c` is production-deployed; a fresh PostgreSQL backup preceded the healthy backend restart and `deploy/smoke.sh` passed. Frontend was unchanged.
- F43 update: `2ffb60d` is production-deployed. A qa_answered click resolves the linked Question, shows the correct manager/lawyer label, opens the corresponding Q&A tab, marks only that notification read and scrolls/highlights the exact thread. `useQA` polls every 30 seconds only while an open Question exists and stops after answer or unmount.
- F44 update: `passing` and production-deployed at `0e49bbe`. Package A makes the deep-link one-shot, replaces the placeholder glyph with an inline bell, adds a frontend-only manager/lawyer acknowledgement and gives agency answers their own dark-red treatment. Package B adds migration `20260826_0015`, owner-only `PATCH /qa/my/archive`, default archived-row exclusion and a confirm-modal. A late Telegram reply clears the archive so F41 remains intact. Full backend 115 passed/3 skipped; full frontend 134 passed; build and production smoke succeeded.
- F45 update: `passing` and production-deployed at `a5186bc`. The scheduler uses a PostgreSQL transaction-scoped advisory lock per topic before MiniMax/Telegram, then locks ForumTopic `FOR UPDATE`, rechecks message existence and commits each topic independently. Migration `20260828_0017` adds `UNIQUE (topic_id) WHERE is_ai IS TRUE`. RED was `([1, 1], 2, 2, 2)`; GREEN is `([1, 0], 1, 1, 1)`. Full backend passed 126 tests with PostgreSQL tests active. Production preflight found 0 topics/0 messages/0 duplicate topics; the verified backup, migration, active health and smoke all passed. Frontend was unchanged.
- F48d update: `passing` and production-deployed at `01c505d`. `frontend/app/src/components/About.tsx` now carries confirmed facts about ООО «Под солнцем»: work since 2003, Coral Travel/Anex Tour/TUI partnerships, travel portfolio, sports-camp expertise and contacts, while preserving the existing structure/design and configured public-setting overrides. RED was 3/3 expected failures; target GREEN was 3/3. Full frontend passed 22 files / 142 tests, build passed, isolated `agent-browser` verified complete unclipped `/about` content, and the production served-bundle/VITE/no-localhost/smoke checks passed without touching or restarting backend.
- F46 update: `passing` and production-deployed at `78890c8`. Admin GET exposes `fishka_submissions_enabled`, `irishka_enabled` and `irishka_delay_min` with false/true/30 effective fallbacks; PATCH persists actual Setting rows. `/countries` renders the controls only for admin, validates delay 1–10080, updates both fields in one request, restores confirmed values after failure and states that direct Q&A is unaffected. RED was one expected backend failure and two expected frontend failures; target GREEN was backend 1/1 and frontend 2/2. Full frontend passed 145 tests and build passed. The first backend full run was 120 passed/7 skipped without `MPS_TEST_POSTGRES_URL`; a temporary PostgreSQL 16 rerun before push passed 127/127 with 0 skipped. The four additional skips were F45 concurrency tests, so the difference was environmental, not an F46 regression. Production backup, backend readiness, served-bundle checks and smoke passed.

## Session Record

### Session 66 — 2026-08-29 (Codex, P0 card-soft inset surfaces)

- Goal: восстановить тёплые вложенные поверхности центральной PageCard без изменения `--bg`, структуры или интерактивности.
- Scope: `.empty-comments`, `video-request`, `article-cta`, `tour-cta`, `subscribe-cta` и `about-contacts` используют `var(--card-soft)`. Кнопки, cookie-banner, notification popover и right rail сохраняют прежние токены. В `design/DESIGN_SYSTEM.md` закреплено различие между inset content surface и `--panel`.
- RED→GREEN: целевой `Feed.test.tsx` сначала failed 1/1 с прозрачным computed background вместо `var(--card-soft)`, затем passed 1/1; весь Feed passed 7/7.
- Final verification: frontend `npm test` — 25 files / 166 passed; `npm run build` — 120 modules, success, только существующее chunk-size warning. Bundled Chromium проверил light/dark на 375/768/1024/1440: 8/8 passed, оба блока точно совпали с `--card-soft` (`#f6f3ec` / `#1c2540`), horizontal overflow 0, theme-toggle reflow 0, focus 2px, reduced-motion 0.01ms. Все восемь screenshots просмотрены и визуально сопоставлены с read-only reference.
- Boundary: локальный frontend/test/docs/tracker commit без backend, API, database, dependencies, push, deploy или production change.

### Session 65 — 2026-08-29 (Codex, P0 light theme)

- Goal: make light the safe default while preserving explicit saved light/dark choices, using the approved Claude Design tokens without moving existing UI elements.
- Reference boundary: `D:/Профессиональный редизайн сайта/Мир под солнцем.dc.html` was used read-only and was not copied into the repository. The existing header, sidebar, central feed/create action and current presence column were retained.
- Completed: added the RED theme contract, immediate pre-React theme bootstrap and matching `theme-color`; installed exact light/dark custom-property sets with compatible aliases; replaced all four Manrope rules with Inter; loaded Playfair Display 600/700/900; themed header → sidebar → center/forms/modals → presence in that order; added focus-visible and reduced-motion coverage; removed `--muted` from small text colors and limited `--gold-ink` to the large hero heading.
- RED→GREEN: the focused App test first failed with received `dark` instead of expected `light`, then passed unchanged after the minimal fallback fix. Full App routing passed 42/42; full frontend passed 24 files / 157 tests; production build passed with 118 modules and only the existing chunk-size warning.
- Browser evidence: bundled Playwright/Chrome rendered light and dark at 375/768/1024/1440 (8 screenshots, 0 failures). Exact tokens, matching meta/storage reload, pre-React light bootstrap, Inter 400/800, Playfair 600/700/900, focus-visible, reduced-motion, no horizontal overflow and no light/dark geometry reflow all passed.
- Scope: frontend theme/test plus the three required trackers only. No external reference copy, dependency, backend, API, database, migration, push, deployment or production change.
- Next best action: await explicit owner approval before any push or deployment.

### Session 64 — 2026-08-29 (Codex, REV-2 production closeout)

- Result: REV-2 and its «Мои отзывы» synchronization fix are production-deployed at `58a49f5038141b967324e581f0856757cba08dd8`; feature status remains `passing`.
- Rollout evidence: frontend rollback `/root/backups/mps-frontend-rev2-mine-fix-58a49f5.tar.gz`, SHA-256 `339b994a0990db83ada5969a01536603b200ebf670e3cfed1fd6b61564d4e75f`; backend remained PID `891354`, active/healthy without restart; public `index-DOiIEML6.js` contained production API/bot values and no localhost API; smoke passed.
- Fresh closeout evidence: production checkout still reported `58a49f5038141b967324e581f0856757cba08dd8`, backend `active` with health `ok`, served-bundle guards passed and `deploy/smoke.sh` returned `[OK]`.
- Scope: tracker-only closeout in `feature_list.json`, `claude-progress.md` and `session-handoff.md`; no application code, dependency, database, migration, production configuration or service change.
- Next session: start with the P0 checklist. The owner referenced a list «см. ниже», but the closeout message contained no actual items; retrieve/confirm that exact list before selecting scope or changing code.

### Session 63 — 2026-08-29 (Codex, REV-2 moderation-state follow-up)

- Goal: fix the live defect where rejecting an own review removed it from the editor queue but left «Мои отзывы» showing the cached pending status.
- Diagnosis: production DB stored `REJECTED`; PATCH moderation and a fresh authenticated `/reviews/mine` serialize `rejected`; `Reviews.tsx` already maps it to «Не опубликован». The defect was isolated to `useReviews.moderate`, which discarded the returned review and updated only `pendingResource`.
- Completed: the backend application remains unchanged; its test now guards rejected status in both PATCH and `/mine`. A new hook regression test proves immediate mine-state replacement, and the minimal frontend change maps the matching cached entry to the review returned by PATCH while retaining the existing queue removal.
- RED→GREEN evidence: backend protective contract passed 1/1. Frontend hook RED failed 1/1 with received `pending` instead of expected `rejected`; hook+UI GREEN passed 2 files/9 tests. Whole `tests/test_reviews.py` passed 8/8; full backend passed `125 passed, 7 skipped`; full frontend passed 24 files/156 tests; production build transformed 118 modules with only the existing chunk-size warning.
- Scope: changed only `backend/tests/test_reviews.py`, new `frontend/app/src/hooks/useReviews.test.tsx`, `frontend/app/src/hooks/index.ts` and the three approved trackers. No backend code, DB, API, migration, `Reviews.tsx`, dependency or secret change.
- Deployment: committed as `58a49f5038141b967324e581f0856757cba08dd8` and frontend-deployed with rollback, served-bundle VITE/no-localhost verification, unchanged backend PID/health and passing smoke; superseded by Session 64 closeout.

### Session 62 — 2026-08-29 (Codex, REV-2 reviews extension)

- Goal: implement only the approved review extension: up to two photos, a 1000-character review limit and persistent statuses for the authenticated author.
- Completed: `review_photos` stores ordered positions 0–1 and backfills legacy `reviews.photo_url`; API responses retain `photo_url` compatibility and add `photo_urls`; GET `/reviews/mine` is authenticated and owner-isolated. The existing review form sequentially reuses POST `/media`, previews/removes up to two files, shows the character counter and displays pending/approved/rejected under «Мои отзывы».
- Verification run: backend RED 4 expected failures → GREEN 4/4; whole review backend target 8/8; isolated Alembic upgrade reached `20260829_0018 (head)`. Frontend RED 3 expected failures → GREEN `Reviews.test.tsx` 8/8. Full backend `125 passed, 7 skipped`; full frontend `23 files, 155 passed`; build transformed 118 modules (only existing chunk-size warning).
- Evidence recorded: `feature_list.json` marks REV-2 `passing` with complete commands/outcomes. Final `./init.sh` rerun reached global pip check then stopped on unrelated shared Hermes/desktop conflicts (including missing `llvmlite` for `numba`); no environment was changed.
- Commits: base REV-2 was committed as `bfab6fe2845d0e780568cf8566be662c993f4d03` and later production-deployed with Alembic `20260829_0018`; the Session 63 follow-up is separately local-only.
- Known risks: cancelled/failed submission can leave uploaded media orphaned; this is the accepted minimal reuse of POST `/media`. Existing global pip-check and F47/F48c remain outside scope.
- Next best action: superseded by Session 63; the base rollout completed, while the follow-up awaits its own push/deploy gate.

### Session 100 — 2026-08-28 (Codex, F48a drafts audit fixes)
- Goal: implement only the approved F48a contracts: prevent foreign staff draft deletion, expose a retryable drafts-list error, and preserve delete confirmation/card on DELETE failure.
- Completed: DELETE `/posts/{id}` now returns 404 only for another author's draft while retaining staff deletion of published posts. Drafts receives the existing resource error/reload state; list errors no longer render as empty, and failed deletes remain in the dialog with the server error. No schema, dependency, secret, push or deployment change.
- Verification run: backend RED returned 204 instead of 404; frontend RED failed two contracts. GREEN target backend was 10 passed and frontend drafts path 3 passed. Full backend was 120 passed/7 PostgreSQL skips without `MPS_TEST_POSTGRES_URL`; full frontend was 22 files/147 passed; production build passed with 118 modules and the pre-existing chunk warning.
- Evidence recorded: `feature_list.json` marks F48a `passing` with exact RED/GREEN commands and outcomes. Final `./init.sh` was rerun outside sandbox and passed installation but stopped at global `python -m pip check` on unrelated Hermes/desktop dependency conflicts before MPS pytest; this environment was not changed, and the MPS suite evidence above remains fresh.
- Commits: pending local-only F48a commit; push and deployment are not authorized.
- Known risks: F47 remains optional, F48b/F48c remain unimplemented, and external Unisender/HostKey delivery plus global Python pip-check conflicts remain outside this feature scope.
- Next best action: F47 optional closeout, then F48b.

### Session 99 — 2026-08-28 (Codex, F46 production closeout and F47–F48 handoff)
- Goal: close the coordinated F46–F48 diagnostic session, preserve Pavel's product decisions and record the fully verified F46 production rollout without changing application code in this closeout.
- Coordination: F46, F47, F48a, F48b and F48c were diagnosed sequentially by sub-agents with inspector acceptance; that relay changed no application code. F46 required clarification that true/30 are runtime fallbacks rather than proof of stored DB defaults. F47 found one SELECT per profiled list endpoint and no N+1. F48a confirmed three draft defects; F48b and F48c confirmed their implementation gaps.
- Decisions: Pavel confirmed the F46 block belongs in `/countries`; review moderation belongs to role `editor`; the subscription email form must be honestly hidden/disabled while Unisender/HostKey delivery is blocked, without retention/outbox/retry or broader email-infrastructure work.
- F46 completed: admin-only forum-autoanswer toggle and delay 1–10080 are persisted through `/admin/settings`; MiniMax configuration, prompt/persona, scheduler cadence, retry/timeout/token policy and direct Q&A were not touched. Commit `78890c8` was pushed and deployed with no migration.
- Verification: RED→GREEN target evidence remains recorded. The first full backend run showed 120 passed/7 skipped because PostgreSQL was absent: 3 existing forum tests plus 4 F45 Irishka concurrency tests. A temporary PostgreSQL 16 full rerun with `MPS_TEST_POSTGRES_URL` present passed 127 tests with 0 skipped in 50.85s, confirming environment variance rather than regression. Full frontend passed 145 tests; build passed. Fresh closeout verification observed VPS/application SHA `78890c8`, backend active/healthy PID 838131, served F46/VITE markers without localhost and `[OK]` smoke.
- Evidence recorded: `feature_list.json` has 53 total records: 49 `passing`, exactly F47/F48a/F48b/F48c `in_progress`. F46 rollback artifacts and SHA-256 values are preserved in its evidence. The named verification and TDD skill files are present in the current checkout and were read/applied; older records describing them as physically absent are historical and stale.
- Commits: application commit `78890c8` is pushed/deployed. This closeout changes only `feature_list.json`, `claude-progress.md` and `session-handoff.md`; it uses the requested documentation commit message after exact staged-name verification.
- Known risks: Unisender/HostKey network delivery remains blocked; npm audit reports 5 advisories. F47 is optional/no runtime fix, F48a/b/c are unimplemented, and web design remains deferred.
- Next best action: F47 optional guard/closeout → F48a → F48b → F48c → deferred web design.

### Session 98 — 2026-08-28 (Codex, F46 Irishka forum admin settings)
- Goal: implement the approved F46 plan only: admin controls in `/countries` for forum autoanswers and delay, persisted in DB, without touching MiniMax, prompt/persona, retry/timeout/token policy, scheduler cadence or direct Q&A.
- RED→GREEN: backend RED failed because GET `/admin/settings` omitted both Irishka fields; frontend RED had two expected failures because admin controls were absent, while the editor no-request/no-control guard already passed. After the minimal implementation, backend target passed 1/1 and frontend target passed 2/2.
- Completed: added a typed admin settings response with effective false/true/30 fallbacks, retained PATCH validation and proved actual DB rows plus subsequent GET. Added an admin-only `/countries` block with toggle, integer delay 1–10080, one PATCH request, explicit forum-only copy, and last-confirmed-state restoration on failure. Editor/non-admin clients do not request the admin endpoint.
- Verification: full backend — 120 passed/7 skipped; full frontend — 22 files/145 passed; `npm run build` — 118 modules, success with the existing chunk-size warning. Final `./init.sh` stopped before MPS tests only at the separately excluded external Hermes/desktop global pip-check; the complete MPS suites passed independently.
- Boundary: no migration or production operation. F46 is marked passing locally. Commit is local only; push/deploy require Pavel's separate confirmation. F47 and F48 remain untouched in this implementation session.

### Session 97 — 2026-08-28 (Codex, F46→F47→F48 coordination diagnosis)
- Goal: a read-only sequential relay with three diagnostic agents and a separate inspector after F46, F47, F48a, F48b and F48c; no application code, tests, production state or deployment changes.
- Completed: F46 accepted after correcting a false persisted-default claim to runtime fallbacks; minimum future UI is an admin-only forum toggle and delay. F47 accepted: query-count profiling observed one SELECT per requested endpoint at 50 returned rows, so no eager-loading production fix is justified. F48a accepted with foreign-draft delete, drafts load-error and delete-failure defects. F48b accepted: Reviews is real but lacks submit/list states and a role decision for moderation UI. F48c accepted after expanded audit of unsubscribe, consent/validation, repeated subscribe, digest failure and escaping contracts; the Unisender outage was recorded as historical, not revalidated live.
- Verification run: `./init.sh` outside sandbox stopped at the known external Hermes/desktop global pip check before MPS tests. `feature_list.json` was parsed after tracker update; `git diff --check` and tracker-only staged-name verification are required before commit. No feature is marked `passing` in this diagnostic session.
- Evidence recorded: all five new records are `in_progress` and carry `inspected: принято` notes, scope and follow-up verification plans. Inspector protocol: F46 required one correction (fallback versus DB default); F47 accepted immediately; F48a required clarification of proposed contracts and then was accepted; F48b accepted immediately; F48c required an expanded contract audit and then was accepted.
- Commits: pending local tracker-only commit; push and deployment are not authorized.
- Known risks: local `main` was already one tracker commit ahead of origin; VPS tracked tree is at `01c505d` and active, but has pre-existing untracked deployment artefacts. Do not clean VPS artefacts in this scope.
- Next best action: Pavel chooses the next isolated implementation scope and confirms a plan; F48c wording/retention choice is mandatory before changes.

### Session 96 — 2026-08-28 (Codex, F48d production closeout)
- F48d: replaced the conditional marketing copy in the existing `About.tsx` structure with confirmed real content about ООО «Под солнцем»: the company was founded and has operated since 2003, works with Coral Travel/Anex Tour/TUI, organizes travel and sports camps/tournaments, and publishes current contacts. Existing route, layout/classes, perks, SunLogo, Telegram CTA and visual design were preserved.
- Verification and rollout: the already recorded RED→GREEN target passed 3/3, full frontend passed 22 files / 142 tests, build passed and local `/about` browser verification found no placeholder, clipping or broken link/image targets. The separately approved production rollout synchronized local/origin/VPS on `01c505d`, created verified rollback `/root/backups/mps-frontend-f48d-20260827T173146Z.tar.gz` with SHA-256 `947cbb4d6f304beaca7748a054afac3c98b7b1d0eabb908c90dcc3c68c4aa17e`, served `index-DnmHxz2e.js` with production VITE values and no localhost fallback, and passed `deploy/smoke.sh`. Backend diff was zero files; PID 805788 remained unchanged and healthy without restart.
- Coordination boundary: a prior attached document prepared a diagnostic relay for F46 (Иришка admin settings UI) and F47 (forum N+1), but Codex did not treat that document as the current task and did not start either feature in this session. It was context only. F46 and F47 remain open, not `in_progress`. F48 a/b/c (Drafts/Reviews/Subscription audit) was likewise not performed; only the separately scoped About work F48d was completed.
- Harness: all current 48 tracker records covering F01–F45 plus F48d are `passing`; F37 Sessions A–D and F48d are production-deployed. This closeout is tracker-only. The agreed TDD and verification-before-completion rules were applied textually because both `.codex/skills/*.md` files remain physically absent.
- Boundary: no application code, dependency, production configuration, database, service or deployment is changed by this closeout. Commit the four tracker/checklist files locally and wait for separate push approval.

### Session 95 — 2026-08-28 (Codex, F48d confirmed About content)
- Goal: replace only the generic `/about` copy with Pavel's confirmed official agency content, preserving the existing layout, perks, SunLogo, Telegram CTA, route and styles.
- RED→GREEN: new `About.test.tsx` initially failed all 3 tests because the ten confirmed content markers were absent, the two old placeholder-style phrases remained and no contact link rendered without public settings. After the minimal component change, the target passed 3/3. The first full run then exposed two stale expectations caused by the intended content change; preserving exact child nodes for configured contact values and updating the old routing heading assertion produced a clean full run of 22 files / 142 tests.
- Implementation: `About.tsx` now renders the confirmed partner heading/subheading, history since 2003, travel portfolio, sports-camp/tournament expertise and Taganskaya availability. The contact block always renders confirmed address, phone and email as fallbacks, while runtime public settings still override each value. No CSS, App routing, backend, database, dependency or design change was made.
- Verification: `npm run build` passed (`tsc -b && vite build`, 117 modules; existing chunk-size warning only). An isolated named `agent-browser` session opened local `/about`; the full text was readable, old placeholder/lorem was absent, all three visible links had nonempty HTTPS targets, images loaded, and heading/body/contacts all reported visible overflow, no line clamp, equal scroll/client heights and `clipped=false`.
- Harness: final `./init.sh` outside sandbox stopped only at the explicitly excluded external Hermes/desktop global `pip check` before MPS pytest. The missing `.codex/skills/verification-before-completion/SKILL.md` and `tdd-fix-workflow/SKILL.md` remain a known checkout gap; their RED-first and fresh-evidence completion rules were applied textually.
- Boundary: F48d is complete locally. Only About content, its directly related regression assertions and trackers changed. No push, deployment or production operation is included; wait for separate owner approval.

### Session 94 — 2026-08-28 (Codex, final closeout F37 Sessions C–D, data cleanup and F45)
- Goal: close the complete approved delivery cycle from F37 Session C through F45 after local TDD, separately authorized production operations and final live verification.
- F37 Session C: embedded an admin-only `fishka_submissions_enabled` settings block directly in `/fishki`. RED was 1 expected failure / 32 passed; GREEN target was 34 passed. Full frontend passed 137 tests, relevant backend regression passed 14 tests and the production frontend rollout at `b2b41fb` passed production-VITE/no-localhost checks plus `deploy/smoke.sh` without restarting the backend.
- F37 Session D: added nullable `Post.category`, category API and dynamic «Тема» filter on `/fishki`, plus 11 new exact Unicode emoji values after exact deduplication. The guarded importer parsed all 160 supplied fishki across 13 categories, supported dry-run/apply, rejected conflicts and was idempotent. Package D1 GREEN was 13 passed; D2 GREEN was 36 passed; full backend was 119 passed/3 skipped, full frontend 139 passed and build succeeded. Code/migration/frontend deployed at `9ab7b0e`; production dry-run planned 160 with no conflicts, apply inserted 160 published rows for `Павел`, and repeat dry-run matched all 160 unchanged.
- Data operation: after exact title/id/slug inventory and owner approval, a fresh verified PostgreSQL backup preceded physical deletion of only the 15 imported records in category `Реальные кейсы Сергея (главное)`. Production now has 145 imported fishki, 146 fishki total and 12 dynamic categories. The category API, exact filter and live dropdown confirm the removed category is absent.
- F45: eliminated the forum autoreply race across concurrent backend runners. The implementation acquires PostgreSQL `pg_try_advisory_xact_lock(namespace, topic_id)` before MiniMax/Telegram, performs a final ForumTopic `FOR UPDATE` plus message recheck, commits per topic and adds partial unique index `UNIQUE (topic_id) WHERE is_ai IS TRUE` as the DB backstop. Real PostgreSQL RED was `([1, 1], 2 calls, 2 rows, counter=2)`; GREEN was `([1, 0], 1, 1, 1)`. Full Иришка target passed 19 tests, full backend passed 126 with PostgreSQL tests active, and isolated Alembic `0016 → 0017 → 0016 → 0017` passed.
- Production closeout: local/origin/VPS are synchronized on `a5186bce67c107dd8912f39361fa15b7fb637351`. Before F45 migration the forum had 0 topics, 0 messages and 0 duplicate AI topics. Verified rollback `/var/backups/mps/mps-2026-08-27-123301.dump.gz` has SHA-256 `3ac9b6d2cfca55f97bb83d549c7d4896c99011ec3f0a293567e49e6054325043`; Alembic is `20260828_0017 (head)`, the partial index is present, backend is active/healthy and smoke passed. F45 changed no frontend files and no frontend build/deploy occurred.
- Harness: all 47 tracker records covering F01–F45 are `passing` and contain evidence. Session-close `./init.sh` again stopped only at the explicitly excluded external Hermes/desktop global pip-check before MPS pytest; complete relevant MPS suites had already passed separately. The agreed TDD and verification-before-completion contracts were applied textually because both referenced `.codex/skills/*.md` files remain physically absent.
- Deferred: Unisender/HostKey networking still blocks email, so visible login remains Telegram-only. F38 admin UI for Иришка settings is unstarted; F45 already closed the race. Forum N+1 is low priority; whole-site search is a separate unstarted backlog item; five npm advisories remain known. Agreed product order is F38 remainder → forum N+1 → drafts/reviews/subscription/about → web design last.
- Boundary: this closeout changes tracker files only. No application code, production state, service, database, frontend, dependency or secret is changed. A follow-up owner message explicitly authorized committing and pushing this documentation checkpoint; it requires no deployment.

### Session 93 — 2026-08-28 (Codex, F45 Иришка concurrency fix)
- Goal: eliminate duplicate background Иришка replies across overlapping scheduler runners without changing scheduler cadence, the interactive Q&A path, frontend or production state.
- RED→GREEN: on a temporary PostgreSQL 16 database, two synchronized runners initially returned `[1, 1]`, called MiniMax twice, inserted two AI messages and left `messages_count=2`. After the fix the same test passed with `[1, 0]`, one provider call, one AI message and `messages_count=1`. The full Иришка target passed 19 tests, including occupied-lock suppression before both MiniMax and Telegram, a human response arriving while MiniMax was blocked, and a concurrent manager trigger producing one relay/Question/message.
- Implementation: each topic is processed in its own transaction. PostgreSQL `pg_try_advisory_xact_lock(namespace, topic_id)` is acquired before external work; a busy lock skips the topic. Before persistence, ForumTopic is selected `FOR UPDATE` and messages are checked again. Migration `20260828_0017` adds partial unique index `uq_forum_messages_one_ai_per_topic` as the final database backstop.
- Migration evidence: isolated PostgreSQL cycle `20260827_0016 → 20260828_0017 → 20260827_0016 → 20260828_0017` passed. The index count was 0 after downgrade and its restored DDL is `UNIQUE (topic_id) WHERE (is_ai IS TRUE)`. Two human messages plus one AI message were accepted; the second AI insert failed with the expected unique-constraint error.
- Verification: full backend with `MPS_TEST_POSTGRES_URL` present — 126 passed in 52.04s, no PostgreSQL skips. Final `./init.sh` stopped only at the known external Hermes/desktop global pip-check before MPS pytest; the complete MPS suite passed separately. The absent `.codex/skills/*.md` files remain an acknowledged gap; their TDD and verification-before-completion rules were applied textually.
- Boundary: production remains at revision `9ab7b0e` and Alembic `20260827_0016`. No push, deployment, production migration, service restart, frontend change, secret or dependency change is included. Next action is explicit approval for push/deploy of the local F45 commit.

### Session 92 — 2026-08-27 (Codex, F37 production fishki data correction)
- Goal: after explicit title-by-title approval, permanently remove only the 15 imported records in category `Реальные кейсы Сергея (главное)` without changing code or the parallel F45 state.
- Pre-delete evidence: an isolated in-memory test import and read-only production inventory returned the same 15 titles. Production exact targets were ids 166–180 with import slugs 146–160; they had zero comments, likes and activity references. `Post` has no soft-delete field, while categories are generated dynamically from published rows.
- Safety and operation: fresh readable PostgreSQL backup `/var/backups/mps/mps-2026-08-27-113206.dump.gz`, SHA-256 `9fff4b720377939eaf55216d32e9fa146a5ae00a690205993e039ec80a7650f1`. The transaction required exact equality of all 15 agreed `id + slug` pairs plus fishka type/category before calling physical DELETE; it removed 15 and left zero target ids/category rows.
- Verification: production contains 145 imported fishki and 146 fishki total. `GET /posts/fishki/categories` returns 12 categories without the removed category; an exact category-filter request returns 0. Live `/fishki` renders 13 options total (`Все темы` plus 12 categories) and does not expose the removed category. No application code, service, schema or F45 priority/state changed.
- Harness: `./init.sh` again stopped only at the known external Hermes/global pip-check. The agreed verification-before-completion and gated dry-run/TDD-style evidence rules were applied textually; their skill files remain an acknowledged checkout gap.
- Next best action: continue F45 race-condition diagnosis; keep this tracker-only commit local until separate push approval.

### Session 91 — 2026-08-27 (Codex, F37 Session D categorized fishki import)
- Goal: add nullable fishka categories, a category filter, the 13 block emoji choices under exact Unicode deduplication and a safe one-time importer for the supplied 160-item content bank.
- Package D1: added migration `20260827_0016`, category model/schema/DTO/query support, `GET /posts/fishki/categories`, the exact versioned TXT source and `app.management.import_fishki`. The parser requires continuous 1–160 numbering and 13 blocks, preserves numbered body text, escapes imported HTML and uses deterministic slugs. Import requires an explicit user whose visible name is `Павел`, supports mandatory `--dry-run`/`--apply`, aborts on conflicts and deliberately emits no 160-item activity flood.
- Package D1 RED→GREEN: collection initially failed on the expected absent importer. Target GREEN — 13 passed. Isolated Alembic verified upgrade to `0016`, downgrade to `0015` and re-upgrade, with nullable category present only at `0016`. Isolated CLI dry-run persisted 0; first apply inserted 160; second apply inserted 0 and matched 160 unchanged; final counts were 160 fishki, 13 categories and 0 activity rows, then the temporary DB was removed.
- Package D2: added the dynamic «Тема» dropdown, server refetch by exact category, nullable category typing and 11 new emoji values. Exact duplicates `🏨` and `📱` were not repeated; `🍽`/`🍽️`, `🗺`/`🗺️` and `🚖`/`🚕` remain separate Unicode strings as approved.
- Package D2 RED→GREEN: 2 expected failures / 34 passed before the combobox and emoji expansion; target GREEN — 36/36. Full backend — 119 passed/3 skipped in 48.30s. Full frontend — 21 files/139 passed. Build — 117 modules, standard chunk warning only. Final `./init.sh` stopped only at the known external Hermes/global pip-check; full MPS suites passed separately.
- Boundary: no production database connection/import, push or deployment. Session D production rollout and the subsequent real 160-row `--apply` are separately authorised steps. The requested skills remain physically absent under `.codex/skills`; their TDD and final-evidence contracts were applied textually.
- Next best action: wait for explicit push/deploy approval; after code deployment and smoke, wait again for explicit production import approval.

### Session 90 — 2026-08-27 (Codex, F37 Session C admin fishka toggle)
- Goal: expose the existing admin-only `fishka_submissions_enabled` setting directly in `/fishki` without backend, schema or production changes.
- Completed locally: added a typed settings hook for GET/PATCH `/admin/settings`, an isolated admin settings component and a compact embedded panel. Only role `admin` activates the resource and renders the checkbox; editor/reader/premium clients make no admin-settings request. PATCH failure leaves the last confirmed value unchanged and shows a Russian error.
- RED→GREEN: initial target `npm test -- --run src/App.routing.test.tsx --reporter=verbose` — 1 expected failure / 32 passed because the checkbox did not exist. After implementation and one test-matcher compatibility correction, target passed 34/34 including admin toggle, editor isolation and failed-PATCH behavior.
- Full verification: frontend 21 files / 137 tests passed; backend `tests/test_admin.py tests/test_posts.py` — 14 passed in 7.23s; `npm run build` — success, 117 modules with the existing chunk-size warning only. Final `./init.sh` outside sandbox exited 1 only at the known external Hermes/desktop global `pip check` before MPS pytest; the shared environment was not changed.
- Boundary: frontend, tests and trackers only. No backend/API/schema/dependency/secret/production change; no push or deployment. `.codex/skills/verification-before-completion/SKILL.md` and `.codex/skills/tdd-fix-workflow/SKILL.md` remain physically absent, so their agreed textual contracts were applied directly.
- Next best action: after owner approval, push the local Session C commit and perform a separately approved frontend-only production rollout with an authenticated admin toggle smoke. Session D remains unstarted and separately scoped.

### Session 89 — 2026-08-26 (Codex, final production closeout F38 Package 3 through F44)
- Goal: close the complete same-day delivery cycle after every approved package was committed, pushed and verified on production.
- F38 Package 3: added the direct, non-persistent «Иришка ИИ» Q&A tab, synchronous MiniMax answers and keyword retrieval over `irishka_knowledge.json` (248 records). The file on production matched the local SHA-256; no-match questions avoid MiniMax. Packages 1–2 already supplied manager notifications plus 30-second transient-only retry/isolation.
- F39: the default public `GET /posts` now selects only `article` and `video_review`; `/fishki` explicitly requests fishka and the Feed has a defensive UI filter.
- F40: reconnected and verified `Reg_Under_the_sun_bot`, configured manager/lawyer destinations, proved outbound delivery in both directions, and repaired the collapsed Q&A textarea with a responsive composer grid.
- F41: replaced the missing incoming transport with secret-protected `POST /api/v1/internal/telegram-webhook`; manager and lawyer Telegram replies are both live-verified end-to-end, while relay error logs redact the bot token.
- F42: shared MiniMax response handling removes a complete leading `<think>…</think>` reasoning block for both interactive Q&A and the forum autoreply without discarding malformed/unclosed content.
- F43: qa_answered notifications display the correct manager/lawyer source, deep-link to the exact Question and poll `/qa/my` every 30 seconds only while an open Question exists.
- F44: fixed the F43 tab-lock regression by consuming the deep-link once; added an inline SVG bell, frontend-only post-submit guidance, a distinct dark-red incoming-answer bubble, and owner soft archive with confirmation. Late Telegram answers clear `archived_at` and restore the thread.
- Production verification: local/origin/VPS synchronized through `0e49bbe`; PostgreSQL Alembic `20260826_0015 (head)`; backend active with health `{status:ok,version:0.1.0}`; served bundle contains production VITE values and no localhost API; `deploy/smoke.sh` passed. F38–F44 are `passing` and deployed.
- Deferred work: F37 Sessions C/D; Иришка forum duplicate-run protection/admin settings UI; low-priority forum N+1 follow-up; five known npm dependency advisories; external Unisender/HostKey email networking. None was modified in this closeout.
- Final harness: `./init.sh` again stopped only at the known external global Hermes/desktop pip-check; no environment repair was attempted. This session changes tracker files only and awaits separate push approval.

### Session 88 — 2026-08-26 (Codex, F44 Q&A UX and soft archive)
- Goal: fix the F43 deep-link tab regression, improve Q&A message clarity and provide safe cross-device history clearing without physical deletion.
- Package A: the linked Question selects its tab only once per modal deep-link, after which Manager, Lawyer and Иришка tabs remain freely selectable. The header uses an accessible inline bell; manager/lawyer submissions immediately show a frontend-only guidance message; agency answers render as separate dark-red incoming bubbles in both themes.
- Package B: `Question.archived_at` and migration `20260826_0015` provide owner-only bulk soft archive through `PATCH /qa/my/archive`. `/qa/my` hides archived Questions. The confirm-modal explains the behavior, and a later Telegram webhook answer clears `archived_at`, preserving F41 and making the answered thread visible again.
- RED→GREEN: Package A RED — 4 expected failures / 33 passed; GREEN — 37 passed. Package B backend RED — 2 expected failures / 14 deselected; frontend RED — 2 expected failures / 5 passed. GREEN backend — 2 passed / 14 deselected; GREEN frontend — 7 passed.
- Full verification: backend — 115 passed / 3 skipped; frontend — 21 files / 134 passed; `npm run build` — success, 116 modules, standard chunk-size warning only; Alembic single head — `20260826_0015`; `git diff --check` — clean.
- Boundary: completed locally only. No push, migration application, deployment, production database/configuration or service state change is authorised in this session. Production requires separate approval and a fresh PostgreSQL backup.

### Session 87 — 2026-08-26 (Codex, F43 Q&A notification deep-link and live refresh)
- Goal: complete the frontend UX loop after the production Telegram webhook answers a Question: accurate notification source, exact-thread navigation and refresh of an already-open modal.
- Completed locally: qa_answered rows resolve `payload.question_id` against `/qa/my`, display «Менеджер…» or «Юрист…», open the matching tab and focus/scroll the linked thread. Only the clicked notification is marked read. A neutral answer label is used if a linked Question cannot be resolved.
- Polling: while QA is mounted and any Question is `open`, `useQA` reloads `/qa/my` every 30 seconds; it stops after all Questions are answered and clears the interval on unmount.
- RED→GREEN: target RED — 3 expected failures / 30 passed (non-interactive notifications and no second Q&A fetch); GREEN — 33 passed. Full frontend — 21 files / 129 tests passed. `npm run build` — success, 116 modules, standard chunk-size warning only.
- Final harness: `./init.sh` stopped only at the known external Hermes/desktop global pip-check conflicts before MPS tests; no environment repair was attempted.
- Boundary: frontend/tests/trackers only. No backend, API, schema, migration, secret or production state changed. F43 is `passing` locally and awaits separate push/deploy approval.

### Session 86 — 2026-08-26 (Codex, F41 production activation closeout and F43 UX note)
- Goal: close F41 only after fresh end-to-end production evidence and record the separate stale-modal UX behavior without starting implementation.
- Production verification: getWebhookInfo reports the registered HTTPS endpoint, `allowed_updates=[message]`, `pending_update_count=0` and no last error. mps-backend is active and health returns `{status:ok,version:0.1.0}`. Production DB rows #Q4 manager and #Q5/#Q6 lawyer are all `answered` with answer, responder, answered_at and outgoing Telegram message ID present; nginx recorded HTTP 200 for the inbound updates.
- F41 state: fully `passing`, deployed and activated at `1782b5a`. The activation used a fresh generated webhook secret, verified relay bot, protected config backup and setWebhook `ok:true`; both directions are confirmed by live Telegram replies.
- F43 state: created as `open`, not `in_progress`. The delivery path is healthy; only the open frontend modal is stale because `useQA` fetches on mount and has no polling/focus refresh after an external webhook transition.
- Scope: tracker-only closeout. No application source, production configuration, database data, webhook registration or service state was changed in this session.
- Next best action: commit only the four tracker files, then leave F43 untouched until a separate plan and approval.

### Session 85 — 2026-08-26 (Codex, F41 webhook transport and relay-log redaction)
- Goal: make inbound manager/lawyer Telegram replies reach their Question safely, without a polling service or Bot API token leakage.
- Completed locally: `/api/v1/internal/telegram-webhook` verifies the Telegram secret header fail-closed, accepts only manager/lawyer reply updates and uses the existing answered Question/Notification transaction. A shared parser owns `#Q{id}` extraction; the optional aiogram bridge forwards raw updates instead of duplicating it. `tg_relay` emits only a token-free ERROR and raises a safe exception on HTTP failure.
- RED→GREEN: target RED — 5 expected failures: route 404 and raw HTTPStatusError exposed the test token URL; GREEN — 5 passed. Full Q&A — 14 passed. Full backend complete groups — 26 passed; 46 passed/3 skipped; 29 passed; 12 passed — 113 passed/3 skipped, with 116 collected.
- Evidence recorded: F41 in `feature_list.json`. Final `./init.sh` stopped only at the external Hermes/desktop global pip-check before MPS pytest; no environment repair was attempted.
- Production boundary: no token, backend .env, webhook registration, queued update or service was changed. Activation awaits separate approval and a new BotFather token.
- Next best action: commit F41 locally, then wait for separate push/deploy and token/webhook-activation approval.

### Session 84 — 2026-08-26 (Codex, F42 MiniMax reasoning stripping)
- Goal: prevent raw MiniMax internal reasoning from appearing in the direct «Иришка ИИ» Q&A answer.
- Completed: `visible_completion_content()` in the shared MiniMax transport strips only a complete leading `<think>…</think>` block and returns the clean final text. It leaves replies without a closing delimiter exactly unchanged. Direct Q&A and forum autoreply both use this transport; no API, database or frontend change was needed.
- RED→GREEN: target `tests/test_qa.py -k reasoning` RED — 1 expected failure / 2 passed because raw `<think>` was returned; GREEN — 3 passed. Full backend in complete Windows-safe groups — 108 passed / 3 skipped. `npm run build` — success, 116 modules, standard chunk-size warning only.
- Evidence recorded: F42 in `feature_list.json`. Final `./init.sh` stopped only at the external Hermes/desktop global pip-check before MPS pytest; no environment repair was attempted.
- Deployment: `3d6ac1c` was subsequently pushed and deployed backend-only. A fresh PostgreSQL backup preceded mps-backend restart; health and deploy/smoke.sh passed. Frontend was unchanged.
- Known risks: unclosed `<think>` is retained intentionally to avoid discarding answer content; it stays a visible malformed provider response rather than a hidden data-loss case.
- Next best action: commit F42 locally, then await separate production approval.

### Session 83 — 2026-08-26 (Codex, F41 incoming Q&A Telegram relay diagnosis)
- Goal: determine why a same-group reply to #Q4 reached Telegram but left the site Question open.
- Completed read-only: current relay bot identity is correct, but `getWebhookInfo` has an empty URL and `pending_update_count=4`; no MPS long-polling worker exists. The active `pod-solncem-bot.service` polls bot id 8911332115, while the relay bot is id 8982961972, and its source has no `bot_bridge` or `qa-answer` integration. Backend, system and nginx logs show no inbound bridge request; #Q4 remains MANAGER/OPEN with no answer.
- Verification: source confirms the router would handle a same-group reply through `reply_to_message`, group-ID filtering and `#Q{id}` extraction. Aiogram documents `reply_to_message` for same-chat replies. No code/configuration/service was changed. `./init.sh` stopped only at the known external Hermes/desktop global pip-check conflicts.
- Evidence recorded: F41 in `feature_list.json`, `session-handoff.md` and `clean-state-checklist.md`.
- Known risks: current router is manager-chat-only, so lawyer incoming replies are an additional future correction even after an inbound transport exists.
- Next best action: await a confirmed F41 implementation plan; no webhook registration or service change is authorized by this diagnostic task.

### Session 82 — 2026-08-26 (Codex, F40 Q&A relay and responsive composer footer)
- Goal: close the Q&A delivery configuration gap and restore a usable question composer in manager, lawyer and Иришка ИИ tabs.
- Completed: approved production configuration repair verified the intended relay bot and both destination directions. The frontend footer now has dedicated semantic classes and a responsive grid: textarea fills its row, consent/policy and submit controls stay independent, and the narrow-screen breakpoint stacks them safely.
- RED→GREEN: `npm test -- --run src/components/QA.test.tsx` first failed as expected because the footer lacked the dedicated composer contract. GREEN target — 1 passed. The test uses real CSS via Vitest `css: true` and asserts 100% width / 96px minimum, plus visible, separately classed controls in all three tabs. Full frontend — 20 files / 125 passed; production build — success, 116 modules (normal Vite chunk-size warning only).
- Evidence recorded: F40 in `feature_list.json`; final `./init.sh` stopped only at the external Hermes/desktop global pip-check before MPS pytest. No environment repair was attempted.
- Commits: local checkpoint authorised; push and production CSS deployment remain explicitly unapproved.
- Known risks: CSS was not deployed in this session; the fixed local UI must receive a separate frontend-only rollout and live browser check.
- Next best action: commit F40 locally, then await separate push/deploy approval.

### Session 81 — 2026-08-26 (Codex, F39 main feed excludes fishki)
- Goal: keep fishki out of the main feed while preserving the dedicated `/fishki` route and public-profile author lists.
- Completed: default `GET /posts` now selects published `article` and `video_review` only when neither `type` nor `author_id` is supplied. Explicit `type=fishka` is unchanged; author-filtered profile lists retain all published types. `/fishki` requests the explicit filter, while Feed also refuses to render fishka in normal mode.
- RED→GREEN: backend RED — 1 expected failure because the default feed contained fishka ID 3; frontend RED — 2 expected failures for the visible fishka and absent query parameter. GREEN target — backend 1 passed; frontend 2 files / 35 passed. Full backend — 105 passed / 3 skipped across four complete groups; full frontend — 19 files / 124 passed; build — success, 116 modules (standard chunk-size warning only).
- Evidence recorded: F39 in `feature_list.json`; `./init.sh` stopped only at the external Hermes/desktop global pip-check before MPS pytest. No repair of that environment was attempted.
- Commits: none. Production: explicitly unapproved.
- Known risks: the intentional default endpoint semantic change affects unfiltered public-feed consumers only; author-filtered consumers are regression-covered and retain fishki.
- Next best action: await explicit local commit approval, then separate push/production approval for F39.

### Session 80 — 2026-08-26 (Codex, F38 Package 3 interactive Иришка chat and knowledge base)
- Goal: add a direct, non-persistent Q&A chat with Иришка, independent from the forum scheduler, grounded in the supplied 248-record local knowledge JSON.
- Completed locally: copied the JSON unchanged to `backend/app/data/irishka_knowledge.json` (247315 bytes; SHA-256 recorded in F38 evidence). `POST /qa/irishka` requires authentication, limits a verified user to 10/minute, keyword-ranks up to five tag/text snippets and returns a MiniMax answer synchronously. No match returns a Russian manager referral without calling MiniMax; no `Question` or `ForumMessage` is created. A shared MiniMax transport preserves the existing 30s/three-attempt transient retry behaviour of the unchanged scheduler.
- RED→GREEN: backend RED — 3 expected 404 failures; GREEN `tests/test_qa.py tests/test_irishka.py` — 21 passed in 9.83s. Frontend RED — one missing «Иришка ИИ» control; GREEN `App.routing.test.tsx` — 28 passed. Final full backend shards — 38 passed/3 skipped, 28 passed, 11 passed, 27 passed (104 passed/3 skipped total); frontend — 19 files / 122 passed; build succeeded with 116 modules and the standard chunk-size warning.
- Evidence recorded: `feature_list.json` F38. `git diff --check` passed. Final `./init.sh` stopped only at the known external Hermes/desktop global pip-check before MPS pytest; no external repair was attempted.
- Commits: none — awaiting explicit confirmation. Production: unapproved.
- Known risks: keyword retrieval is deliberately MVP-level and SlowAPI remains process-local. No conversation history, vector search, scheduler behaviour or external configuration changed.
- Next best action: review, then explicitly authorize the local Package 3 commit; push/deploy require their own approval.

### Session 79 — 2026-08-26 (Codex, F38 Package 2 MiniMax timeout, retry and scheduler isolation)
- Goal: prevent one transient MiniMax failure from aborting the Иришка scheduler run, while avoiding retries for invalid credentials.
- Completed locally: `generate_minimax_answer` uses explicit `httpx.Timeout(30.0)`, three total attempts, 0.5/1.0-second exponential backoff for only timeout/network/5xx failures, immediate 4xx failure and error logging. A failed topic returns `None` and the run continues to later topics without publishing an answer for the failed topic.
- RED→GREEN: RED `tests/test_irishka.py` — 6 expected failures / 9 passed. GREEN — 15 passed in 6.19s, covering timeout/500 retry, explicit timeout, one request for 401/403, log output and a successful later topic after an exhausted failure. Full backend — 101 passed, 3 skipped in 40.50s; JUnit failures=0/errors=0.
- Evidence recorded: `feature_list.json` F38. Final `./init.sh` stopped only at the known external Hermes/desktop global pip-check conflicts before MPS pytest; no external repair was attempted.
- Commits: local checkpoint commit for F38 Package 2.
- Known risks: package intentionally leaves all-topics/N+1 reads, duplicate-run protection, locked-topic handling and incomplete admin GET settings exposure for later decisions.
- Next best action: await explicit backend-only production deploy approval for F38 Package 2; no Package 2 deploy has been performed.

### Session 78 — 2026-08-26 (Codex, F38 Package 1 Telegram notification for Irishka manager questions)
- Goal: ensure a price/visa/document forum topic handled by Иришка reaches managers through the existing Telegram relay without making the scheduler fail when Telegram is unavailable.
- Completed locally: price/visa/document handling now flushes the manager `Question`, calls `tg_relay.send(settings, question)` with the existing `/qa` transport contract (`#Q{id}\n{body}`), saves `tg_message_id` after success and logs/suppresses only the Telegram failure. The Question plus `is_ai=true` forum reply still commit when the relay raises.
- RED→GREEN: RED `D:\Python312\python.exe -m pytest tests/test_irishka.py -q --color=no --basetemp D:\AI\tmp\mps-f38-p1-red` — 3 expected failures / 6 passed: mock `tg_relay.send` was awaited 0 times. GREEN same suite — 9 passed in 2.91s, including price, visa, saved Telegram ID and relay-failure persistence scenarios. Full backend JUnit — 98 tests, 0 failures, 0 errors, 3 PostgreSQL-only skips in 30.307s.
- Evidence recorded: `feature_list.json` F38. Final `./init.sh` stopped only at the known external Hermes/desktop global pip-check conflicts before MPS pytest; no external repair was attempted.
- Commits: local checkpoint commit for F38 Package 1.
- Known risks: this package intentionally does not add a direct topic route/link, MiniMax timeout/retry isolation, scheduler duplicate-run protection, locked-topic handling or an expanded admin GET settings response.
- Production rollout: `9d18156` subsequently pushed and fast-forwarded the VPS; `mps-backend` restarted to active and `deploy/smoke.sh` passed. No migration or frontend build was required.

### Session 77 — 2026-08-26 (Codex, F37 Session B fishka creation form)
- Completed locally: `/fishki` checks the authenticated reader/premium effective permission endpoint; it never displays a disabled capability. Editor/admin always see the compact modal. The modal has title, plain-text body and an explicit fixed emoji picker; it sends fishka `published` for staff and `pending` for reader/premium. Staff sees «Фишка опубликована» after public-list reload; reader sees «Фишка отправлена на проверку» and no pending content enters the public list. Fishka cards render their API emoji.
- RED→GREEN: `App.routing.test.tsx` RED had 3 expected missing-form/permission failures; GREEN — 27 passed. Full frontend — 19 files / 121 passed. `npm run build` — success, 116 modules; only the standard Vite chunk-size warning. Production rollout `df36dc2` retained rollback `/root/backups/mps-frontend-f37-b-20260826T025153Z`, served `index-BpaSMHEn.js` with HTTP 200, kept backend active, and passed `deploy/smoke.sh`. Configured-admin live API proved effective permission, immediate emoji publication and public-list visibility before synthetic cleanup (204); no authenticated browser session was available for a literal modal click. F37 remains `in_progress`; Sessions C/D are not started.

### Session 76 — 2026-08-26 (Codex, F37 Session A fishka backend foundation)
- Completed locally: Post now has nullable `emoji`; fishka requests require a nonblank emoji. Migration `20260826_0014` adds the column and seeds `fishka_submissions_enabled=false`. With the toggle on, readers can submit only fishki; the server forces them to `pending` and clears `published_at`. Editor/admin submissions bypass the toggle and publish immediately. Editor/admin can approve or reject pending fishki at `PATCH /posts/{id}/moderate`; pending fishki join the existing admin moderation queue. `GET/PATCH /admin/settings` gives admins the toggle, while `GET /posts/fishki/permission` exposes only the effective submission permission. Legacy frontend `tip` is removed from the API union/filter.
- RED→GREEN: target RED had 3 expected contract failures (reader submission, premoderation, missing settings read API); GREEN `test_posts.py test_admin.py` — 13 passed. Isolated Alembic head confirmed the new column and default setting. Final backend — 92 passed, 3 skipped in 36.11s; full frontend — 19 files / 118 passed; build succeeded with 115 modules and only the usual chunk-size warning.
- Production rollout: `4f86725` is pushed and deployed. A fresh readable PostgreSQL backup preceded Alembic `20260826_0014`; the backend restarted and became healthy. Frontend rollback is `/root/backups/mps-frontend-f37-a-20260826T022626Z`; remote build produced `index-C_UmfjiP.js` with no localhost API and `deploy/smoke.sh` passed. The configured admin account observed `fishka_submissions_enabled=false`, created a temporary emoji fishka with `published` status, then deleted that synthetic row with 204. `./init.sh` remains blocked only by the pre-existing external Hermes/desktop global pip-check incompatibilities. F37 remains `in_progress`; Sessions B (form/UI), C (admin UI) and D (content import) are not started.

### Session 75 — 2026-08-26 (Codex, F36 Package 4 forum naming local completion)
- Completed locally: the forum page heading is «Страны — Форум»; the sidebar/mobile/footer navigation uses «Форум стран»; the topic back-link uses «← Форум стран». No CSS, route, API, backend or schema behavior changed.
- RED→GREEN: targeted RED produced 3 expected missing-text assertions for the heading, back-link and navigation. After the four wording substitutions, targeted `Forum.test.tsx` + `Layout.test.tsx` — 7 passed. Full frontend `npm test -- --run` — 19 files / 118 passed; `npm run build` — success, 115 modules, standard chunk-size warning only.
- Production rollout: `c380667` synchronized local/origin/VPS. The previous dist is retained at `/root/backups/mps-frontend-f36-p4-20260826T011453Z`; backend stayed active without restart. The rebuilt production frontend passed `deploy/smoke.sh`; a browser opened «Форум стран» and observed heading «Страны — Форум».

### Session 74 — 2026-08-26 (Codex, F36 Package 3 forum deletion)
- Completed locally: `DELETE /topics/{topic_id}` and `DELETE /messages/{message_id}` allow the resource author or an admin and return Russian 403/404 otherwise. Topic deletion relies on `ON DELETE CASCADE`; SQLite connections now enable foreign keys so local/test semantics match PostgreSQL.
- Completed locally: message deletion and its topic update share one transaction. The counter uses atomic SQL decrement guarded at zero; `last_message_at` becomes the newest remaining message timestamp or falls back to the topic `created_at` when no messages remain.
- Completed locally: topic list responses now include additive `author_id`; Forum exposes delete controls only to the author/admin and requires the established irreversible-action confirmation before DELETE. Successful deletion immediately removes the topic/message and updates local counters.
- RED→GREEN: backend RED — 3 expected 404 failures; GREEN `tests/test_forum.py -k deletion` — 3 passed, then forum suite — 11 passed / 3 skipped. Frontend RED — 2 expected missing-control failures; GREEN `Forum.test.tsx` — 5 passed. Final backend pytest completed successfully; frontend — 19 files / 117 passed; build — success, 115 modules. `./init.sh` stopped only at the agreed external Hermes/desktop pip-check conflicts before MPS tests.
- Production rollout: `cc89d2b` and production-only semantics hotfix `0bc8c3e` were pushed and fast-forwarded on the VPS. Fresh readable PostgreSQL backup, backend health, rebuilt frontend, `deploy/smoke.sh` and a live authorized API scenario passed. The live scenario created only synthetic rows and confirmed non-latest counter decrement with unchanged `last_message_at`, latest-message recalculation, and removal of the topic from its country list.

### Session 73 — 2026-08-26 (Codex, F36 Package 2 atomic forum writes and rate limits)
- Completed locally: non-editor/admin topic quota now locks the current user row with `SELECT FOR UPDATE` before counting and inserting, so parallel requests cannot exceed the configured quota. API message writes and Иришка both use `UPDATE forum_topics SET messages_count = messages_count + 1`; no Python read-modify-write remains.
- Completed locally: forum write limits use the verified JWT subject, not a proxy/IP address. Topic creation is limited to 5/minute and message creation to 10/minute; a `RateLimitExceeded` handler returns Russian `429 «Слишком много запросов. Попробуйте через минуту.»`.
- Verification: real temporary PostgreSQL RED — 5 expected failures: five concurrent requests crossed the remaining one-topic quota, five messages left `messages_count=1`, both 429 contracts were absent, and Иришка emitted a non-atomic counter UPDATE. GREEN `tests/test_forum.py tests/test_irishka.py` — 17 passed in 9.04s. Full backend pytest completed successfully against the same PostgreSQL; frontend `npm test` — 19 files / 114 passed; `npm run build` succeeded (115 modules, standard chunk-size warning only). `./init.sh` stopped only at the unrelated global Hermes/desktop pip-check conflicts before MPS tests.
- Evidence recorded: Packages 1 and 2 are production-deployed at `61ff1a5` and `6128c74`; F36 stays `in_progress` until Package 4.
- Known risks: SlowAPI storage remains process-local, matching the existing single `mps-backend` deployment. A later multi-worker rollout needs Redis-backed limiter storage. The separate Иришка duplicate-run race is outside this Package 2 counter scope.

### Session 72 — 2026-08-26 (Codex, F36 Package 1 forum pagination and indexes)
- Completed locally: `GET /countries/{country_id}/topics` and `GET /topics/{topic_id}/messages` now return `{items, next_cursor}` with opaque `id DESC` keyset cursors; `limit` defaults to 20 and is bounded 1–50. The frontend preserves previously fetched cards/messages and renders «Показать ещё» only while `next_cursor` exists.
- Completed locally: topic search moved from Python `casefold` filtering into SQL `ILIKE`; countries and their topic counts now use one `LEFT JOIN + GROUP BY` query instead of N+1 COUNTs. The new migration `20260826_0013` adds `country_id, created_at DESC, id DESC`, `author_id`, and `topic_id, created_at DESC, id DESC` indexes as agreed.
- Verification: backend RED — 3 expected failures; backend GREEN `test_forum.py` — 7 passed, including a temporary PostgreSQL 16 integration test proving Cyrillic `ILIKE` (`СИМка` found by `симка`). The migration applied to the temporary PostgreSQL and its three index names were observed. Frontend RED exposed the array/envelope contract crash; GREEN `Forum.test.tsx` — 2 passed. Full backend — 83 passed in 69.10s; full frontend — 19 files / 114 passed; build — success, 115 modules. Final `./init.sh` stopped only at the unrelated global Hermes/desktop pip-check conflicts before MPS tests.
- Evidence recorded: F36 remains `in_progress` because Packages 2–4 are not started. Production deployment is explicitly unapproved.

### Session 71 — 2026-08-25 (Codex, F35 full-cycle production closeout)
- Completed F35 Session 1: PublicProfile publications remain the regression baseline; `GET /users/{id}/followers` and `/following` supply public follow lists with viewer-relative state, and cards use «Подписаться» / «Подписан».
- Completed F35 Session 2: «Ответы» displays the profile owner's own comments. The owner sees all moderation states, other visitors only approved entries; status labels render only for an admin on that admin's own profile.
- Completed F35 Session 3: public Likes cards show a real optional cover and UTC liked date; same-tab post toggles refresh the shared current-user likes list without cross-window synchronization.
- Completed F35 Session 4a: normalized activity_log migration/backfill plus atomic source-action hooks for post publication, comments, likes/follows and their reversible unlike/unfollow removal.
- Completed F35 Session 4b: `GET /users/{id}/activity` resolves context in batches with keyset pagination and visibility filters; the public UI renders publication, comment, like and follow events, UTC dates and «Показать ещё». Approved rollout advanced VPS `2e58222 → 86a67e5`; Alembic remained `20260825_0012 (head)`, mps-backend became ready on attempt 2, frontend was rebuilt as `index-CwPpAkwf.js`, and smoke passed. Live browser evidence showed Pavel's four historical events (publication, like, two comments) dated 24.08.2026; there is no load-more button because the public response has four items and `next_cursor=null`.
- Fresh closeout verification: backend `79 passed in 20.90s`; frontend `18 files / 112 passed`; `npm run build` succeeded with 115 modules (standard chunk-size warning only). Final `./init.sh` stopped only at external Hermes/desktop global pip-check conflicts before MPS tests.
- Evidence recorded: F35 is `passing` and production-deployed as a whole. No code changed in this tracker-only session.
- Next best action: read-only diagnose slow personal-profile loading (F32 from the original findings list); it is not yet investigated.

### Session 70 — 2026-08-25 (Codex, F35 Session 4b Activity API/UI)
- Goal: finish F35 with a scalable public Activity feed over the deployed normalized activity_log infrastructure.
- Completed: `GET /users/{id}/activity` uses opaque `(created_at, id)` keyset cursors, reads further raw chunks until it fills a visible page, and resolves post/comment/follow context in type batches. Owners receive their own comment events at every moderation status; other visitors receive only approved comments and visible published posts. PublicProfile now renders a chronological four-event Activity list, UTC dates, «Показать ещё» and the exact empty state «Пока нет активности. Здесь появятся ваши публикации, ответы, лайки и подписки.»
- Verification run: backend RED `tests/test_activity_feed.py` — 2 expected 404 failures; backend GREEN — 2 passed. Frontend RED — Activity placeholder missing event text; frontend GREEN targeted PublicProfile + routing — 33 passed. Full backend — 79 passed in 23.39s; full frontend — 18 files / 112 passed; `npm run build` — success, 115 modules (standard chunk-size warning only). Final `./init.sh` stopped only at external Hermes/desktop global pip-check conflicts before MPS tests.
- Evidence recorded: F35 became locally `passing`; the separately approved production rollout later advanced the VPS `2e58222 → 86a67e5`, restarted backend successfully, rebuilt frontend and passed smoke plus live Activity verification.
- Commits: `86a67e5` — Session 4b code.
- Known risks: historical activity context is resolved against current public visibility, so deleted/unpublished/hidden references intentionally disappear from the visitor feed.
- Next best action: F35 full-cycle closeout (completed in Session 71).

### Session 69 — 2026-08-25 (Codex, F35 Session 4a Activity infrastructure)
- Goal: add scalable, normalized write infrastructure for profile activity before exposing an Activity API or UI.
- Completed: `activity_log` and `ActivityEventType` add post_published, comment_created, post_liked and user_followed. A migration adds portable type validation, user/time pagination and uniqueness indexes, then backfills published posts, all comments, current likes and current follows. Posts/comments/likes/follows record events in the same transaction; unlike and unfollow remove their reversible events.
- Verification run: RED `test_activity_log.py` — expected missing `app.models.activity` collection error. GREEN — 4 passed. Full backend — 77 passed in 21.70s. `alembic heads` — `20260825_0012 (head)`. Final `./init.sh` stopped only at external Hermes/desktop global pip-check conflicts before MPS tests.
- Evidence recorded: F35 remained `in_progress` until Session 4b; no Activity endpoint/frontend was added in this sub-session. Its separately approved production rollout later deployed `2e58222` after a fresh PostgreSQL backup, migration/backfill, readiness, smoke and direct `activity_log` SQL evidence.
- Commits: `2e58222` — Session 4a code.
- Known risks: activity reference IDs are polymorphic by design; Session 4b must batch-load their current display context and apply public comment/post visibility filters.
- Next best action: Session 4b read API/UI (completed in Session 70).

### Session 68 — 2026-08-25 (Codex, F35 Session 3 Likes UX)
- Goal: keep likes public, add the missing liked date and cover context, and make the current user's Likes list fresh after an in-tab post toggle without adding a card button or cross-window state.
- Completed: public likes DTO adds normalized UTC `liked_at` from `post_likes.created_at`; Likes cards render only a non-empty `cover_url`, date and existing read button. App owns the current user's likes cache and refreshes it through the existing list endpoint after a successful toggle.
- Verification run: backend RED — expected missing `liked_at`, 1 failure / 9 passed; backend GREEN — 10 passed. Frontend RED — 2 expected failures / 29 passed; frontend GREEN targeted — 31 passed. Full backend — 73 passed in 22.95s; full frontend — 18 files / 110 passed; build — success, 115 modules. Final `./init.sh` stopped only at external Hermes/desktop global pip-check conflicts before MPS tests.
- Evidence recorded: F35 remains `in_progress`; approved deployment fast-forwarded VPS `72ce494 → c12e102`, restart reached readiness on attempt 2, production build/smoke and live public Likes endpoint passed.
- Commits: `c12e102` — Session 3 code.
- Known risks: no BroadcastChannel/polling is intentionally present; same-tab cache is refreshed authoritatively after the toggle.
- Next best action: obtain separate approval to deploy Session 3, or continue only an independently approved remaining F35 sub-session.

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

### Session 61 — 2026-08-28 (Codex, F48b reviews)

- Goal: завершить аудит отзывов: editor-модерацию, защиту от double-submit и честные error/empty states без новой admin-зоны.
- Completed: существующая schema `reviews.status` (`pending`/`approved`/`rejected`) и PATCH moderation сохранены без миграции. Добавлен editor-gated `GET /reviews/pending`; reader получает 403, editor видит только pending, а публичный список остаётся approved-only. В существующий `/reviews` встроена очередь модерации для editor; submit и каждое approve/reject действие блокируются во время своего запроса. Public list и очередь получили раздельные loading/error/retry/empty состояния; ошибка отправки сохраняет введённые данные и даёт повтор.
- RED→GREEN evidence: backend `tests/test_reviews.py` RED — 1/4 failed (`/reviews/pending` отсутствовал: 404 вместо 403); GREEN — 4/4 passed. Frontend `Reviews.test.tsx` RED — 4/4 failed (double-submit, list-error/retry, empty state, moderation queue); GREEN — 5/5 passed, включая retry после ошибки отправки с сохранённой формой.
- Final verification: backend `python -m pytest tests -q` — 121 passed, 7 skipped (PostgreSQL-only); frontend `npm test` — 23 files, 152 passed; `npm run build` — 118 modules, success, только существующее chunk-size warning. `./init.sh` повторён через Git Bash: дошёл до глобального `pip check` и остановился на внешних Hermes/desktop dependency conflicts (включая отсутствующий `llvmlite` для `numba`); Win32 Error 5 не воспроизвёлся. Shared environment не менялся.
- Evidence recorded: `feature_list.json` → F48b `passing`; `session-handoff.md` updated. Commit is local only; push/deploy await separate approval.
- Next best action: commit F48b locally, then await explicit push/deploy approval; agreed backlog continues with F47 closeout or F48c.

### Session 62 — 2026-08-29 (Codex, P0 structure + real subscriptions rail)

- Goal: приблизить light/dark UI к Claude Design по структуре header/sidebar и добавить в правый rail только ту часть эталона, которая обеспечена существующими UserFollow API/hooks.
- Completed in commit `613faab`: три header action-кнопки получили 2px theme-aware outline; account pill получил тёмный круг с инициалом и шеврон; в sidebar добавлен отдельный `Создать`, открывающий существующий publication composer. Центральное действие сохранено.
- Completed in commit `85cb16a`: добавлен изолированный `SubscriptionsPanel`; `App` загружает `/users/{currentUser.id}/following`, panel показывает первые 8 реальных подписок в 4 колонки и открывает существующие public-profile routes. Правый rail расширен до 280px (252px на 901–1100px), а presence сохранён отдельным блоком. На ширинах ≤900px rail скрыт по прежнему адаптивному принципу.
- RED→GREEN evidence: новый `SubscriptionsPanel.test.tsx` сначала не собрался из-за отсутствующего `./SubscriptionsPanel`; после минимальной реализации passed 2/2. Targeted component/Layout/App integration passed 52/52. Старые draft fetch-fixtures были точечно дополнены новым `/users/5/following -> []` контрактом; production-компонент не маскирует неверный API-тип.
- Final verification: frontend `npm test` — 25 files / 164 passed; `npm run build` — 119 modules, success, только chunk-size warning. Bundled Playwright/Chrome проверил light/dark на 375/768/1024/1440: 8/8 passed, rail visibility/width, 8 real records, 4 CSS columns, presence, reload persistence, Inter/Playfair, focus-visible, reduced-motion, zero horizontal overflow и zero theme-toggle reflow.
- Deferred: `WIDG-4` фиксирует поиск по журналу/пользователям и рекомендации со скрытием карточек как отдельную planned backend+frontend feature. Статические данные не добавлялись.
- Publication boundary: commits `613faab` и `85cb16a` локальные; push/deploy не выполнялись и требуют отдельного подтверждения владельца.
- Next best action: после review получить отдельное разрешение на push; production deployment проводить отдельным шагом с rollback и smoke.

### Session 63 — 2026-08-29 (Codex, P0 shared center PageCard)

- Goal: исправить перепутанную карточность shell без изменения состава страниц: плоский sidebar, единая центральная PageCard и сохранённые отдельные секции right rail.
- Completed: добавлен переиспользуемый `PageCard`, которым в `App` обёрнут только route `content`; notifications, QA/Profile и остальные overlays остаются соседями вне карточки. Desktop-контракт центра использует `var(--card)`, `var(--card-line)`, radius 16px, padding 40/40/44 и `var(--card-shadow)`; mobile padding уменьшен до 24/16/28. Прямой page-root `main` получает нулевой внешний padding, поэтому двойных отступов нет. У sidebar удалены white background/shadow, active item переведён на `var(--gold-soft)`. Right rail не изменялся.
- RED→GREEN evidence: новый `App.routing.test.tsx` contract сначала failed 1/1 с `expected false to be true`, потому что основной `main` не имел родителя `.page-card`. После минимальной реализации узкий тест passed 1/1, весь `App.routing.test.tsx` passed 45/45.
- Final verification: frontend `npm test` — 25 files / 165 passed; `npm run build` — 120 modules, success, только существующее chunk-size warning. Bundled Playwright/Chromium проверил light/dark после reload на 375/768/1024/1440: 8/8 passed, exact card background/border/radius/padding/shadow, transparent/no-shadow sidebar, `--gold-soft` active item, zero page-root padding, zero horizontal overflow, Inter/Playfair loaded, focus 2px, reduced-motion 0.01ms и zero theme-toggle reflow. Center width: 580px at 768, 552px at 1024. Стабильные screenshots просмотрены без обрезки или конфликтов в изменённой области.
- Design reference: `design/DESIGN_SYSTEM.md` фиксирует правило shell layout, 25 основных light/dark токенов и 13 semantic aliases; значения программно сверены с `styles.css` без расхождений.
- Publication boundary: этот четвёртый локальный commit должен оставаться без push/deploy до отдельного подтверждения владельца на все четыре commits.
- Next best action: получить отдельное разрешение на общий push четырёх локальных commits; production deployment выполнять отдельным owner-approved шагом с rollback и smoke.

### Session 64 — 2026-08-30 (Codex, feed interactions and post SEO)

- Goal: закрыть BUG-1 и FEED-A–E без изменения продуктовой архитектуры React CSR: ответы на комментарии, структурный preview текста, доступные controls/frames медиа, share URL и серверная post-specific meta.
- Completed: `ArticleComments` получил выбранный root-comment, отдельный reply-композер, передачу `parent_id` и одноуровневое отображение; `RichTextContent` ограничивает только текст до 3 блоков/420 символов и всегда сохраняет фото/карусели. Карусель получила 44px theme-aware стрелки с focus/hover, а все media внутри post/article получили единую рамку без двойного border у кадров. `Feed` копирует абсолютный `/posts/{slug}` через Clipboard API с совместимым fallback и существующим toast. FastAPI для любого опубликованного `/posts/{slug}` отдаёт React SPA и подставляет в `<head>` plain/escaped title-description, canonical, абсолютный image, `og:type=article`, `twitter:card=summary_large_image` и JSON-LD независимо от User-Agent.
- RED→GREEN evidence: BUG-1 RED не находил `.comment-replies`; GREEN reply-contract passed. FEED-A RED продолжал показывать четвёртый абзац; GREEN preview-contract passed. FEED-B/C/D RED зафиксировал 34px arrows, отсутствующую рамку и share action; GREEN passed 4/4. FEED-E RED не находил `og:title` в browser SPA; GREEN backend SEO passed 3/3 для Mozilla/Telegram/WhatsApp/VK. Combined changed frontend targets passed 3 files/26 tests.
- Final verification: fresh backend full suite — 125 passed, 7 existing PostgreSQL-only skipped; fresh frontend full suite — 25 files/172 passed; `npm run build` — 120 modules, success, только существующее chunk-size warning. Browser light/dark на 375/768/1024/1440 passed 8/8: text-only preview, все media видимы, expand/collapse на месте, reply nesting, 44px controls, focus ring, один carousel frame, 0 horizontal overflow и reduced-motion 0.01ms. Clipboard получил точный абсолютный URL.
- Live HTTP evidence: временная локальная FastAPI-сборка с реальным `dist/index.html` проверена через `curl.exe`; Mozilla, TelegramBot, WhatsApp и VKShare получили 200, React root и полный набор post-specific meta с plain description и absolute image.
- Evidence recorded: `feature_list.json` → `FEED-UX-SEO` `passing`; `session-handoff.md` updated. Временные browser/server/pytest артефакты удалены.
- Publication boundary: новый commit остаётся локальным и должен публиковаться только после отдельного подтверждения вместе с уже готовым `ac0235a`; push/deploy не выполнялись.
- Next best action: получить разрешение на общий push двух локальных commits, затем отдельным production cycle сделать backup, frontend/backend rollout и smoke.

### Session 65 — 2026-08-30 (Codex, FEED-F/FEED-G reading flow follow-up)

- Goal: убрать лишнюю прокрутку после обсуждения и уточнить preview-контракт карусели: при наличии отдельной обложки дополнительная карусель сворачивается вместе с текстом; без обложки остаётся видимой.
- Completed: локальный commit `3c95711` добавляет нижнее действие «Назад к ленте» после комментариев. `RichTextContent` получил opt-in `collapseCarouselInPreview`; в collapsed-состоянии отфильтровываются только carousel-сегменты, inline-фото остаются, а после раскрытия возвращается полный sanitized HTML. Article-ветка `Feed` включает режим через `Boolean(coverUrl)`; fishka/video и полная `/posts/{slug}` его не используют. Toggle появляется при скрытом тексте или карусели, поэтому работает и для короткого текста с обложкой.
- RED→GREEN evidence: новый целевой набор сначала дал 2 ожидаемых failure / 29 passed — статьи с обложкой и коротким текстом всё ещё показывали карусель; сценарии без обложки и полной страницы уже сохраняли правильное поведение. После минимальной реализации и обновления прежнего frame-теста на раскрытое состояние целевой набор passed 3 files / 31 tests.
- Final verification: fresh `npm test` — 25 files / 177 tests passed; `npm run build` — 120 modules, success, только существующее chunk-size warning. Bundled Playwright/Chrome проверил light/dark на 375/768/1024/1440: 8/8 passed, covered carousel скрывается/возвращается/снова скрывается, no-cover carousel остаётся видимой, inline image остаётся, full post не получает toggle, active theme совпадает, focus outline видим, reduced-motion включён и horizontal overflow равен 0. Крайние screenshots 375/1440 обеих тем просмотрены визуально.
- Evidence recorded: `feature_list.json` → `FEED-UX-SEO`; `session-handoff.md` updated. Временный preview server, browser harness и screenshots удалены.
- Publication boundary: `ac0235a`/`367dd3e` уже находятся в origin/production. Локально поверх них остаются `3c95711` и новый FEED-G commit; push/deploy не выполнялись и требуют отдельного подтверждения владельца.
- Next best action: получить отдельное разрешение на общий push/deploy двух локальных frontend commits, сделать frontend backup/build/deploy и повторить smoke без backend restart.

### Session 66 — 2026-08-30 (Codex, About navigation priority)

- Goal: выполнить подтверждённую формулировку Сергея «между лентой и форумом стран... чтобы не в конце была», не добавляя новый контентный блок и не меняя footer или страницу `/about`.
- Completed: единый массив `Layout` теперь задаёт порядок `Лента → О нас → Форум стран → Фишки → Отзывы → Подписка`; условные «Черновики» сохраняют своё прежнее место для editor/admin, а «Вопрос-ответ» остаётся завершающим общим действием. Изменение одновременно применяется к desktop sidebar, mobile sheet и первым пунктам mobile bottom navigation.
- RED→GREEN evidence: новый `Layout.test.tsx` contract сначала failed 1/1 и получил прежний порядок `Лента, Форум стран, Фишки, Отзывы, Подписка, О нас, Вопрос-ответ`. После минимальной перестановки целевой тест passed 1/1, весь `Layout.test.tsx` passed 7/7.
- Final verification: fresh `npm test` — 25 files / 178 tests passed; `npm run build` — 120 modules, success, только существующее chunk-size warning. Headless Chrome проверил light/dark на 375/768/1024/1440: 8/8 passed для точного порядка, перехода `/about`, неизменного footer, видимого focus, reduced-motion и отсутствия horizontal overflow. Репрезентативные mobile/tablet/desktop screenshots обеих тем просмотрены визуально без наложений.
- Publication boundary: footer и `/about` не менялись; backend/database/dependencies не затронуты. Новый commit остаётся локальным без push/deploy до отдельного подтверждения владельца.
- Next best action: после отдельного разрешения выполнить frontend-only push/deploy с rollback backup, production VITE guard, backend health-check без restart и `deploy/smoke.sh`.

### Session 67 — 2026-08-30 (Codex, production session closeout)

- Production summary: REV-2 с фото/лимитом/личными статусами и синхронизацией «Мои отзывы»; light-тема с токенами, плоским sidebar, PageCard, реальными подписками и `--card-soft`; BUG-1 и FEED-A–G; навигация «О нас» между «Лентой» и «Форумом стран» — все подтверждены как production-deployed `passing`.
- Final application checkpoint: local `main`, `origin/main` и VPS до документационного closeout совпали на `7ba81997f6dd165350395967f89789283c245918`; backend был `active`, health вернул `ok`. REV-2 package SHA — `58a49f5038141b967324e581f0856757cba08dd8`; feed packages — `367dd3e`, `3c95711`, `4ee6a75`; финальная навигация — `7ba8199`.
- Frontend rollout evidence: rollback `/root/backups/mps-frontend-nav-predeploy-20260829T181639Z-4ee6a75.tar.gz`, SHA-256 `4520506cb375d8eb4b21df9096459435c8ab95bc79f0f52bfe1d73755dd54368`; served `index-B4soeGMl.js` matched production VITE values, excluded localhost API, exposed the approved navigation order and passed `deploy/smoke.sh`. Backend retained PID `970955` without restart.
- SSH incident: historical `mps_deploy_key` disappeared from VPS `authorized_keys`; the cause was not established. The replacement `s048_rotate` key restored access, but its Windows ACL first had to be restricted to the current user before OpenSSH accepted it. Keep this as a deployment risk and verify key access in BatchMode during every preflight; do not rely on passwords or print credentials.
- Next session: start with the P0 checklist referenced by the owner. The closeout request says «см. ниже» but contains no checklist items, so retrieve/confirm the exact list before implementation. Then run the standard HEAD/origin/VPS/clean/init/health startup gate and preserve separate approval for any new code or production action.

### Session 68 — 2026-08-30 (Codex, WIDG-4 interrupted closeout)

- Earlier today: production commit `7ba8199` placed «О нас» immediately after «Лента» and before «Форум стран» through the shared navigation array; desktop/mobile order, `/about`, footer non-interference and the light/dark browser matrix were verified before deployment.
- WIDG-4 stage 1 is accepted and committed as `b8b6568`: ID-pivot recommendations for active authors, exclusion of inactive/self/followed/anonymous/banned users and a regression guard against `ORDER BY RANDOM()`.
- WIDG-4 stage 2 is accepted and committed as `0d98e14`: PostgreSQL FTS/trigram indexes plus the aggregated `/discovery/search` contract for articles, public authors and forum topics; the existing forum search remained unchanged. Verification used active PostgreSQL before acceptance.
- Stage 3 implementation is present only in the working tree: `JournalSearchPanel`, `RecommendedPanel`, typed/debounced/abortable discovery hooks, per-user 30-day hidden recommendation TTL, limited `exclude_ids`, exact rail order and synchronized recommendation/subscription refresh after follow. Historical evidence from the interrupted implementation turn: targeted frontend 4 files / 15 tests, follow-refresh integration 1/1, full frontend 28 files / 187 tests, build 122 modules and browser light/dark 8/8 at 375/768/1024/1440.
- Stage 3 is not closed: the 13 implementation/test files are uncommitted; two later backend control runs did not start because pytest `basetemp` hit the known Win32 Error 5; final review found that a forum-topic search result currently opens its country rather than selecting the exact topic. No fresh final suite/build/browser gate was run in this closeout response.
- Tracker decision: WIDG-4 remains `in_progress` under `verification-before-completion`. The documentation closeout is committed separately without staging the unfinished code. No deploy was performed; production remains at the earlier `7ba8199` application checkpoint.
- Next best action: resume from the existing working tree, add a RED navigation contract for an exact forum-topic result and the minimum routing/state fix, obtain fresh backend verification outside the Win32 sandbox restriction, rerun targeted/full frontend + build + 8-viewport browser gate, review the complete diff, then create the separate stage-3 code commit.

### Session 69 — 2026-08-30 (Codex, WIDG-4 stage 3 completion)

- Goal: continue the preserved stage-3 working tree without restarting the feature, close the exact forum-topic navigation gap, and finish the approved JournalSearchPanel/RecommendedPanel/hooks/layout/TTL/follow-synchronization plan under `tdd-fix-workflow` and `verification-before-completion`.
- Completed: the right rail renders `JournalSearchPanel → RecommendedPanel → SubscriptionsPanel → presence`; discovery search is typed, 300ms debounced, abortable and stale-response safe; recommendations use real backend records, per-user 30-day hidden-ID storage capped at 50 IDs, profile/follow/dismiss actions, and synchronized recommendation/subscription reload after follow. Repeated backend `exclude_ids` are validated at 50 and applied to eligible authors. Forum search results now navigate to `/countries/{countryId}/topics/{topicId}` and initialize `Forum` with that exact topic.
- RED→GREEN evidence: the exact-topic integration RED expected `/countries/1/topics/9` but received `/countries/1`; the minimum pathname route plus `Forum.initialTopicId` fix passed 1/1. Combined targeted frontend verification passed 5 files / 62 tests; the backend exclude-ID target passed 1/1.
- Final automated verification: backend passed 128 tests; 10 tests were explicitly skipped only because `MPS_TEST_POSTGRES_URL` is absent (3 discovery, 3 forum, 4 Irishka), while the three new discovery PostgreSQL contracts from accepted stage 2 already passed on active PostgreSQL. Frontend passed 28 files / 188 tests. Production build passed with 122 modules and only the existing Vite CJS/chunk-size warnings.
- Browser verification: isolated intercepted-API Playwright/Edge checks passed 8/8 for light/dark at 375/768/1024/1440. The rail was hidden at 375/768 and ordered correctly at 1024/1440; debounce measured 313ms; abort/stale, loading/empty/error/retry, exact topic, TTL pruning/exclude IDs and follow→SubscriptionsPanel synchronization passed. Visible controls were at least 44px, focus outline was 2px, reduced-motion applied, horizontal overflow was zero, and contrast measured 4.88:1 light / 7.53:1 dark. All eight screenshots were visually reviewed without clipping or overlap.
- Evidence boundary: `feature_list.json` now marks WIDG-4 `passing`; `session-handoff.md` records the completed local checkpoint. The startup `./init.sh` Win32 Error 5/global pip-check issue remains the known non-MPS blocker accepted by the owner; direct MPS suites are the completion evidence.
- Publication boundary: `origin/main` already contains stages 1–2 and checkpoint `cb1124f`; only the fully verified stage-3 commit is local-only after this session. No push/deploy occurred, and production remains without WIDG-4 until a new explicit approval and a complete rollback/migration/health/smoke/browser rollout cycle.

### Session 70 — 2026-08-30 (Codex, P0 post media Stage 1 RED)

- Goal: pause WIDG-4 publication and encode the confirmed mobile post-media failure as RED contracts only, without changing upload or rendering production code.
- Scope/files: `backend/tests/test_media.py` adds responsive variant/EXIF/no-original and two-image 700 KiB budget contracts; new `frontend/app/src/components/ImageCarousel.test.tsx` separates the already-correct inactive-slide guard from the missing responsive-source contract. Trackers only otherwise.
- Baseline: first sandbox attempts did not start (`WinError 5` pytest basetemp; `spawn EPERM` esbuild) and were not counted. Unchanged reruns outside sandbox passed backend media 11/11 and frontend RichTextContent+ArticleComments 2 files/18 tests.
- RED evidence: backend new target failed 2/2 because POST `/media` returned only `{url}` with no `variants`. Frontend new target reported 1 passed / 1 failed: the inactive second slide is not present before interaction, but the active image returned `srcset=null` instead of the responsive set. These are the expected Stage 1 outcomes; no GREEN claim is made.
- UX contract: mobile uses the generated 960px medium fallback; cover plus active carousel fallback are capped at 700 KiB total. At 400 Kbit/s this bounds their transfer near 14 seconds instead of the observed ~100 seconds. Upload accepts the existing up-to-10-MiB author file and normalizes it rather than rejecting it for resolution/encoded size.
- Boundary/next: no production code, dependency, database, VPS or published media changed. WIDG-4 remains local-only and paused. Wait for owner confirmation, then Stage 2 implements EXIF transpose plus 320/960/1600 WebP+AVIF variants and makes only the backend portion GREEN before stopping again.

### Session 71 — 2026-08-30 (Codex, P0 post media Stage 2 upload pipeline)

- Goal: make the accepted backend RED contracts GREEN without starting frontend Stage 3 or touching existing production media.
- Implementation: `POST /media` keeps the 10 MiB input/MIME/auth/error contract, applies `ImageOps.exif_transpose`, normalizes to RGB/RGBA, and generates `thumbnail/medium/large` at maximum dimensions 320/960/1600. Every variant has WebP fallback plus AVIF under one UUID; the original JPEG/PNG is never written. Response keeps `url` as the large WebP and adds width/height plus both URLs under `variants`.
- Size policy: each medium WebP and AVIF is iteratively encoded to at most 350 KiB. The two-photo test produced WebP 271342+271342=542684 bytes and AVIF 217476+217476=434952 bytes, both below the 700 KiB initial-page contract.
- RED→GREEN: fresh Stage 2 RED repeated 2 failed / 11 deselected because `variants` was absent. The unchanged new target then passed 2/2. Full `test_media.py` first exposed exactly five superseded legacy expectations (six files rather than one, twelve rather than two, and WebP fallback for AVIF input); after updating only those expectations it passed 13/13.
- Final verification: full backend `python -m pytest tests -q -p no:cacheprovider --basetemp ...` passed 130 tests with 10 known PostgreSQL-only skips because `MPS_TEST_POSTGRES_URL` is absent. No dependency, migration, frontend source, database, existing media, VPS, push or deployment changed.
- Boundary/next: `P0-POST-MEDIA` remains `in_progress`. Wait for owner confirmation, then Stage 3 handles responsive rendering, sanitizer attributes, async decoding, below-fold lazy loading and active-only carousel sources. WIDG-4 publication remains paused.

### Session 72 — 2026-08-30 (Codex, P0 post media Stage 3 frontend)

- Goal: complete only the owner-approved frontend stage, preserve the existing upload/backend contract, and stop before touching published media.
- Implementation: new shared `ResponsivePostImage` derives the backend `thumbnail/medium/large` WebP and AVIF sets from the returned large-variant URL. Article/feed/profile covers, inline rich text, active carousel frames, composer preview and TipTap image preview now use responsive sources with `sizes` and async decoding. Hero/active frames remain eager; inline and liked-post images are lazy. `RichTextContent` preserves only approved `loading/decoding/srcset/sizes` attributes, enhances already-sanitized inline markup, and never emits inactive carousel slide markup.
- RED→GREEN: the fresh accepted carousel RED repeated 1 failed / 1 passed because `srcset` was absent. Expanded related RED produced 7 expected failures / 44 passed across six files. The minimal implementation made the same target GREEN at 6 files / 51 tests.
- Final verification: fresh full `npm test` passed 29 files / 190 tests. `npm run build` passed with 123 modules; only the existing Vite CJS and chunk-size warning remained (`705.15 kB`, gzip `228.02 kB`). `git diff --check` passed apart from informational Windows line-ending notices.
- Browser evidence: isolated localhost data passed light/dark at 375/768/1024/1440. All cover/inline/carousel images fit without horizontal overflow and exposed AVIF source, WebP 320/960/1600 `srcset`, `sizes` and async decoding; inline used lazy, hero/active used eager. The second slide was absent before interaction and became the only rendered slide after click in all 8 combinations. Keyboard focus-visible was active, CSSOM parsed the 0.01ms reduced-motion fallback, browser console errors were empty, and text/card contrast measured 16.04:1 light / 14.43:1 dark.
- Evidence recorded: `feature_list.json` keeps `P0-POST-MEDIA` `in_progress` and appends Stage 3 evidence; `session-handoff.md` advances only to the Stage 4 approval gate.
- Boundary/next: no backend, existing media, DB, VPS, push or deployment changed. Create one local `[in_progress]` Stage 3 commit and stop. Stage 4 must begin only after a new owner confirmation and must back up then atomically migrate only `poezdka-v-tailand-2026`; WIDG-4 publication remains paused.

### Session 73 — 2026-08-30 (Codex, combined WIDG-4/P0 media production closeout)

- Goal: publish the four accepted local commits, deploy WIDG-4/backend/frontend, migrate the four production PNGs for `poezdka-v-tailand-2026`, prove the throttled improvement, and close the discovered AVIF MIME delivery gap under RED→GREEN.
- Rollback evidence: PostgreSQL `/var/backups/mps/mps-2026-08-30-084759.dump.gz` SHA `3912ffd2bc3d21da7f74ff93b781591391890f015fe77b64067cbff98e36689f` passed `pg_restore --list`; frontend archive SHA `afdb9b4cbde9c2aac10ca7367e82df204c469c7fc575491f5118045336f37f91`; post-row SHA `5586f418021864831eb47630258bfdb9d37d170c8cfb5bde08d88c54fc102c6c`; original-PNG manifest SHA `a68dd7201f9902eea5b5bd35104b5b1be568499e95a4165548531becae77bf33`. Available/enabled nginx backups have SHA `ced963e07a1da93ab8244f60702f9cea24b387164777f949f8b1056b8a179dcc` and `6fb3004d3fc419a019b09ec56206fdc057bbaff3b8ad65054bf7c28c0287bee7`.
- Deployment: origin/VPS fast-forwarded to `0b33784`; Alembic upgraded `20260829_0018 → 20260830_0019`, `pg_trgm=1` and three discovery indexes were confirmed. Backend became ready on attempt 2 and remained active/healthy. Production-configured frontend built 123 modules, served `index-Y8_k3Iw_.js` with both VITE markers and no localhost fallback, and smoke passed.
- Live media migration: the backup and live row hashes matched before mutation. Four originals produced four UUID sets and 24 decoded/hash-verified WebP/AVIF files; optimized manifest SHA is `ccbd75139039f4a3c233a33a8e47ac5335204b4fc0dd89425287da2b7548da6f`. Files were published before a guarded `SELECT … FOR UPDATE`/`UPDATE … WHERE old cover/body` transaction, which returned `UPDATE 1`. Cover plus three actual HTML references changed; originals were retained.
- MIME RED→GREEN: new deploy-bootstrap contract failed 1/4 because scoped types/cache were absent, then passed 4/4 after adding the media-only PNG/JPEG/WebP/AVIF map, preserved `try_files`, and `expires 30d`. Production had separate regular files in `sites-available` and `sites-enabled`; both were backed up and only the exact media blocks were atomically replaced. `nginx -t` and reload passed; backend PID stayed `1034912`. Public verification passed 24/24 hashes with AVIF=`image/avif`, WebP=`image/webp`, nosniff, max-age 2592000 and Expires; smoke passed again.
- Final performance/verification: at 400 Kbit/s, 400ms latency and CPU×4, iPhone load/network-idle was 7.945/21.434s and Pixel 7 was 7.490/20.851s versus the original 97–112s. Initial media was 418316 bytes, inactive slides were not requested, and failed requests/page errors were zero. The only non-2xx responses were the established guest 401s for `/me`, `/notifications`, `/auth/refresh`. Fresh backend passed `131 passed, 10 skipped`; frontend passed 29 files/190 tests; production-configured build passed 123 modules with the known chunk warning only.
- Result: `P0-POST-MEDIA` and WIDG-4 are production-deployed `passing`. Final commit contains only the scoped nginx template/RED contract and three trackers; no original media was deleted and no backend restart occurred during the MIME microfix.

### Session 74 — 2026-08-30 (Codex, WIDG-1 Stage 1 backend)

- Goal: complete only the approved WIDG-1 backend stage for a public tour-request lead form, then stop before frontend work.
- RED evidence: the new Stage 1 target failed 10/10 outside the known Win32 pytest sandbox because `/api/v1/tour-requests` was absent and returned 404 instead of the expected create/validation/failure/rate-limit contracts. A follow-up IP-isolation RED received 429 for a different `X-Real-IP`, proving that the direct peer key would combine visitors behind nginx.
- Implementation: migration `20260830_0020` and `TourRequest` add nullable user, sanitized name/contact/destination, optional string budget/comment, NEW/CONTACTED/CLOSED status, nullable Telegram message ID, mandatory stored consent and timestamp. Public POST associates a valid optional user, persists before delivery, limits nginx-overwritten `X-Real-IP` to 5/minute, and sends `#T{id}` to the existing managers chat through generalized `tg_relay.send_message()`. The existing Q&A `send()` wrapper and #Q routing remain intact. Relay failure retains the lead with null message ID and returns a token-safe 502 that explicitly says the request was saved.
- GREEN evidence: final Stage 1 target passed 10/10; focused per-IP contract passed 1/1; full Q&A regression passed 16/16. Isolated Alembic `0019 → 0020` exposed all 11 columns plus status/consent CHECK constraints, and downgrade removed the table. Fresh full backend passed `141 passed, 10 skipped`; skips are the pre-existing PostgreSQL-only cases without `MPS_TEST_POSTGRES_URL`.
- Boundary/next: WIDG-1 remains `in_progress`. No frontend/design-system files, production DB, VPS, push or deployment changed. After owner confirmation, Stage 2 starts with frontend RED contracts for `≤767px` FAB/fullscreen and `≥768px` desktop floating behavior, modal focus/escape/restore/scroll lock, countries/free text, consent and submit states.

### Session 75 — 2026-08-30 (Codex, WIDG-1 Stage 2 frontend and local closeout)

- Goal: complete the approved WIDG-1 frontend stage, run the full cross-stack/build/browser gate, mark the feature locally passing, and stop before push/deploy.
- RED→GREEN: new contracts first failed because `TourRequestWidget` and `useTourRequest` did not exist. The minimal implementation made the focused component/hook/Layout target GREEN at 3 files / 15 tests. The hook loads `/countries` only while the dialog is open and posts the exact public `/tour-requests` payload.
- Implementation: `Layout` mounts one global widget. CSS exposes only the lower-left FAB at `<=767px` with `bottom: calc(74px + env(safe-area-inset-bottom))`, and only the fixed left-rail card at `>=768px`. Both open the same fullscreen dialog with initial focus, focus trap, Escape, opener-focus restoration, body scroll lock and reduced-motion support. The form has visible labels, `type=tel`, country datalist plus unrestricted free text, field/consent errors, required 152-FZ consent with privacy link, disabled/loading state, safe server alert and success state. Structural icons are SVG. `design/DESIGN_SYSTEM.md` now records this exact WIDG-1 contract.
- Fresh verification: backend `141 passed, 10 skipped` with only the established PostgreSQL-only skips without `MPS_TEST_POSTGRES_URL`; frontend `31 files / 197 tests`; final production build `124 modules`, with only the existing Vite CJS/chunk-size warnings (`712.96 kB`, gzip `230.29 kB`).
- Browser evidence: isolated localhost API interception created no real lead and passed both themes at 375/768/1024/1440. The 375 FAB stayed above mobile-nav; desktop cards stayed inside the left rail without entering center content; dialog geometry was full viewport. Keyboard focus trap/Escape/restore, scroll lock, aria-modal/labels/errors, consent gate, success, 2px focus, reduced motion `0.00001s`, zero horizontal overflow and CTA contrast `6.22:1` light / `7.37:1` dark all passed in 8/8 combinations.
- Boundary/next: WIDG-1 is locally `passing`. Stage 1 commit `6711b0f` and the new Stage 2 commit remain local-only; no push, production migration, VPS access or deploy was performed. Wait for one explicit owner confirmation before publishing both commits together.

### Session 76 — 2026-08-30 (Codex, WIDG-2 Svyazio integration)

- Goal: diagnose and locally integrate one global Svyazio support widget without push/deploy, preserving its vendor-managed appearance and standard fullscreen mobile chat while removing the confirmed mobile-nav collision.
- Diagnosis: neither the nginx template nor current production response defines CSP; HSTS, `nosniff` and `SAMEORIGIN` remain intact. The live script/API returned 200 without console/request failures and renders an ordinary host with open Shadow DOM, not an iframe. Its default 375px launcher overlapped mobile-nav by 44px; the public script supports side positions but no numeric bottom offset.
- RED→GREEN: the new Layout-level contract first failed 3/3 because no script/config/style existed. The minimal global component made all 3 GREEN: exact org/server config, one async ID-addressed script across repeated mounts, mobile-only launcher/teaser style, no fullscreen/desktop rule, and observer-based recovery after style removal or host replacement. A build-only TypeScript nullable-ShadowRoot error was fixed by explicit branch narrowing; targeted tests remained 3/3.
- Implementation: `Layout` mounts `SvyazioWidget` once. The component leaves the global script in place across SPA route/remount cycles, cleans up its document/shadow observers on unmount, and injects only `@media (max-width: 767px)` with `bottom: calc(74px + env(safe-area-inset-bottom)) !important` for `.svyazio-launcher` and `.svyazio-teaser`. `.svyazio-window`, desktop positioning, colors and vendor behavior are untouched.
- Fresh verification: full frontend passed 32 files / 200 tests. Production-configured build passed 125 modules; only the established Vite CJS/chunk-size warnings remained (JS 714.12 kB, gzip 230.80 kB). Real Chrome plus live Svyazio passed light/dark 8/8 at 375/768/1024/1440 with one script, exact config, `#C08E37`, zero horizontal overflow, clickable chat and no page/Svyazio request failures. At 375 the launcher moved to `y=678..738` while nav was `y=753..812`, eliminating both the previous 44px nav overlap and WIDG-1 overlap; chat opened fullscreen 375x812. At >=768 the vendor bottom remained 24px and its open window remained 400x600.
- Known vendor boundary: the current third-party launcher has no accessible name in its Shadow DOM. The approved scope deliberately does not rewrite vendor interaction semantics; record this for vendor escalation or a separately approved accessibility contract.
- Publication boundary: WIDG-2 is locally `passing`; no push, VPS access, production file or deployment changed. Create one local commit and wait for explicit publication approval.

### Session 77 — 2026-08-31 (Codex, Vite/Vitest upgrade, Stage 4 before final commit)

- Goal: finish only the approved backend regression and three-tracker closeout for Vite 6.4.3 / Vitest 3.2.6; keep the final commit behind a separate owner confirmation.
- Completed: existing local commit `06dd1b8` changes only `frontend/app/package.json` and `package-lock.json`, using explicit `^6.4.3` / `^3.2.6` ranges and retaining `@vitejs/plugin-react` 4.7.0. No `npm audit fix --force`, application/test changes, runtime dependency changes or backend changes. This stage updates only `feature_list.json`, `claude-progress.md`, `session-handoff.md`.
- Accepted earlier evidence, not rerun in Stage 4: Stage 1 audit reduced 5 findings (3 moderate, 1 high, 1 critical) to 0. Stage 2 first run passed 32 files / 200 tests in 49.26s, including hooks/routing/editor, with 0 fixes. Stage 3 production build passed with Vite 6.4.3, 121 modules, JS 731.91 kB / gzip 232.01 kB; only the chunk warning remained. Actual dev HMR applied a module edit without reload and preserved page state. Real-dist preview passed both themes at 375/768/1024/1440 (8/8), including theme switching, modal focus/Escape, direct /about, zero overflow/page errors/broken visible images and loaded Svyazio. Public API/media GET requests were bridged read-only to production for local CORS and nginx media behavior; no production writes. Served `index-Cx13uxnX.js` matched dist SHA-256 `10aab2d75ed5501f94431932ad0f72fc01eb5d29134971d15ae3e18288501009`, production API/bot markers were present and localhost fallback absent.
- Verification run, fresh Stage 4: `npm audit --registry=https://registry.npmjs.org` returned `found 0 vulnerabilities`, exit 0; installed versions were Vite 6.4.3 / Vitest 3.2.6. Initial `python -m pytest tests -q -rs -p no:cacheprovider --basetemp D:/mps-platform-full/.pytest-vite-stage4-0831` passed 141 with 10 PostgreSQL-only skips (3 discovery, 3 forum, 4 Irishka).
- Environment diagnosis: Docker Desktop was initially stopped. An isolated `postgres:16` container `mps-vite-stage4-pg-0831` exposed only loopback port 55436 with a disposable test DB. The first full PostgreSQL run returned 149 passed / 2 failed: discovery called missing `similarity()` because the fresh DB lacked `pg_trgm`; its fixture uses `Base.metadata.create_all`, not migrations. Existing migration `20260830_0019` already installs this extension. With process-scoped `DATABASE_URL` pointing only to the disposable DB, `python -m alembic upgrade head` completed through `20260830_0020`; no SQL/schema workaround or test edit was added.
- Final verification: unchanged `tests/test_discovery.py` passed 6/6 in 2.10s. From backend, with process-scoped `MPS_TEST_POSTGRES_URL`, `python -m pytest tests -q -rs -p no:cacheprovider --basetemp D:/mps-platform-full/.pytest-vite-stage4-pg-final-0831` passed **151 tests in 55.26s, 0 skipped, exit 0**. Backend diff from `38c6e07` is empty. The temporary `--rm` PostgreSQL container was stopped after verification; Docker Desktop is returned to its initial stopped state when no other containers are running.
- Evidence recorded: TOOLING-VITE6 now contains the audit regression, accepted frontend/build/browser results, initial environment failures and final full backend result. Stage 3 screenshots/report remain outside git at `C:/Users/vin-m/.codex/visualizations/2026/08/31/01a057ec-8c49-78c0-9ff1-976f3a32506e/`. Prior production rollback inventory is preserved in the handoff.
- Commits: only `06dd1b8` exists for this upgrade. Stage 4 makes no commit/amend, push, deployment or production connection. TOOLING-VITE6 remains `in_progress` pending the explicitly requested final-commit approval and post-commit state check; this is not an unresolved test failure.
- Known risks: existing >500 kB chunk warning; known external `init.sh` Win32/global pip-check failures; `.codex/skills/*.md` text-rule gap unchanged. Existing F47/F48c scopes untouched. An empty PostgreSQL test DB must be prepared by the existing migrations before running discovery tests. Previous accepted frontend/build/browser evidence is dated, not represented as a Stage 4 rerun. No fake RED tests were created for this tracker-only step; both requested skills were read and applied.
- Tracker verification: JSON parsed successfully with 61 unique feature IDs; all 60 previous records are byte-equivalent as parsed objects, including F47/F48c. Exact changed-file allowlist is the three trackers; staged diff is empty, backend diff is empty, and `git diff --check` passed. Docker Desktop stop completed with exit 0 after automatic removal of the test container.
- Next best action: present the result and wait for separate owner confirmation of the final local commit. Recheck scope/diff before committing and clean state afterwards. Do not infer permission to publish or deploy.

### Release authorization — 2026-08-31 (after Session 77)

- Owner accepted Stage 4 and explicitly authorized a separate commit of exactly the three trackers above `06dd1b8`, then `git push origin main` and deployment of both commits together. Do not rewrite the dependency commit.
- TOOLING-VITE6 is now locally `passing` on the accepted audit/frontend/build/browser/backend evidence. At preparation of this tracker commit, production deployment is still pending; no backup SHA, live revision or smoke success is claimed in advance.
- Approved release boundary: backup existing frontend and record its path/SHA-256; fast-forward checkout; install the lockfile and rebuild with the existing production public VITE values; verify generated and served bundle, backend health and unchanged PID, then run `deploy/smoke.sh`. No backend restart, backend dependency installation or production DB migration is authorized or required by this frontend-only change.

### Session 78 — SEC-HEIF-STOPGAP, 2026-09-01

- Goal: owner's urgent temporary HEIC/HEIF disablement for GHSA-g89c-p67h-r497, separate from all other audit findings; local commit only.
- Completed: removed HEIF opener registration from the application and restricted upload decoding to JPEG/PNG/WebP/AVIF. Explicit HEIF MIME receives 422 immediately; disguised HEIF is declined by the decoder allowlist and receives the same clear temporary message. Header recognition is used only for the error text after safe decoders decline, so valid AVIF with a generic mif1 brand is retained. Existing size/EXIF/resize/encode/storage pipeline is unchanged.
- Verification run: RED target before application edits produced 10 failed / 4 passed / 6 deselected. Six real HEIF uploads were accepted, including four supported-MIME disguises; two synthetic registered-opener guards were called. The format-list message and existing generic-brand AVIF dispatch also failed. The AVIF failure was diagnosed as HEIF opener selection, not patched by weakening the test. GREEN test_media.py: 20 passed in 9.16s. Full backend: 158 passed in 64.14s with zero skipped on a disposable loopback-only PostgreSQL 16 DB prepared through the existing Alembic chain to 20260830_0020. Test container automatically removed after the run; no production DB was used.
- Evidence recorded: SEC-HEIF-STOPGAP contains the commands and observed results. flake8 E4/E7/E9/F passed on the two changed Python files using --jobs=1; default multiprocessing was blocked by the sandbox before linting. init.sh failed at the known Git Bash Win32 Error 5 before pip installation. These infrastructure failures are not reported as passing checks.
- Commits: a separate local SEC-HEIF-STOPGAP commit is authorized over 07566c8, without amend/squash, push or deploy. Its SHA will be reported after creation rather than guessed in this record.
- Final pre-commit verification: `python -m pytest tests/test_media.py -k 'temporarily_rejects or never_calls_registered' -q --tb=short -p no:cacheprovider --basetemp D:/mps-platform-full/.pytest-heif-target-final-0901` returned **8 passed, 12 deselected in 2.64s**. JSON validates with 62 unique feature IDs and all previous 61 records unchanged. Exact five-file scope, one-job flake8 and `git diff --check` passed.
- Known risks: production remains exposed until the separately approved deployment; the native library remains vulnerable and installed. The frontend picker is intentionally unchanged and may still offer HEIC, but the API supplies a clear rejection. No dependency upgrade, media DoS/rate-limit/auth fix, frontend change or production access is mixed into this stopgap. F47/F48c and the text-rule gap are unchanged.
- Next best action: present local commit and verification evidence; await explicit push/deploy approval. Permanent follow-up: verified libheif >=1.23.2, then RED/GREEN HEIC restoration and full regression.

### Session 79 — production releases and security-audit documentation closeout, 2026-09-01

- Goal: close the completed Vite/Vitest release, urgent HEIF stopgap deployment and 13-category security audit; record the owner's ordered remediation backlog without mixing in new fixes.
- Completed: TOOLING-VITE6 remains production-deployed passing at 06dd1b8 + 07566c8; five npm findings became zero. SEC-HEIF-STOPGAP remains production-deployed passing at 12203dd; native libheif is still vulnerable and HEIC is temporarily disabled. Both external audit reports exist and were read; their diagnostic snapshot and still-open findings are preserved. Handoff now prioritizes libheif restoration, AUTH_BOT_TOKEN rotation, then stable VPS Python and 33-package drift remediation.
- Verification run: fresh closeout npm audit returned total=0, exit 0; SSH preflight confirmed VPS 12203dd, clean tracked tree, Vite 6.4.3 / Vitest 3.2.6, media.py 644, active/running backend and healthy public endpoint. Prior live stopgap verification returned HEIC 422 (including renamed JPEG), JPEG 200 with six variants, public WebP/AVIF GET/decode success, cleanup remaining=0 and smoke exit 0. Prior full backend 158/158 and frontend 200/200/build/browser evidence is retained, not represented as rerun in this documentation step. Both requested skills were read and applied; no artificial RED test or new code change was introduced.
- Evidence recorded: D:/mps-platform-full/heif-stopgap-release-20260901/verification.md; C:/Users/vin-m/.codex/visualizations/2026/08/31/01a057ec-8c49-78c0-9ff1-976f3a32506e/vite6-production-release.md; D:/mps-platform-full/security-audit-20260831/report.md and dependencies.md. Backend rollback source 07566c8: /root/backups/mps-heif-stopgap-20260831T161551Z/backend-before.tar.gz, SHA-256 600b90b4cd7e331c2439fb2cb57188646409657535331cb827074ccf80aabbab. Frontend rollback: /root/backups/mps-frontend-vite6-20260831T151143Z/frontend-dist.tar.gz, SHA-256 43acd2f719b648e00932819816923e98df69d78096d0b7b715ec920e638efe46. No new backup, DB mutation, dependency install or service restart is part of this docs-only closeout.
- Commits: owner explicitly authorized one three-tracker documentation commit over 12203dd, push to origin/main and final local/origin/VPS synchronization without another permission request. Do not amend/squash the already released commits. Pre-commit gates are JSON validation, unchanged other 60 feature objects and statuses, exact three-file allowlist and git diff --check; after push, verify the resulting SHA on GitHub and VPS with unchanged backend PID and health. The commit's own SHA and post-push results are reported after execution, not fabricated in this pre-commit record.
- Known risks: the deployment script can reproducibly leak umask 077 into checkout, leaving backend files at 600 instead of 644 and preventing service startup; recovery to 644 does not fix the workflow. Review/fix before a future restart where possible, with service-user read checks and isolated backup permissions. Historical AUTH_BOT_TOKEN exposure occurred twice; no token value is recorded and no rotation was done. Python 3.11.0rc1 and 33 version differences remain unresolved; no exploit/compromise is inferred merely from the findings. Existing F47/F48c, vendor Svyazio notification boundary, init.sh exceptions and text-rule gap remain open and unchanged.
- Next best action: separately scope the permanent libheif >=1.23.2 upgrade and HEIC re-enable with RED/GREEN and full regression; then token rotation; then stable Python plus a reproducible dependency graph. Keep the current stopgap active until verified replacement, and do not run pytest against production databases.
