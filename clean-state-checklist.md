# clean-state-checklist.md — финальная production control point 2026-08-20

## Session 62 REV-2 local completion — 2026-08-29

- [x] Scope is limited to review photo persistence/API, the existing review form/hooks/styles, regressions and handoff trackers. No dependency, secret, push, production configuration, migration execution, restart or deployment changed.
- [x] Backend RED: 4/4 expected failures (two-photo DTO missing, third URL accepted, 1001 characters accepted, `/reviews/mine` absent). GREEN: 4/4; full review target 8/8; isolated SQLite Alembic upgrade reached `20260829_0018 (head)`.
- [x] Frontend RED: 3 expected failures for picker, counter/limit and persistent own statuses. GREEN: `Reviews.test.tsx` 8/8.
- [x] Full backend: 125 passed / 7 PostgreSQL-only skips. Full frontend: 23 files / 155 tests. `npm run build`: 118 modules, success, only the existing chunk-size warning.
- [x] Final `./init.sh` reached global pip check then stopped on shared Hermes/desktop conflicts; an earlier Git Bash invocation hit Win32 Error 5 before execution. Both are external to MPS and complete MPS verification ran independently.
- [x] `feature_list.json` records REV-2 as `passing` only after the fresh evidence above. `claude-progress.md` and `session-handoff.md` preserve the separate production rollout gate.
- [x] Pre-commit validation: JSON parse, Alembic single head, `git diff --check`, exact staged-name status and clean status after local-only commit. Push/deploy remain unapproved.

## Session 96 F48d production closeout — 2026-08-28

- [x] Scope is tracker-only: `feature_list.json`, `claude-progress.md`, `session-handoff.md` and this checklist. No application source, dependency, database, production configuration, service or deployment state changes in this closeout.
- [x] Fresh preflight confirms all 48 current feature records are `passing`, zero are `in_progress`, and F48d is `passing`. F46/F47 remain open backlog labels rather than active feature records; F48 a/b/c was not audited.
- [x] Local `HEAD`, `origin/main` and VPS were rechecked at `01c505d332b6a9bce8ee4aa000c1ae785a01e5be`; the live F48d bundle is referenced by production HTML.
- [x] F48d production evidence is preserved: rollback `/root/backups/mps-frontend-f48d-20260827T173146Z.tar.gz`, SHA-256 `947cbb4d6f304beaca7748a054afac3c98b7b1d0eabb908c90dcc3c68c4aa17e`; served bundle HTTP 200 with production VITE values/F48d marker and no localhost fallback; `deploy/smoke.sh` passed.
- [x] Backend non-interference is explicit: F48d had zero backend diff files, no restart occurred, and the same PID 805788 remains active with health `ok`.
- [x] The prior coordination attachment was context only. No F46/F47 diagnostic or implementation task was started, and the agreed order is F46 → F47 → confirm F48 a/b/c → web design last.
- [x] The prompt-supplied verification-before-completion and TDD rules were applied textually. Their `.codex/skills/*.md` files remain physically absent as a known gap; no artificial RED run was created for documentation-only changes.
- [x] Pre-commit gate: JSON validated with 48/48 passing and zero `in_progress`; `git diff --check` passed; the exact four-file staged allowlist was inspected. Create local commit `docs: финальное состояние F48d`, then immediately confirm clean status with `main` one commit ahead of `origin/main`. Push remains unapproved.

## Session 95 F48d local completion — 2026-08-28

- [x] Scope is limited to confirmed `/about` content, its directly related frontend regression assertions and trackers. Existing route, CSS/layout, perks, SunLogo and Telegram CTA are preserved; backend, schema, dependencies, secrets, production, push and deployment are unchanged.
- [x] RED `npm test -- --run src/components/About.test.tsx --reporter=verbose` — 3 expected failures / 0 passed: ten confirmed content markers absent, former placeholder-style copy present and no contact link rendered without public settings.
- [x] GREEN same target — 3 passed. Confirmed heading/body/contact content is rendered, old placeholder/lorem is absent and every rendered link has a usable target.
- [x] The first full suite exposed only two stale expectations directly caused by the intentional content replacement. One compatible contact-node adjustment and one updated heading assertion were sufficient; the second full run passed 22 test files / 142 tests.
- [x] `npm run build` passed: `tsc -b && vite build`, 117 modules transformed; only the existing chunk-size warning was emitted.
- [x] Named isolated `agent-browser` verification opened local `/about`: all required text was readable; old placeholder/lorem was absent; three links were visible with nonempty HTTPS targets; no broken images were present. `.about-heading`, `.about-text` and `.about-contacts` had visible overflow, no line clamp, equal scroll/client heights and `clipped=false`.
- [x] Final `./init.sh` outside sandbox exited 1 only at the explicitly excluded external Hermes/desktop global pip-check before MPS pytest; complete frontend verification passed separately and the shared environment was not repaired.
- [x] `feature_list.json` records F48d as `passing` only after fresh evidence. Progress and handoff preserve production at `a5186bc` and explicitly mark F48d as local-only.
- [x] The agreed verification-before-completion and TDD rules were applied textually. Their `.codex/skills/*.md` files remain physically absent from the checkout as a known process gap.
- [x] Pre-commit validation: JSON parsed with 48/48 records `passing` and zero `in_progress`; `git diff --check` passed; the exact seven-file staged name-status allowlist was inspected before the local commit. Final status is checked immediately after commit to confirm `main` ahead of `origin/main` by one with no unstaged/untracked files. Push/deploy remain unapproved.

## Session 93 F45 local completion — 2026-08-28

- [x] Scope is limited to background Иришка concurrency control, PostgreSQL regression coverage, migration `20260828_0017` and trackers. Scheduler cadence, interactive Q&A, frontend, dependencies, secrets, production database/service, push and deployment are unchanged.
- [x] PostgreSQL RED reproduced the exact race as `([1, 1], 2 provider calls, 2 AI rows, messages_count=2)` against the expected `([1, 0], 1, 1, 1)`.
- [x] GREEN uses a transaction-scoped PostgreSQL advisory lock before MiniMax/Telegram, ForumTopic `FOR UPDATE` plus a final message recheck, and a separate commit/rollback boundary for each topic. Full `test_irishka.py` passed 19 tests.
- [x] Migration `20260828_0017` adds partial unique index `uq_forum_messages_one_ai_per_topic` on `(topic_id) WHERE is_ai IS TRUE`; ORM metadata has the same PostgreSQL/SQLite semantics.
- [x] Isolated PostgreSQL cycle passed `20260827_0016 → 20260828_0017 → 20260827_0016 → 20260828_0017`. Index count was 0 after downgrade and restored after re-upgrade; multiple human rows were accepted and a second AI row was rejected.
- [x] Full backend ran with `MPS_TEST_POSTGRES_URL` present: 126 passed in 52.04s with no PostgreSQL skips.
- [x] Final `./init.sh` outside sandbox exited 1 only at the known external Hermes/desktop global pip-check before MPS pytest; the complete MPS suite was run separately and passed. The shared environment was not repaired.
- [x] `feature_list.json` records F45 as `passing` only after the complete evidence; progress and handoff preserve production at `9ab7b0e` / Alembic `20260827_0016` until a separately approved rollout.
- [x] The agreed verification-before-completion and TDD rules were applied textually. Their `.codex/skills/*.md` files remain physically absent from the checkout as a known process gap.
- [x] Pre-commit validation: JSON parsing, Alembic single-head `20260828_0017`, `git diff --check` and the exact eight-file staged name-status inspection passed. The commit is local only; push/deploy remain unapproved and final clean status is checked after commit.

## Session 91 F37 Session D local completion — 2026-08-27

- [x] Scope is limited to nullable fishka category storage/API, the supplied versioned 160-item source and importer, `/fishki` category filtering, the approved emoji expansion, regressions and trackers. No production database/import, push, deployment, service, secret or unrelated dependency changed.
- [x] Package D1 RED stopped at the expected missing `app.management.import_fishki`; target GREEN — 13 passed. Parser coverage proves 160 contiguous items, 13 blocks, actual working category names and preservation of numbered body text.
- [x] Isolated Alembic cycle passed: `20260826_0015 → 20260827_0016 → 20260826_0015 → 20260827_0016`; `posts.category VARCHAR(120)` is nullable at `0016` and absent after downgrade. The temporary SQLite database was removed.
- [x] Isolated management CLI passed: dry-run planned 160 and persisted 0; first apply inserted 160; second apply inserted 0 and matched 160 unchanged; final counts were 160 fishki, 13 categories and 0 activity events. The temporary SQLite database was removed.
- [x] Package D2 RED — 2 expected failures / 34 passed because the filter and extended picker were absent. GREEN target — 36 passed. Exact duplicates `🏨` and `📱` occur once; visually similar but ordinally different Unicode variants remain available.
- [x] Full backend — 119 passed / 3 skipped. Full frontend — 21 test files / 139 tests passed. `npm run build` — success, 117 modules; only the standard Vite chunk-size warning.
- [x] Final `./init.sh` outside sandbox exited 1 only at the known external Hermes/desktop global pip-check before MPS pytest; complete MPS suites were run separately and passed. The shared environment was not repaired.
- [x] `feature_list.json` records F37 Session D as `passing`, corrects Session C to production-deployed at `b2b41fb`, and preserves production import as a separately approved step. Progress and handoff record production Alembic still at `20260826_0015` until deployment.
- [x] The agreed verification-before-completion and TDD rules were applied textually. Their `.codex/skills/*.md` files remain physically absent from the checkout as a known process gap.
- [x] Pre-commit validation includes JSON parsing, `git diff --check`, exact staged name-status inspection and a local commit only. Push/deploy remain unapproved; final worktree status is checked after the commit.

## Session 90 F37 Session C local completion — 2026-08-27

- [x] Scope is limited to the admin-only `/fishki` setting panel, typed frontend hook, routing regressions, styles and trackers. Backend/API/schema/dependencies/secrets/production are unchanged; no push or deploy is authorised.
- [x] RED target — 1 expected failure / 32 passed because the admin checkbox was absent. GREEN target — 34 passed including toggle persistence, editor isolation and failed-PATCH state preservation.
- [x] Full frontend — 21 test files / 137 tests passed. Relevant backend regression `tests/test_admin.py tests/test_posts.py` — 14 passed in 7.23s.
- [x] `npm run build` — success, 117 modules; standard Vite chunk-size warning only.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global pip-check before MPS pytest; complete relevant project checks were run separately. The shared environment was not repaired.
- [x] `feature_list.json` records F37 Session C as `passing`; Session D remains separately deferred. Progress and handoff preserve the production boundary at `0e49bbe`.
- [x] The agreed verification-before-completion and TDD rules were applied textually. Their `.codex/skills/*.md` files remain physically absent from the checkout as a known process gap.
- [x] Pre-commit validation: JSON parsed, `git diff --check` passed and the exact ten-file staged name-status was inspected. The commit remains local; final worktree cleanliness is reported after it.

## Session 89 F38 Package 3–F44 production closeout — 2026-08-26

- [x] Scope is tracker-only: `feature_list.json`, `claude-progress.md`, `session-handoff.md` and this checklist. No application source, dependency, database row, production configuration, service or deployment state changed.
- [x] F38–F44 are recorded as `passing` and production-deployed at their actual revisions: `21e55ac`, `e688773`, `4f868ef`, `1782b5a`, `3d6ac1c`, `2ffb60d`, `0e49bbe`. F37 correctly remains `in_progress` because Sessions C/D were not started.
- [x] Current-state evidence records production revision `0e49bbe`, Alembic `20260826_0015 (head)`, active/healthy backend, production VITE markers without localhost and passing smoke from the approved F44 rollout.
- [x] The handoff explicitly preserves the external Unisender/HostKey email blocker, paused F37 C/D, deferred Иришка duplicate-run/admin UI work, low-priority forum N+1 follow-up and five npm advisories as separate future scopes.
- [x] F38 is closed for delivered Packages 1–3; the two unstarted Иришка enhancements are explicitly deferred and do not masquerade as completed implementation.
- [x] Final `./init.sh` stopped only at the known external Hermes/desktop global pip-check before MPS tests; no environment repair was attempted.
- [x] Before the authorised local commit: validated `feature_list.json`, proved F38–F44 all passing, ran `git diff --check`, inspected the exact four-file staged allowlist and created the local commit. Push remains unapproved; final worktree cleanliness was checked after the commit.

## Session 88 F44 local completion — 2026-08-26

- [x] Scope is limited to the Q&A one-shot deep-link, bell/acknowledgement/answer presentation, owner soft archive, migration `20260826_0015`, regression tests and trackers. No push, production database, configuration, service or deployment state changed.
- [x] Package A RED — 4 expected failures / 33 passed; GREEN — 3 files / 37 passed. Deep-link selects once and leaves all three tabs free; bell, guidance message and distinct incoming answer are covered.
- [x] Package B RED backend — 2 expected failures / 14 deselected; RED frontend — 2 expected failures / 5 passed. GREEN backend — 2 passed / 14 deselected; GREEN frontend — 2 files / 7 passed.
- [x] Archive is owner-only and non-destructive: `/qa/my` hides archived rows, the database retains them, and a late Telegram reply clears `archived_at` and restores the answered thread.
- [x] Full backend — 115 passed / 3 skipped. Full frontend — 21 test files / 134 tests passed.
- [x] `npm run build` — success, 116 modules; standard Vite chunk-size warning only. Alembic single head is `20260826_0015`.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global pip-check conflicts before MPS tests; no environment repair was attempted. The complete MPS suites were run separately and passed.
- [x] `feature_list.json` records F44 as `passing`; progress and handoff state that production needs a fresh PostgreSQL backup, migration, backend restart and frontend rebuild under separate approval.
- [x] Before the authorised local commit: validated JSON, ran `git diff --check`, inspected the exact staged name-status and created the local commit. Push/deploy remain unapproved; final status was checked after the commit.

## Session 87 F43 local completion — 2026-08-26

- [x] Scope is frontend Q&A notification deep-link, correct manager/lawyer label, conditional polling, regression tests and trackers. No backend, API, database, migration, credential or production state changed.
- [x] RED target `npm test -- --run src/App.routing.test.tsx src/hooks/useQA.test.tsx` — 3 expected failures / 30 passed: qa_answered notifications were not interactive and `useQA` fetched only once.
- [x] GREEN same target — 33 passed: exact Question target controls label/tab, the linked thread is shown and scrolled into view, only the clicked notification is marked read, and 30-second polling stops after answer/unmount.
- [x] Full frontend suite — 21 test files / 129 tests passed.
- [x] `npm run build` — success, 116 modules; standard Vite chunk-size warning only.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global pip-check conflicts before MPS tests; no environment repair was attempted.
- [x] F43 is marked `passing` locally with push/deploy explicitly deferred until separate approval.
- [x] Before the authorised local commit: validate feature_list.json, run `git diff --check`, inspect the exact staged name-status and confirm a clean worktree after commit.

## Session 86 F41 production activation closeout / F43 open note — 2026-08-26

- [x] Scope is tracker-only: `feature_list.json`, `claude-progress.md`, `session-handoff.md` and this checklist. No application source, production environment, database row, webhook registration or service state changed.
- [x] Fresh production getWebhookInfo reports the registered HTTPS webhook, `allowed_updates=[message]`, `pending_update_count=0` and no last error; mps-backend is active and health is `{status:ok,version:0.1.0}`.
- [x] Fresh production DB verification confirms #Q4 manager and #Q5/#Q6 lawyer are all `answered` with answer, responder, answered_at and outgoing Telegram message ID saved. Both relay directions are therefore end-to-end verified.
- [x] F41 is fully `passing`, deployed and production-activated at `1782b5a`; its evidence no longer says activation is pending.
- [x] The stale state of an already-open Q&A modal is recorded separately as F43 `open`, not `in_progress`; no implementation was started.
- [x] Pre-commit checks: JSON and whitespace validated; the exact diff contains only the four allowed tracker files. Stage only these files and verify staged name-status before committing; confirm the clean worktree after commit in the session report.

## Session 85 F41 local code completion — 2026-08-26

- [x] Scope is backend webhook transport, the dormant optional bridge adapter, outbound relay token redaction, backend tests and trackers. No migration, frontend source, production .env, webhook registration, token replacement, queued Telegram update or production database row changed.
- [x] RED target `tests/test_qa.py -k "telegram_webhook or telegram_relay_error"` — 5 expected failures: absent endpoint returned 404; raw HTTPStatusError included test token URL.
- [x] GREEN same target — 5 passed: missing/wrong webhook secret returns 401 without persisting; manager and lawyer replies update Question; ERROR/raised relay failure do not contain the token.
- [x] Full Q&A suite — 14 passed. Full backend in complete Windows-safe groups — 26 passed; 46 passed/3 skipped; 29 passed; 12 passed — 113 passed/3 skipped total; collect-only — 116.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global pip-check conflicts before MPS pytest; no environment repair was attempted.
- [x] F41 is marked `passing` as code with activation explicitly deferred: only after separate approval may a fresh BotFather token and generated TELEGRAM_WEBHOOK_SECRET be written on the VPS and setWebhook called. Pending updates must not be dropped.
- [x] Before the authorised local commit: run `git diff --check`, validate feature_list.json, inspect staged allowlist and confirm clean status after commit.

## Session 84 F42 local completion — 2026-08-26

- [x] Scope is limited to the shared MiniMax response sanitizer, direct-Q&A regression tests and feature trackers. No API contract, frontend source, database, migration, credential or production state changed.
- [x] RED target `tests/test_qa.py -k reasoning` — 1 expected failure / 2 passed: the endpoint exposed the complete `<think>…</think>` prefix.
- [x] GREEN same target — 3 passed: a closed leading reasoning block is removed; ordinary text and unclosed `<think>` content are returned unchanged.
- [x] Full backend in complete Windows-safe groups — 26 passed; 46 passed/3 skipped; 24 passed; 12 passed — 108 passed/3 skipped total.
- [x] `npm run build` — success, 116 modules; standard Vite chunk-size warning only. Frontend source and API contract did not change, so no frontend test suite was required.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` conflicts before MPS pytest; no environment repair was attempted.
- [x] F42 was subsequently pushed and deployed backend-only at `3d6ac1c`: a fresh PostgreSQL backup preceded healthy mps-backend restart and deploy/smoke.sh pass; frontend was unchanged.

## Session 83 F41 read-only relay diagnosis — 2026-08-26

- [x] Scope is diagnosis and tracker evidence only. No application code, Telegram configuration, systemd service, queued update, backend environment or production database row was changed.
- [x] Current relay bot identity is verified without printing its token. `getWebhookInfo` reports an empty URL and `pending_update_count=4`; this rules out an active webhook delivery path.
- [x] No MPS long-polling worker/process is present. The separate active `pod-solncem-bot.service` polls another bot and has no `bot_bridge` / `qa-answer` integration.
- [x] MPS backend, system and nginx logs for the current day contain no inbound bridge request. Technical DB check confirms #Q4 remains MANAGER/OPEN with no answer while its outgoing Telegram message ID exists.
- [x] Source inspection confirms a same-group reply would expose `reply_to_message` and the current router can parse #Q{id}; its manager-only chat filter remains a separate lawyer-direction risk.
- [x] `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` conflicts before MPS pytest; no repair was attempted.
- [x] F41 is registered `in_progress` with read-only evidence. An explicit plan/approval is required before any inbound transport configuration or code change.

## Session 82 F40 local completion — 2026-08-26

- [x] Scope is limited to the Q&A footer layout, its frontend regression test, Vitest CSS-test support and the F40 trackers. No API, database, dependency, credential or production code/configuration changed in this part.
- [x] First F40 part remains live-verified: the approved relay configuration repair confirmed the intended bot and delivery for lawyer #Q2 and manager #Q3. Their shared numerical `message_id=5` is valid because Telegram numbers messages independently per chat.
- [x] RED `npm test -- --run src/components/QA.test.tsx` — 1 expected failure: the shared footer had no dedicated responsive composer contract.
- [x] GREEN same target — 1 passed: Manager, Lawyer and Иришка ИИ each have a 100%-wide, 96px-minimum textarea, a consent checkbox/policy link and an independently classed submit control. Vitest now loads the actual stylesheet through `css: true`.
- [x] Full frontend `npm test -- --run` — 20 files / 125 passed. `npm run build` — success, 116 modules; standard Vite chunk-size warning only.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` before MPS pytest; no external environment repair was attempted.
- [x] `feature_list.json` is updated with relay and CSS evidence, F40 is marked `passing`, and progress/handoff are current. Production CSS rollout is intentionally unapproved.
- [x] Before commit: run `git diff --check`, validate `feature_list.json`, inspect the staged file list and confirm a clean working tree after the authorised local commit.

## Session 81 F39 local verification — 2026-08-26

- [x] Scope is limited to default public post-list filtering, the `/fishki` fetch parameter, a defensive Feed filter, regression tests and trackers. No migration, CSS, credentials or production state changed.
- [x] RED backend — default `GET /posts` returned fishka ID 3; RED frontend — normal Feed rendered fishka and `/fishki` did not request `type=fishka`.
- [x] GREEN target — backend 1 passed; frontend 2 files / 35 passed. Full backend groups — 38 passed/3 skipped, 28 passed, 12 passed, 27 passed: 105 passed/3 skipped. Full frontend — 19 files / 124 passed. `npm run build` — success, 116 modules, standard Vite chunk-size warning only.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` before MPS pytest; no environment repair was attempted.
- [x] F39 is locally marked `passing` with evidence. Commit, push and production deployment remain unapproved; run `git diff --check`, JSON validation and final status immediately before any commit.

## Session 80 F38 Package 3 local verification — 2026-08-26

- [x] Scope is limited to the direct interactive Иришка Q&A endpoint, supplied local JSON knowledge base, shared MiniMax transport, existing QA modal, tests and trackers. No migration, scheduler business logic, Question/ForumMessage persistence, credentials or production state changed.
- [x] Knowledge JSON was copied unchanged: 248 records, 247315 bytes, SHA-256 `FD8D446F520BE20837138CE4565A1E0D33907966FF0444AAC230AF0859A61C0C`.
- [x] RED backend `tests/test_qa.py` — 3 expected missing-endpoint 404 failures; GREEN `tests/test_qa.py tests/test_irishka.py` — 21 passed. RED frontend `App.routing.test.tsx` — one expected absent «Иришка ИИ» control; GREEN — 28 passed.
- [x] Final full backend regression was executed in complete short shards because the Windows foreground runner silently truncates a single >30s process: 38 passed/3 skipped, 28 passed, 11 passed, 27 passed — total 104 passed/3 skipped. Full frontend `npm test -- --run` — 19 files/122 passed; `npm run build` — success, 116 modules with the standard chunk-size warning only.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` conflicts before MPS pytest; no environment repair was attempted.
- [x] F38 remains `in_progress`; Packages 1 (`9d18156`), 2 (`a97327c`) and 3 (`21e55ac`) are production-deployed. `git diff --check` and final status are required immediately before any future commit.

## Session 79 F38 Package 2 local completion — 2026-08-26

- [x] Scope is limited to MiniMax timeout/retry and per-topic scheduler isolation in Иришка, its backend tests and trackers. Frontend, Alembic, LLM credentials/configuration, direct forum routes and production state are untouched.
- [x] RED `D:\Python312\python.exe -m pytest tests/test_irishka.py -q --color=no --basetemp D:\AI\tmp\mps-f38-p2-red-timeout` — 6 expected failures / 9 passed: no transient retry, no explicit timeout, unhandled 401/403 and one failed topic aborting the run.
- [x] GREEN same target — 15 passed in 6.19s: 30-second timeout, three attempts for timeout/500, no retry for 401/403, error logging, no message for an exhausted topic and a successful subsequent topic.
- [x] Full backend foreground output was constrained before its summary, so the verified hidden JUnit run was used: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f38-p2-full-background --junitxml D:\AI\tmp\mps-f38-p2-full-background.xml` — 101 passed, 3 skipped in 40.50s; JUnit tests=104, failures=0, errors=0.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` conflicts before MPS pytest; no environment repair was attempted.
- [x] F38 remains `in_progress`; Package 1 is deployed at `9d18156` and Package 2 production deployment is explicitly unapproved. `git diff --check` must be clean before commit.

## Session 78 F38 Package 1 local completion — 2026-08-26

- [x] Scope is limited to the Иришка manager-question Telegram relay, its backend tests and trackers. Frontend, Alembic, MiniMax transport, direct forum topic routes, production configuration and deployment are untouched.
- [x] RED `D:\Python312\python.exe -m pytest tests/test_irishka.py -q --color=no --basetemp D:\AI\tmp\mps-f38-p1-red` — 3 expected failures / 6 passed: price, visa and relay-failure cases observed `tg_relay.send` awaited 0 times.
- [x] GREEN same suite — 9 passed in 2.91s. It proves one relay call with the existing `settings, question` contract, persisted `tg_message_id` on success and persisted Question plus AI reply when Telegram raises.
- [x] Full backend verification is recorded from JUnit: 98 tests, 0 failures, 0 errors, 3 expected PostgreSQL-only skips, 30.307s. `git diff --check` must be clean before commit.
- [x] Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` conflicts before MPS pytest; no environment repair was attempted.
- [x] F38 remains `in_progress`. Package 1 was subsequently production-deployed at `9d18156`: VPS fast-forwarded, `mps-backend` restarted to active and `deploy/smoke.sh` passed. F37 Sessions C/D remain unstarted.

## Session 77 F37 Session B local completion — 2026-08-26

- [x] Scope is frontend-only: fishka form/modal, effective-permission hook, API POST union, emoji card rendering, frontend tests and trackers. Backend, Alembic, admin settings UI, content import, email and production configuration are untouched.
- [x] RED `npm test -- --run src/App.routing.test.tsx` outside the Windows sandbox — 3 expected failures: editor lacked the form, reader permission was not requested, and the reader hidden-state contract was absent. GREEN same target — 27 passed.
- [x] Full frontend `npm test -- --run` — 19 files / 121 passed. `npm run build` — success, 116 modules; only the standard Vite chunk-size warning. The first sandbox test attempt stopped at esbuild `spawn EPERM`; the verified runs were repeated outside the sandbox.
- [x] F37 remains `in_progress`; Session B production rollout is complete at `df36dc2`: VPS fast-forwarded, frontend rollback `/root/backups/mps-frontend-f37-b-20260826T025153Z` was retained, build created `index-BpaSMHEn.js` without localhost API, backend remained active without restart, and `deploy/smoke.sh` passed. The served bundle returned HTTP 200. Configured-admin live API proved permission=true, immediate published emoji fishka creation and public-list visibility, then cleaned up exactly the synthetic row (204). A literal browser modal click is unverified because no authenticated browser session was available. Session C (admin settings UI) and Session D (160-item import) remain unstarted.

## Session 76 F37 Session A local completion — 2026-08-26

- [x] Scope is limited to F37 backend foundations and the minimal frontend type cleanup: Post emoji/status model, Alembic `20260826_0014`, submission/moderation/settings APIs, API DTOs, tests and tracker files. The public form, admin settings UI, content import, CSS, email and production configuration are untouched.
- [x] RED `D:\Python312\python.exe -m pytest tests/test_posts.py tests/test_admin.py -q --color=no --basetemp D:\AI\tmp\mps-f37-a-red` — 3 expected failures / 9 passed: reader fishka remained forbidden after enabling, reader fishka was not pending, and `GET /admin/settings` was absent. GREEN target after the minimal change — 13 passed in 4.96s.
- [x] Isolated Alembic upgrade reached `20260826_0014`; direct verification observed `posts.emoji` and `fishka_submissions_enabled=false`. The final backend `D:\Python312\python.exe -m pytest tests -q -x --color=no --basetemp D:\AI\tmp\mps-f37-a-full-backend-6` — 92 passed, 3 skipped in 36.11s.
- [x] Full frontend `npm test -- --run` — 19 files / 118 passed. `npm run build` — success, 115 modules; only the standard Vite chunk-size warning. `./init.sh` stopped only at the agreed external Hermes/desktop global pip-check conflicts before MPS tests; no external repair was attempted.
- [x] F37 remains `in_progress`; Sessions B (user form), C (admin settings UI) and D (160-item import) are unstarted. Session A production rollout is complete: `4f86725` pushed and VPS fast-forwarded after fresh readable PostgreSQL backup `/var/backups/mps/mps-2026-08-25-222403.dump.gz`. Alembic is `20260826_0014 (head)` and `mps-backend` is healthy. Frontend rollback is `/root/backups/mps-frontend-f37-a-20260826T022626Z`; remote bundle `index-C_UmfjiP.js` has no localhost API, and `deploy/smoke.sh` passed. Authenticated admin smoke confirmed default `fishka_submissions_enabled=false`, immediate published emoji fishka creation and cleanup of the synthetic row with 204.

## Session 75 F36 Package 4 local completion — 2026-08-26

- [x] F36 is locally `passing` after all four packages. Scope is limited to four visible frontend wording substitutions; CSS, routes, API, backend, schema, email and production configuration are untouched.
- [x] RED targeted `Forum.test.tsx` + `Layout.test.tsx` — 3 expected failures for the absent «Страны — Форум» heading, «← Форум стран» back-link and «Форум стран» navigation text. GREEN same target — 7 passed.
- [x] Full frontend `npm test -- --run` — 19 files / 118 passed. `npm run build` — success, 115 modules; only the standard Vite chunk-size warning. `./init.sh` is not part of this frontend-only package verification and was not rerun.
- [x] Package 4 production rollout is complete: `c380667` synchronized local/origin/VPS, current dist was backed up at `/root/backups/mps-frontend-f36-p4-20260826T011453Z`, backend remained active without restart, production build markers passed, and `deploy/smoke.sh` returned `[OK]`. Live browser navigation showed «Форум стран» and heading «Страны — Форум».

## Session 74 F36 Package 3 local completion — 2026-08-26

- [x] F36 remains the sole `in_progress` feature. Scope is limited to forum topic/message deletion, authorization, cascades and message metadata; naming, email transport and production configuration are untouched.
- [x] RED backend `tests/test_forum.py -k deletion` — 3 expected failures because both DELETE routes returned 404. GREEN same target — 3 passed; full forum suite — 11 passed / 3 PostgreSQL-only skipped.
- [x] RED frontend `Forum.test.tsx` — 2 expected failures for absent delete controls. GREEN same target — 5 passed: author/admin visibility for topics and messages, no DELETE before confirmation, DELETE after confirmation and immediate removal from UI.
- [x] Full backend pytest completed successfully. Full frontend `npm test -- --run` — 19 files / 117 passed; `npm run build` — success, 115 modules, standard chunk-size warning only. Final `./init.sh` stopped only at the agreed external global Hermes/desktop `pip check` conflicts before MPS tests; no external-environment repair was attempted.
- [x] Package 2 rollout is recorded correctly: `6128c74` synchronized local/origin/VPS; backend restart, smoke and live counter/rate-limit check passed.
- [x] Package 3 rollout: `cc89d2b` plus hotfix `0bc8c3e` synchronized local/origin/VPS; fresh nonempty PostgreSQL backup, backend restart/health, frontend rollback copy + rebuild, and `deploy/smoke.sh` passed. Live synthetic API scenario verified non-latest deletion preserves `last_message_at`, latest deletion recalculates it, and topic deletion removes it from the country list.

## Session 73 F36 Package 2 local completion — 2026-08-26

- [x] F36 remains the sole `in_progress` feature. Scope is limited to forum write atomicity and per-user rate limiting; deletion, naming, email transport, frontend behavior and production configuration are untouched.
- [x] RED on temporary PostgreSQL 16: five concurrent POST topics crossed a remaining single-slot quota; five concurrent messages left `messages_count=1`; topic/message 429 contracts were absent; Иришка issued a non-atomic counter UPDATE.
- [x] GREEN `D:\Python312\python.exe -m pytest tests/test_forum.py tests/test_irishka.py -q --color=no --basetemp D:\AI\tmp\mps-f36-p2-green-1` — 17 passed in 9.04s. PostgreSQL tests prove `SELECT FOR UPDATE` admits only the remaining topic slot and SQL `messages_count = messages_count + 1` retains every concurrent increment.
- [x] Full backend pytest completed successfully against the same temporary PostgreSQL. Frontend regression `npm run test:quiet` — 19 files / 114 passed; `npm run build` — success, 115 modules, only the standard chunk-size warning.
- [x] Final `./init.sh` outside sandbox stopped only at agreed external global Hermes/desktop `pip check` conflicts before MPS tests; no external-environment repair was attempted.
- [x] Package 1 rollout is recorded correctly: `61ff1a5` synchronized local/origin/VPS, fresh readable PostgreSQL backup, Alembic `20260826_0013`, backend health, frontend publish and `deploy/smoke.sh` all passed.
- [x] Package 2 was subsequently deployed at `6128c74`: backend restart, smoke and live synthetic counter/rate-limit check passed. Current SlowAPI storage is process-local; production remains one backend worker, while any multi-worker future needs Redis-backed limiter storage.

## Session 72 F36 Package 1 local completion — 2026-08-26

- [x] Scope is limited to forum read scalability: topic/message keyset pagination, SQL topic search, aggregate country counts, database indexes, frontend page accumulation and their tests. Concurrency/rate limiting, deletion, forum naming, email and production configuration are untouched.
- [x] RED backend `D:\Python312\python.exe -m pytest tests/test_forum.py -q --color=no --basetemp D:\AI\tmp\mps-f36-p1-red` — 3 expected failures: missing page envelopes for topics/messages and four SELECTs for three country counts. GREEN with a temporary PostgreSQL 16 URL — 7 passed, including real Cyrillic `ILIKE` search.
- [x] Migration `20260826_0013` upgraded the isolated PostgreSQL test database. Observed indexes: `ix_forum_topics_country_id_created_at_id`, `ix_forum_topics_author_id`, `ix_forum_messages_topic_id_created_at_id`.
- [x] RED frontend `npm test -- --run src/components/Forum.test.tsx` exposed the changed page-envelope/array crash. GREEN same target — 2 passed: topics and messages append a second page and hide «Показать ещё» at `next_cursor=null`.
- [x] Full backend with temporary PostgreSQL search verification — 83 passed in 69.10s. Full frontend — 19 files / 114 passed. `npm run build` — success, 115 modules, standard chunk-size warning only. `git diff --check` is clean.
- [x] Final `./init.sh` outside sandbox stopped only at the agreed external global Hermes/desktop `pip check` before MPS tests; no external-environment repair was attempted.
- [x] F36 remains the sole `in_progress` feature. Package 1 was subsequently deployed at `61ff1a5` after separate approval: fresh readable backup, Alembic `20260826_0013`, backend health, rebuilt frontend, served bundle and smoke all passed. Package 2 is now locally complete; its own deployment remains unapproved.

## Session 71 F15–F35 final production closeout — 2026-08-25

- [x] Scope is tracker-only: only `claude-progress.md`, `session-handoff.md` and this checklist are changed. No MPS code, database, deployment configuration, email transport or production state is changed in this closeout.
- [x] F35 is fully `passing` and deployed at `86a67e5`. All five PublicProfile tabs use real data: Publications, Replies, Likes, Subscriptions and Activity.
- [x] F35 evidence is complete: subscriptions lists and per-person follow state; owner/public comments visibility with admin-own-only labels; Likes cover/date and same-tab cache refresh; ActivityLog migration/backfill/atomic reversible hooks; public Activity API/UI with opaque keyset pagination and «Показать ещё».
- [x] Fresh full verification on `86a67e5`: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp .pytest-f35-closeout-backend` — 79 passed in 20.90s; `npm test -- --reporter=dot` — 18 files / 112 passed; `npm run build` — success, 115 modules, standard chunk-size warning only.
- [x] Final `./init.sh` outside sandbox stopped only at the agreed external Hermes/desktop global `pip check` before MPS tests; no repair was attempted because it is outside MPS scope.
- [x] Production evidence: VPS `2e58222 → 86a67e5`, Alembic `20260825_0012 (head)`, backend ready on attempt 2, frontend `index-CwPpAkwf.js`, `deploy/smoke.sh` `[OK]`, public API `items=4`, `next_cursor=null`, and live browser Activity displayed Pavel's publication, like and two comments dated 24.08.2026.
- [x] Known external boundary remains Unisender/HostKey network blockage; `EMAIL_LOGIN_ENABLED=false` keeps Telegram as the only visible login path. Next candidate is read-only diagnosis of slow personal-profile loading (F32 from the original findings list), not an implementation task.

## Session 65 final F15–F34 handoff — 2026-08-25

## Session 70 F35 Session 4b local completion — 2026-08-25

- [x] F35 is locally `passing`: Session 4b is limited to the Activity read API/UI over the already deployed Session 4a activity_log infrastructure. Email, schema, activity-write hooks and unrelated product behavior were not changed.
- [x] RED backend `D:\Python312\python.exe -m pytest tests/test_activity_feed.py -q --color=no --basetemp .pytest-f35-s4b-red-backend` — 2 expected missing-route 404 failures. GREEN same target — 2 passed: four event contexts, newest-first order, opaque keyset page boundary, no duplicates, and owner-only pending/rejected comment visibility.
- [x] RED frontend `npm test -- --run src/components/PublicProfile.test.tsx src/App.routing.test.tsx --reporter=dot` — expected Activity placeholder failure. GREEN targeted command — 33 passed, including four event texts, exact empty state and cursor-driven «Показать ещё» request.
- [x] Full backend — 79 passed in 23.39s. Full frontend — 18 files / 112 passed. `npm run build` — success, 115 modules; only the standard Vite chunk-size warning. `git diff --check` is clean before checkpoint staging.
- [x] Final `./init.sh` outside sandbox stopped only at agreed external Hermes/desktop global `pip check` before MPS tests; no attempt was made to change that environment.
- [x] Production deployment is intentionally not performed for Session 4b and remains separately approved. Session 4a is already production-deployed at `2e58222` with backup, migration/backfill, readiness, smoke and direct SQL evidence.

## Session 66 F35 Session 1 local completion — 2026-08-25

## Session 67 F35 Session 2 local completion — 2026-08-25

## Session 68 F35 Session 3 local completion — 2026-08-25

## Session 69 F35 Session 4a local completion — 2026-08-25

- [x] F35 was the single `in_progress` feature during Session 4a. Its scope was backend Activity infrastructure only: migration/backfill and atomic write hooks; no Activity read endpoint, frontend UI, privacy exposure, email or unrelated changes.
- [x] Exact event contract: `post_published`, `comment_created`, `post_liked`, `user_followed`; draft saves create no event. Unlike/unfollow remove the corresponding reversible current-state event.
- [x] RED `test_activity_log.py` — expected missing `app.models.activity` collection error. GREEN — 4 passed: direct/draft publication, comment, like/unlike and follow/unfollow.
- [x] Full backend — 77 passed in 21.70s. Alembic head — `20260825_0012`. `git diff --check` passed before checkpoint staging.
- [x] Final `./init.sh` outside sandbox stopped only at the agreed external Hermes/desktop global `pip check` before MPS tests; no attempt was made to modify that environment.
- [x] Frontend was intentionally untouched in Session 4a. Its later approved production deployment completed with a fresh backup, migration/backfill, backend readiness, smoke and direct SQL evidence.

- [x] F35 remains the single `in_progress` feature. Session 3 scope was public Likes UX only: optional real cover, liked date and same-tab cache refresh; no card toggle, privacy change, BroadcastChannel, Activity or email work.
- [x] RED backend — expected missing `liked_at`, 1 failure / 9 passed. GREEN `test_public_profile.py` — 10 passed, including a UTC `liked_at` from `post_likes.created_at`.
- [x] RED frontend — 2 expected failures / 29 passed: Likes card lacked cover/date and toggle did not refresh shared likes state. GREEN targeted PublicProfile + routing — 31 passed.
- [x] Full backend — 73 passed in 22.95s. Full frontend — 18 files / 110 passed. `npm run build` — success, 115 modules; only standard chunk-size warning.
- [x] Final `./init.sh` outside sandbox stopped only at the agreed external Hermes/desktop global `pip check` before MPS tests; no attempt was made to modify that environment.
- [x] Approved Session 3 rollout completed: `c12e102` is on VPS; backend readiness was green on attempt 2, remote build published `index-DL7pFkN2.js`, public Likes returned 200 and `deploy/smoke.sh` passed. No migration or dependency change was required.

- [x] F35 remains the single `in_progress` feature. Session 2 scope was own comments in «Ответы» only; Likes, Activity and email delivery were not changed.
- [x] RED backend — expected missing-route 404, 1 failure / 9 passed. GREEN `D:\Python312\python.exe -m pytest tests/test_public_profile.py -q --color=no --basetemp .pytest-f35-s2-green-backend` — 10 passed. Owner sees all own statuses; guest/viewer only approved; DTO carries comment and post context.
- [x] RED frontend — 3 expected failures / 27 passed: stale empty text, no reply list and no profile comments load. GREEN targeted PublicProfile + routing — 30 passed, including admin-own-only status badges and article context/date.
- [x] Full backend — 73 passed in 20.15s. Full frontend — 18 files / 109 passed. `npm run build` — success, 115 modules; only standard chunk-size warning.
- [x] Final `./init.sh` outside sandbox stopped only at the agreed external Hermes/desktop global `pip check` before MPS tests; no attempt was made to modify that environment.
- [x] Approved Session 2 rollout completed: `72ce494` pushed; VPS fast-forwarded `fe00787 → 72ce494`; Alembic check passed; `mps-backend` restarted and readiness became active. Frontend rollback is `/root/backups/mps-frontend-f35-s2-20260825T010604Z`; remote build, served `index-DQG_KskE.js`, public comments endpoint `200` with 2 items and `deploy/smoke.sh` passed. No migration or dependency change was required.

- [x] F35 remains the single `in_progress` feature; F34 remains `passing`. Session 1 scope was the Publications regression baseline and Subscriptions lists only.
- [x] RED backend: new followers/following contract failed with missing-route 404 — 1 expected failure / 8 passed. GREEN `D:\Python312\python.exe -m pytest tests/test_public_profile.py -q --color=no --basetemp .pytest-f35-green-backend` — 9 passed.
- [x] RED frontend: PublicProfile subscriptions tab remained the placeholder — 1 expected failure / 6 passed. GREEN `npm test -- --run src/components/PublicProfile.test.tsx src/App.routing.test.tsx --reporter=dot` — 28 passed.
- [x] New API scope is read-only lists: public `id/name/avatar_url/is_following`, filtering anonymous/banned users and ordering by follow creation time. Existing follow POST/DELETE is reused; no migration or dependency change.
- [x] Full backend: 72 passed in 22.10s. Full frontend: 18 files / 107 passed. `npm run build`: success, 115 modules; only the standard chunk-size warning.
- [x] Final `./init.sh` outside sandbox stopped only on the agreed external Hermes/desktop global `pip check` before MPS tests; no attempt was made to modify that environment.
- [x] Approved rollout: `fe00787` was pushed and VPS fast-forwarded from `04ae21d`; Alembic compatibility check passed, `mps-backend` restarted and reached readiness on attempt 2. Frontend rollback is `/root/backups/mps-frontend-f35-20260825T002954Z`; remote build, served F35 bundle markers and `deploy/smoke.sh` passed. Public profile plus followers/following API each returned 200. No authenticated Telegram browser session was available for a live follow-click. Next F35 sub-session is own-comments «Ответы» with exact empty state «Пока нет ответов. Ваши ответы появятся здесь.»

- [x] Closeout scope is tracker-only: only `feature_list.json`, `claude-progress.md`, `session-handoff.md` and this checklist changed locally; the separately approved production rollout changed backend/frontend build artifacts and restarted only `mps-backend`.
- [x] F29 completed production avatar-picker alignment: F25 MIME formats and same-file input reset.
- [x] F30 completed production draft-card delete with existing confirmation/DELETE contract, without opening composer.
- [x] F31 completed explicit `cover_url` through DTO, composer and renderer; F32 made old gradient and real cover mutually exclusive; F33 removed the fallback by final product decision, so no-cover posts render no upper block.
- [x] F34 completed and deployed: real sidebar avatars plus anchored green online dots; public-profile dot is driven by `/online`; authenticated refresh plus 30-second polling has cleanup. The backend presence contract remains 120-second `last_seen_at`, no WebSocket.
- [x] F34 rollout evidence: `3451397` pushed; VPS fast-forwarded `e7e97b7 → 3451397`; rollback `/root/backups/mps-frontend-f34-20260824T172052Z`; remote build passed, served `index-C-CVCK1W.js` returned 200, `deploy/smoke.sh` returned `[OK]`, backend stayed active without restart. Guest browser DOM verified sidebar avatar+dot; public-profile live check was not completed because the only online user expired from the 120-second window and no Telegram session was available.
- [x] Known external blocker is unchanged: Unisender/HostKey delivery network failure. F27 keeps Telegram as the sole visible login path through `EMAIL_LOGIN_ENABLED=false`; backend email endpoints remain intact.
- [x] Next feature F35 is intentionally unstarted: personal-cabinet tabs still contain placeholders and subscribers-list «Подписаться» is not implemented.

## Session 64 F34 local completion — 2026-08-25

- [x] F34 — единственная новая feature сессии; scope ограничен presence/avatar frontend flow, его tests и tracker records. Backend/API/database/dependencies/email infrastructure не менялись; production deploy не выполнялся.
- [x] Diagnosis: backend HTTP middleware updates `last_seen_at`; `/online` returns `{id, name, avatar_url}` for non-anonymous users active within 120 seconds. There is no WebSocket. Layout ignored the returned avatar and positioned its dot after the name; PublicProfile had no indicator. Header already reads avatar from `useAuth` state updated by PATCH `/me`.
- [x] RED frontend: `npm test -- --run src/components/Layout.test.tsx src/components/PublicProfile.test.tsx src/hooks/useAuth.test.tsx src/hooks/useOnline.test.tsx src/App.routing.test.tsx --reporter=dot` — 4 expected failures / 28 passed: missing real sidebar avatar/anchored dot, public-profile indicator and App presence propagation.
- [x] GREEN targeted: same files — 5 files / 32 passed. Online avatar uses image or gradient fallback; dot is in avatar wrapper, profile dot appears only if `/online` contains that profile, and hook reloads after auth plus each 30 seconds with cleanup.
- [x] Backend presence baseline: `D:\Python312\python.exe -m pytest tests/test_presence.py -q --color=no --basetemp D:\AI\tmp\mps-f34-presence` — 2 passed.
- [x] Full backend unchanged: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f34-full-backend` — 71 passed in 18.75s.
- [x] Full frontend: `npm test` — 18 files / 106 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were separately green.
- [x] `feature_list.json`, `claude-progress.md`, `session-handoff.md` and this checklist record F34 as passing with command-backed local evidence. Frontend-only production rollout awaits separate approval.

## Session 63 F33 production rollout — 2026-08-25

- [x] F33 — единственная новая feature сессии; final product scope ограничен `Feed.tsx`, `ArticleComments.tsx`, их tests и tracker records. `styles.css` намеренно не изменён; backend/API/database/dependencies/email infrastructure не менялись.
- [x] RED frontend: `npm test -- --run src/components/Feed.test.tsx src/components/ArticleComments.test.tsx --reporter=verbose` — 2 expected failures / 10 passed, поскольку обе no-cover ветки всё ещё содержали `<span>Под солнцем</span>`.
- [x] GREEN targeted: тот же command — 2 files / 12 passed. Explicit cover image regression сохранён; no-cover DOM не имеет img, fallback class, placeholder text или зарезервированной высоты.
- [x] Full frontend: `npm test` — 16 files / 102 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Full backend unchanged: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f33-full-backend` — 71 passed in 19.84s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were separately green.
- [x] Production frontend-only rollout: `e4c302f` pushed and deployed; recoverable old dist `/root/backups/mps-frontend-f33-20260824124812`; served `index-CXtH547q.js`; production markers present, fallback className literals absent, `deploy/smoke.sh` passed. `mps-backend` remained active and was not restarted.
- [x] Live guest DOM on an existing no-cover article: feed/detail `fallback=false`, `coverImage=false`, exact `Под солнцем` absent, and immediate next content class `post-tag`; no production content was created or deleted.
- [x] `feature_list.json`, `claude-progress.md`, `session-handoff.md` and this checklist record F33 as passing with command-backed and live production evidence.

## Session 62 F32 production hotfix — 2026-08-25

- [x] F32 — единственная новая feature сессии; scope ограничен Feed, ArticleComments, CSS, frontend tests и tracker records. Backend/API/database/dependencies/email infrastructure не менялись.
- [x] Diagnosis: F31's cover branch still emitted the gradient `.article-cover` / `.article-hero` container around its img; screenshots also show inline body media separately below the title.
- [x] RED frontend: `npm test -- --run src/components/Feed.test.tsx src/components/ArticleComments.test.tsx` — 2 expected failures / 10 passed, because cover branch still contained fallback container.
- [x] GREEN targeted: same command — 2 files / 12 passed. Cover branch has no fallback DOM element; fallback branch has no cover img.
- [x] Full frontend: `npm test` — 16 files / 102 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Full backend unchanged: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f32-full-backend` — 71 passed in 20.50s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were separately green.
- [x] Production: `02823b9` pushed/synchronized; VPS fast-forwarded, `mps-backend` remained active, old dist is `/root/backups/mps-frontend-f32-20260824121451`, served `index-BGDRzZT7.js` has both F32 image branches, and `deploy/smoke.sh` passed.
- [x] Guest browser had no published public articles, so no production test content was created without Telegram authorization. Owner visual acceptance of cover/fallback remains a post-release check, not an unverified completion claim.

## Session 61 F31 local completion — 2026-08-24

- [x] F31 — единственная новая feature сессии; production deploy не выполнялся.
- [x] Scope: existing backend `Post.cover_url` is exposed by posts DTO for list/detail/draft detail, and existing PATCH persists it. No migration, dependency or backend media change.
- [x] Composer: separate F25-format file picker reuses multipart POST `/media`, previews returned URL and preserves it across create/update/edit/draft prefill. Feed and ArticleComments render only explicit cover_url with object-fit; no URL retains `Под солнцем` fallback and no inline body image is inferred.
- [x] RED backend: `tests/test_posts.py` — 1 expected failure / 5 passed, because PATCH response omitted cover_url. RED frontend: PostComposer/Feed/ArticleComments — 4 expected failures / 17 passed, because picker/preview/real-image render were absent.
- [x] GREEN targeted: backend 6 passed; frontend PostComposer, Feed, ArticleComments and App PATCH — 4 files / 41 passed.
- [x] Full backend: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f31-full-backend` — 71 passed in 33.49s.
- [x] Full frontend: `npm test` — 16 files / 102 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were separately green.
- [x] `feature_list.json`, `claude-progress.md` and `session-handoff.md` updated. F31 is local-only pending separate backend+frontend production approval.

## Session 60 F30 local completion — 2026-08-24

- [x] F30 — единственная новая feature сессии; production deploy не выполнялся.
- [x] Cover diagnosis before implementation: `Feed` PostCard and `ArticleComments` unconditionally render dark-gradient `Под солнцем`; TipTap inline images are body-only `RichTextContent`. Backend `Post.cover_url` exists but is absent from DTO/frontend/composer/rendering. This is a hard-coded fallback/design, not a media-upload regression.
- [x] Scope: `Drafts.tsx`, `App.tsx`, frontend tests and CSS only. Each draft card has independent open/delete buttons (no nested button); F15-style confirmation guards the existing DELETE, and success removes only that card from local drafts without navigation. No backend/API/database/dependency/email/production configuration change.
- [x] RED frontend: `Drafts.test.tsx` + `App.routing.test.tsx` — 4 expected failures / 19 passed: absent delete control/confirmation paths.
- [x] GREEN targeted: same command — 2 files / 23 passed; covers visible control, no DELETE before confirmation, DELETE after confirmation and card disappearing.
- [x] Full frontend: `npm test` — 16 files / 96 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Full backend (unchanged): `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f30-full-backend` — 70 passed in 17.70s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were separately green.
- [x] `feature_list.json`, `claude-progress.md` and `session-handoff.md` updated. F30 was subsequently deployed frontend-only at `11dff37`; rollback `/root/backups/mps-frontend-f30-20260824T152645Z`, smoke and served delete marker passed, backend remained active.

## Session 59 F29 local completion — 2026-08-24

- [x] F29 — единственная новая feature сессии; production deploy не выполнялся.
- [x] Диагностика: `Profile` button is a real file input. Existing contract is multipart `POST /media` then `PATCH /me {avatar_url}`; model, migration `20260818_0002_users`, schema and endpoint already exist. Production `/users/2/profile` avatar is local `/media/*.png` (HEAD 200 image/png), not Telegram `photo_url`.
- [x] Root cause: profile picker was stale against F25 (only JPEG/PNG/WebP) and retained the selected value, so an identical second choice did not fire browser `change`.
- [x] Scope: `Profile.tsx` and `Profile.test.tsx` only. Picker now accepts JPEG, PNG, WebP, HEIC, HEIF and AVIF and clears its value after capturing a File. `useAuth.test.tsx` remains the regression proof for POST/PATCH; backend/API/database/dependencies/email/production configuration did not change.
- [x] RED frontend: `Profile.test.tsx` — 1 expected failure / 3 passed: old accept lacked F25 MIME types.
- [x] GREEN targeted: `Profile` + `useAuth` — 2 files / 7 passed; covers MIME alignment, reset and existing multipart POST/PATCH chain.
- [x] Full frontend: `npm test` — 15 files / 92 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Full backend (unchanged): `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f29-full-backend` — 70 passed in 17.96s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were run separately and green.
- [x] `feature_list.json`, `claude-progress.md` and `session-handoff.md` updated. F29 remains local-only pending separate production approval and real Telegram-session validation.

## Session 58 F28 local completion — 2026-08-24

- [x] F28 — единственная новая feature сессии; production deploy не выполнялся.
- [x] Диагностика: «Выйти» был только в `Profile.tsx` modal. Existing owner ••• menu `PublicProfile.tsx` работал и содержал Copy link/Share; выбран как органичное место без нового UI/container.
- [x] Scope: `PublicProfile.tsx`, `App.tsx` и их frontend tests. Owner получает «Выйти» в •••, menu closes before callback; visitor его не видит. App reuse-ит `auth.logout()` и redirect-ит в guest feed только после successful resolve. Backend/API/database/dependencies/email/production configuration не менялись.
- [x] RED frontend: `PublicProfile.test.tsx` + `App.routing.test.tsx` — 2 expected failures / 22 passed: owner menu и App scenario не нашли отсутствующий logout item.
- [x] GREEN targeted: `PublicProfile`, `App.routing`, `useAuth` — 3 files / 27 passed. Covered owner/visitor visibility, menu closing, POST `/auth/logout`, session/token clear and guest redirect.
- [x] Full frontend: `npm test` — 15 files / 91 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Full backend (unchanged): `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f28-full-backend` — 70 passed in 18.79s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were run separately and green.
- [x] `feature_list.json`, `claude-progress.md` and `session-handoff.md` updated. F28 remains local-only pending separate production approval and a real Telegram owner-session smoke.

## Session 57 F27 local completion — 2026-08-24

- [x] F27 — единственная новая feature сессии; production deploy не выполнялся.
- [x] Scope: guest `Profile` UI only. `EMAIL_LOGIN_ENABLED = false` временно скрывает email input, code input, CTA и email-copy; Telegram Login остаётся единственным visible path. Backend, transport, credentials, subscription email и network configuration не менялись.
- [x] RED frontend: `Profile.test.tsx` + `App.routing.test.tsx` — 2 expected failures / 19 passed; оба нашли текущее visible `input[type=email]`.
- [x] GREEN targeted: `Profile`, `TelegramLogin`, `App.routing` — 3 files / 23 passed. Profile confirms no email fields/texts and official widget script forwards signed payload; routing confirms login modal has no email path.
- [x] Backend regression baseline: `D:\Python312\python.exe -m pytest tests/test_auth.py -q --color=no --basetemp D:\AI\tmp\mps-f27-auth-baseline` — 6 passed; request/verify email endpoints remain available.
- [x] Full frontend: `npm test` — 15 files / 89 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning. Built bundle confirms production API/bot markers and no localhost API.
- [x] Full backend (unchanged): `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f27-full-backend` — 70 passed in 17.36s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were run separately and green.
- [x] `feature_list.json`, `claude-progress.md` and `session-handoff.md` updated. Re-enable email only after Unisender/HostKey delivery repair and real verification; production waits for separate approval and Telegram browser smoke by Pavel.

## Session 56 F26 local completion — 2026-08-24

- [x] F26 — единственная новая feature сессии; production deploy не выполнялся.
- [x] Диагностика: Feed ComposerModal имел onClose, но передавал в PostComposer только onCreate; поэтому ни successful draft save, ни publish не могли закрыть creation modal. App edit modal также не получал close callback.
- [x] Point 2 не воспроизведён: Drafts button onClick → GET `/posts/drafts/{id}` → `setEditingPost` → initialPost подтверждены source и `App.routing` тестом; CSS pointer-events blocker не найден. Нужна повторная authenticated live browser проверка после deploy, рабочий flow не менялся.
- [x] RED frontend: `PostComposer.test.tsx` — 3 expected failures / 4 passed; onClose отсутствовал после successful draft POST, published POST и PATCH, а rejected request был unhandled. GREEN targeted: `PostComposer`, `Feed`, `App.routing` — 3 files / 28 passed; error оставляет composer открытым.
- [x] Full frontend: `npm test` — 15 files / 89 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning. Built bundle confirms production API/bot markers and no localhost API.
- [x] Full backend (unchanged): `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f26-full-backend` — 70 passed in 20.79s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were run separately and green.
- [x] Scope only PostComposer close callback and its Feed/App propagation plus regression tests. No backend, API, database, dependency, email or production configuration changed. `feature_list.json`, `claude-progress.md` and `session-handoff.md` updated.

## Session 55 F25 local completion — 2026-08-24

- [x] F25 — единственная новая feature сессии; production deploy не выполнялся.
- [x] Диагностика: PNG/JPEG upload chain присутствует и baseline прошёл; HEIC/HEIF были заблокированы одновременно picker accept и backend MIME allowlist.
- [x] RED frontend — 1 failed / 18 passed: отсутствовали HEIC/HEIF/AVIF в file picker. RED backend after dependency — 4 failed / 7 passed: HEIC/HEIF/AVIF returned old 422 and message did not explain modern formats.
- [x] GREEN targeted: backend `test_media.py` — 11 passed; HEIC/HEIF return 200 and saved file opens as WEBP, AVIF returns 200 and remains AVIF; unsupported PDF has Russian 422. Frontend `RichTextEditor.test.tsx` — 19 passed; PNG POST/insertion contract and expanded accept covered.
- [x] Full frontend: `npm test` — 15 files / 85 passed; `npm run build` — success, 115 modules, only standard Vite chunk-size warning.
- [x] Full backend: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp D:\AI\tmp\mps-f25-full-backend` — 70 passed in 21.04s.
- [x] Final `./init.sh` installed MPS requirements and stopped only on agreed external Hermes/desktop global `pip check`; MPS suites were run separately and green.
- [x] `pillow-heif==1.5.0` is the only new dependency; no database, sanitizer, carousel or production configuration change. `feature_list.json`, `claude-progress.md` and `session-handoff.md` updated.
- [x] Approved production rollout: backup `/root/backups/mps-f25-20260824T131202Z`; VPS `9872364 → e1a35f3`; pillow-heif installed in `/opt/mps-platform/venv`; backend restarted active; frontend rebuilt with production VITE markers and served asset 200; `deploy/smoke.sh` passed.
- [x] Live HTTPS media smoke: synthetic HEIC → 200 and valid served WEBP; PNG/JPEG → 200; renamed text → approved Russian 422; exactly three created media files were removed.

## Session 53 F24 local completion — 2026-08-24

- [x] F24 — единственная новая feature сессии; production deploy не выполнялся.
- [x] RED backend: приватный drafts list отсутствовал (`404`); GREEN `test_posts.py` — 5 passed: только own list/detail, foreign 404, PATCH without duplicate и published feed.
- [x] Additional RED/GREEN: draft→published сначала оставлял `published_at=null`; после minimal patch `published_at` установлен, targeted backend — 5 passed.
- [x] RED frontend: `/drafts` fallback в ленту и second save не PATCH-ил draft; GREEN — `PostComposer` + `App.routing`: 2 files / 21 passed.
- [x] Full frontend: `npm test` — 15 files / 84 passed; `npm run build` — success, 115 modules; только standard Vite chunk-size warning.
- [x] Full backend: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp .pytest-f24-full-backend` — 66 passed in 19.73s; Alembic history confirms `20260824_0011` head.
- [x] Final `./init.sh` установил MPS requirements и остановился только на external global Hermes/desktop `pip check`; project suites проверены отдельно и зелёные.
- [x] `feature_list.json`, `claude-progress.md` и `session-handoff.md` updated; deploy waits for separate approval.

## Session 52 F23 local completion — 2026-08-24

- [x] Отдельный инфраструктурный commit `e6e9012`: `init.sh` использует `python -m pip`; MPS код не менялся.
- [x] F23 — единственная новая feature сессии; production deploy не выполнялся.
- [x] RED: `RichTextEditor.test.tsx` — 3 failed / 15 passed; B/I/S на правой mark boundary включали новый текст в existing mark.
- [x] GREEN targeted: `RichTextEditor.test.tsx` — 18 passed; boundary B/I/S normal, bold внутри фрагмента, F22 toolbar и Ctrl+B/Ctrl+I сохранены.
- [x] Full frontend: `npm test` — 15 files / 82 passed; `npm run build` — success, 114 modules; только standard Vite chunk-size warning.
- [x] Full backend: `D:\Python312\python.exe -m pytest tests -q --color=no --basetemp .pytest-f23-full` — 65 passed in 15.72s; backend не менялся.
- [x] Final `./init.sh` устанавливает MPS requirements и останавливается только на внешнем global Hermes/desktop `pip check`; project suite проверен отдельно и зелёный.
- [x] `feature_list.json`, `claude-progress.md` и `session-handoff.md` обновлены; backend/API/dependencies/database/production не менялись.

## Session 51 F22 local completion — 2026-08-24

- [x] F22 — единственная новая feature сессии; production deployment не выполнялся и ожидает отдельного approval.
- [x] RED: `RichTextEditor.test.tsx` — 3 failed / 9 passed; B/I не синхронизировали aria-pressed после toggle, а H1 не сбрасывал active-state после cursor transition.
- [x] GREEN targeted: `RichTextEditor.test.tsx` — 12 passed; проверены B/I selection→ordinary input без mark inheritance, H1-H3, bullet/ordered list, quote и link.
- [x] F15 regression: `RichTextEditor`, `PostComposer`, `ArticleComments`, `App.routing` — 4 files / 36 passed; prefill, PATCH, delete confirmation и redirect сохранены.
- [x] Full frontend: `npm test` — 15 files / 76 passed; `npm run build` — success, 114 modules, только standard Vite chunk-size warning.
- [x] Full backend: Hermes venv `python -m pytest tests -q --color=no --basetemp .pytest-f22-full` — 65 passed in 17.56s; backend не менялся.
- [x] Final `./init.sh` через корректный Hermes venv установил MPS requirements и остановился только на известном внешнем `pip check` missing charset-normalizer.
- [x] `feature_list.json`, `claude-progress.md` и `session-handoff.md` обновлены; F22 marked passing, no dependency/database/API/production change.

## Session 50 F21 production closeout — 2026-08-24

- [x] `ada1f52` pushed; local `main`, `origin/main` и VPS сверены на одном SHA.
- [x] Active nginx config получил `client_max_body_size 11m`; backup создан, `nginx -t` прошёл, выполнен graceful reload. `mps-backend` не перезапускался и остался active.
- [x] Frontend production build собран с проверенными VITE API/bot markers и без localhost API; `deploy/smoke.sh` — `[OK]`.
- [x] Live editor/admin smoke: PNG 4.32 MB и 3.63 MB получили media 200 без 413, создали одну leading-карусель; published Next переключил второй слайд.
- [x] Temporary post удалён через DELETE 204 с redirect, оба созданных media-файла и локальные test files удалены; browser session/cookie очищены.
- [x] Полные local suites в финальном checkpoint: backend 65 passed; frontend 15 files / 73 passed; `npm run build` success. `./init.sh` блокируется только внешним Hermes `pip check` missing charset-normalizer.

## Session 50 F21 local checkpoint — 2026-08-24

- [x] F21 — единственная фича сессии; scope ограничен media ingress и начальной TipTap media-группой.
- [x] Pre-code production diagnosis: один token, первый PNG 84 B — 200; второй валидный PNG 7 692 467 B — nginx HTML 413; backend увидел только первый 200 и не имел ошибок.
- [x] Причина доказана nginx logs и active config: MPS server block использует default body limit 1m; rate limit, JWT/session и file-input reset исключены. Диагностический media очищен, backend active.
- [x] RED nginx contract: `test_deploy_bootstrap.py` — 1 failed / 2 passed из-за отсутствующего `client_max_body_size 11m`.
- [x] Backend media regression: два последовательных upload одним access-token, второй валидный PNG >1 MiB — оба 200; `test_media.py` — 7 passed.
- [x] RED frontend: `RichTextEditor.test.tsx` — 3 failed / 6 passed; middle, end и repeated-at-end media находились после текста.
- [x] GREEN targeted: frontend — 9 passed; backend/deploy — 10 passed. Related RichTextEditor/RichTextContent/PostComposer — 3 files / 17 passed.
- [x] Full backend: `python -m pytest tests -q --color=no --basetemp .pytest-f21-full` — 65 passed in 19.54s.
- [x] Full frontend: `npm test` — 15 files / 73 passed; `npm run build` — success, 114 modules, стандартный chunk-size warning.
- [x] Final `./init.sh` outside sandbox остановился до MPS tests только на согласованном внешнем Hermes pip check missing charset-normalizer; полные MPS suites выполнены отдельно и зелёные.
- [x] `deploy/nginx.conf` допускает 11m multipart request; backend raw-file limit 10 MiB и русский 422 не менялись.
- [x] New image всегда вставляется в position 0; непрерывная leading img/carousel-группа flatten+append собирается в одну карусель, текст и image removal regression сохранены.
- [x] Dependencies, database, sanitizer и backend endpoint не менялись; production nginx/frontend намеренно не применялись до отдельного approval.
- [x] `feature_list.json`, `claude-progress.md`, `session-handoff.md` обновлены; drag/drop, paste, reorder и autoplay не начаты.

## Session 49 F20 local checkpoint — 2026-08-23

- [x] F20 — единственная фича сессии; production deploy не выполнялся.
- [x] RED targeted: browser-like NodeSelection + две последовательные toolbar-загрузки — 1 failed / 6 skipped; текущий HTML содержал только второй img, без figure и первого URL.
- [x] GREEN targeted той же командой — 1 passed / 6 skipped.
- [x] Related regression: `RichTextEditor.test.tsx`, `RichTextContent.test.tsx`, `PostComposer.test.tsx` — 3 files / 16 passed.
- [x] Проверены одиночный img, middle-of-text, 2/3 последовательные uploads, standalone delete и carousel-frame delete.
- [x] Full frontend: `npm test` — 15 files / 72 passed; `npm run build` — success, 114 modules, только стандартный Vite chunk-size warning.
- [x] Full backend: `python -m pytest tests -q --color=no --basetemp .pytest-f20-full` — 63 passed in 14.19s; backend не менялся.
- [x] Final `./init.sh` outside sandbox stopped before MPS tests only at the known external Hermes pip check (missing charset-normalizer); project suites were run separately and passed.
- [x] Fix ограничен `RichTextEditor`: setImage + text selection/GapCursor в одной chain, затем прежний groupAdjacentImages; новых dependencies нет.
- [x] `ImageCarouselNode`, sanitizer, database и production не менялись.
- [x] `feature_list.json` валиден; F20 evidence, `claude-progress.md` и `session-handoff.md` обновлены.
- [x] Drag-and-drop, paste, reorder и autoplay не начаты.

## Session 48 F19 local checkpoint — 2026-08-23

- [x] Диагностика до кода: два временных production JPEG upload — 200, media GET — 200 image/jpeg и 1200x800; published React carousel region/CSS/Next работают. Причина stacking локализована в composer без ImageCarouselNode NodeView.
- [x] Временная production-диагностика очищена: article DELETE — 204, post GET — 404, ровно два созданных media-файла удалены и GET — 404.
- [x] RED targeted: три frontend test-файла — 6 failed / 9 passed; отсутствовали editor NodeView/delete, picture SVG и удаление select, reusable carousel падал при сокращении активного списка.
- [x] GREEN targeted: `RichTextEditor.test.tsx`, `RichTextContent.test.tsx`, `PostComposer.test.tsx` — 3 files / 15 passed.
- [x] Full frontend: `npm test` — 15 files / 71 passed; `npm run build` — success, 114 modules, только стандартный Vite chunk-size warning.
- [x] Full backend: `python -m pytest tests -q --color=no --basetemp .pytest-f19-full` — 63 passed in 16.62s; backend/SSR/sanitizer не менялись.
- [x] Final `./init.sh` outside sandbox stopped before MPS tests only at the known external Hermes pip check (missing charset-normalizer); F19 не меняет это внешнее окружение.
- [x] Stored HTML остаётся только `figure[data-carousel="images"]` + `img`; editor-only NodeView markup и hidden contentDOM не сериализуются.
- [x] Dependencies/database/production deploy не менялись; F19 production rollout ожидает отдельного подтверждения владельца.
- [x] Drag-and-drop, paste, reorder и autoplay не начаты и остаются отдельным будущим scope.

## Session 47 F18 local checkpoint — 2026-08-23

- [x] RED backend: `python -m pytest tests/test_posts.py -q --basetemp .pytest-f18-red` — 1 expected failure: nh3 removed unsupported `figure[data-carousel]`, while the imgs remained.
- [x] RED frontend: `npm test -- --run src/components/RichTextContent.test.tsx src/components/RichTextEditor.test.tsx` — 3 expected failures: no carousel controls, no strict carousel markup after sanitize and no grouping of two uploaded images.
- [x] GREEN targeted: backend `test_posts.py` — 4 passed; frontend — 2 files / 9 passed, including singleton preservation, carousel navigation and strict client sanitization.
- [x] Full backend: `python -m pytest tests -q --color=no --basetemp .pytest-f18-full-confirm` — 63 passed in 18.97s.
- [x] Full frontend: `npm test` — 15 files / 67 passed; `npm run build` — success, 113 modules (standard Vite chunk-size warning only).
- [x] Final `./init.sh` outside sandbox stopped before MPS tests only at the known external Hermes pip check (missing charset-normalizer); F18 does not modify that environment.
- [x] Scope is strict `figure[data-carousel="images"]` / `img[src,alt]`, custom TipTap grouping and an accessible React renderer. No new dependency, database change or production deployment.
- [x] F19 is intentionally deferred: drag-and-drop, paste insertion, reorder and autoplay require separate product scope.
- [x] Approved production rollout: `6ab2e40` pushed; VPS fast-forwarded `61ebd31 → 6ab2e40` after `mps-backup.service` Result=success. mps-backend restarted and loopback `/api/v1/health` returned ok; frontend remote `npm ci && npm run build` passed with production API/bot markers and no localhost API. Old dist is recoverable at `/root/backups/mps-frontend-f18-20260823T221000Z`; permissions refreshed and `deploy/smoke.sh` — `[OK]`.
- [x] Authorized live API/browser smoke: three valid PNG uploads, then a published temporary article with `figure[data-carousel="images"]` and a separate img. Guest browser exposed carousel region, prev/next and dots; Next selected slide 2/second image and Previous restored slide 1/first image, while the ordinary img stayed outside carousel. Cleanup DELETE — 204; API GET — 404; exactly three smoke media files removed. No Telegram-authenticated browser session was available, so literal toolbar interaction is not claimed as browser-authenticated.

## Session 46 F17 local checkpoint — 2026-08-23

- [x] RED: `python -m pytest tests/test_media.py -q --basetemp .pytest-f17-red` — 1 expected failure; valid-signature/MIME truncated PNG lazy-loaded successfully until `image.save()` raised Pillow `OSError: image file is truncated` outside validation.
- [x] GREEN targeted: `python -m pytest tests/test_media.py -q --basetemp .pytest-f17-green-2` — 6 passed; corrupted PNG returns `422 «Некорректное изображение»` and leaves no media file.
- [x] Full backend: `python -m pytest tests -q --basetemp .pytest-f17-full` — 62 passed in 16.95s.
- [x] Final `./init.sh` outside sandbox stopped before MPS tests only on known external Hermes `pip check` (missing charset-normalizer); F17 does not alter that environment.
- [x] Scope only `backend/app/api/media.py` validation and `backend/tests/test_media.py`; frontend, dependencies, database and F14 Phase 3 untouched.
- [x] Production backend was intentionally unchanged until the separately approved F17 rollout.
- [x] Approved backend-only production rollout: `35f6914` pushed; VPS fast-forwarded `ca0880f → 35f6914`; `mps-backend` restarted, loopback health ready on attempt 2 and `deploy/smoke.sh` — `[OK]`.
- [x] Authorized live media smoke: valid-signature/MIME truncated PNG → `422 «Некорректное изображение»` with unchanged media file count; valid JPEG/PNG/WebP each → 200. Exact three test media files were removed and file count restored.

## Session 45 F16 local checkpoint — 2026-08-23

- [x] Backend contract read before UI work: authenticated `POST /api/v1/media` accepts JPEG/PNG/WebP up to 10 MiB, returns `{url}`, invalid/oversized input returns 422; backend unchanged.
- [x] RED подтверждён: RichTextEditor image button/input отсутствовали (3 expected failures); RichTextContent published-image rendering already passed (3 tests).
- [x] GREEN targeted: 2 frontend files / 6 passed — toolbar, FormData upload, current-selection img insertion, local error alert without reset, published img rendering.
- [x] Full frontend: `npm test` — 15 files / 64 passed; `npm run build` — success, 111 modules.
- [x] Full backend: `python -m pytest tests -q --basetemp .pytest-f16-full` — 61 passed in 12.31s.
- [x] Final `./init.sh` outside sandbox stopped before MPS tests only on the known external Hermes `pip check` (missing charset-normalizer); F16 does not modify that environment.
- [x] `@tiptap/extension-image` 3.30.2 added as approved official TipTap extension; drag-and-drop, paste and carousel intentionally remain separate.
- [x] Backend and database intentionally unchanged before the separately approved frontend-only rollout.
- [x] Approved production rollout: `7a793f0` pushed; VPS fast-forwarded `8255d55 → 7a793f0`; backend diff empty and `mps-backend` remained active. Remote `npm ci && npm run build` verified production API/bot bundle markers and localhost absence; rollback `/root/backups/mps-frontend-f16-20260823T131817Z`; `deploy/smoke.sh` — `[OK]`.
- [x] Authorized live API/browser evidence: valid Pillow PNG upload — 200; temporary published article rendered exactly one guest-browser img; invalid MIME — 422 with Russian detail; cleanup DELETE — 204, subsequent GET — 404. Live authenticated toolbar/toast click could not run because no editor/admin browser session was available; local DOM regression and served toolbar marker remain the evidence for that UI path.
- [x] Separate F03 contract discrepancy recorded, not fixed: corrupted bytes declared `image/png` return 500 from Pillow rather than the documented 422.

## Session 44 F15 local checkpoint — 2026-08-23

- [x] RED подтверждён: composer не предзаполнялся, edit/delete controls отсутствовали.
- [x] GREEN targeted: 3 frontend файла / 24 passed — visibility editor/admin vs guest/reader/premium, prefill, PATCH payload, delete confirmation/redirect.
- [x] Full frontend: `npm test` — 15 files / 61 passed; `npm run build` — success, 110 modules.
- [x] Full backend: `python -m pytest tests -q --basetemp .pytest-f15-full` — 61 passed in 14.11s.
- [x] `./init.sh` вне sandbox снова остановился до MPS tests только на внешнем Hermes `pip check` (missing charset-normalizer).
- [x] Backend, database and production intentionally unchanged; F15 deploy waits for separate owner approval.
- [x] Approved frontend-only production rollout: VPS at `8255d55`, rollback `/root/backups/mps-frontend-f15-rollback-20260823T124845Z`, served F15/API markers verified, localhost absent, backend active and `deploy/smoke.sh` passed.
- [x] Authorized temporary editor/admin API smoke: create 201, PATCH 200 with same slug/body update, DELETE 204 and GET 404 after cleanup.

## Session 43 final checkpoint — 2026-08-23

- [x] F14 production state recorded: modal composer, Bold-space `onUpdate` fix and full UI-fix series.
- [x] Comments moderation remains default-off and admin-configurable; reviews untouched.
- [x] Likes UI deployed in Feed and full article; local authenticated toggle and guest login interception have regression coverage.
- [x] Production code revision `d042d46`: VITE values/bundle marker verified, smoke passed, backend remained active.
- [x] Evening backlog is recorded in `session-handoff.md`: edit/delete UI, Phase 2 image upload, then Phase 3 carousel.

## Session 41 local checkpoint — 2026-08-23

- [x] RED подтверждён: article UI не содержал button `Нравится: 3`.
- [x] GREEN targeted: 3 frontend files / 20 passed — controls в Feed и ArticleComments, authenticated toggle 3→4→3, guest login modal без POST.
- [x] Full frontend: `npm test` — 15 files / 55 passed; `npm run build` — success, 110 modules.
- [x] Full backend: `python -m pytest tests -q --basetemp .pytest-likes-full` — 61 passed in 15.65s.
- [x] `./init.sh` через Git Bash остановился только на внешнем Hermes pip check (missing charset-normalizer) до MPS tests.
- [x] Production deploy намеренно не выполнялся; ожидает подтверждения владельца.
- [x] После подтверждения production frontend-only rollout выполнен: VPS `8f8978c → d042d46`, rollback `/root/backups/mps-frontend-likes-20260823T001009Z`, VITE API/bot verified, localhost API absent, nginx-readable dist refreshed; backend не перезапускался.
- [x] `deploy/smoke.sh` — `[OK]`; served `/assets/index-DNKgKGJH.js` содержит `Нравится:` и production API; `mps-backend` active.

## Session 40 final checkpoint — 2026-08-22

- [x] F14 rich-text composer и связанные UX-правки задеплоены: modal вместо inline Feed composer, штатный TipTap `onUpdate` вместо ручного `setContent`, общий подзаголовок ленты, без `fishka` в composer, заголовок «Статьи» и CTA после комментариев.
- [x] `comments_moderation_enabled` реализован как admin-настраиваемая setting со значением по умолчанию `false`; миграция `20260822_0010` применена на production PostgreSQL. Ветки `approved`/`pending` покрыты RED→GREEN, а UI сообщает об отправке на проверку при pending. Премодерация reviews не менялась.
- [x] Локальная верификация: migration на чистой SQLite; полный backend pytest — 61 passed; frontend `npm test` — 15 suites / 51 tests passed; `npm run build` — success (110 modules).
- [x] `./init.sh` запускался через Git Bash и остановился только на внешнем Hermes `pip check`: missing `charset-normalizer` у pdfminer-six/reportlab/requests; это не блокирует MPS feature state.
- [x] Production verification: revision `8f8978c`, `mps-backend` active, frontend собран с production VITE values, `deploy/smoke.sh` passed. Live `PATCH /admin/settings` переключил comments moderation, POST вернул `approved`, GET показал комментарий; финальное live value восстановлено в `false`.
- [x] Финальный handoff ограничивает следующий scope read-only диагностикой отсутствующих лайков на опубликованных статьях.

## F14 local completion — 2026-08-22

- [x] Feed heading UI fix `4b17239`: RED — 2 expected frontend failures; targeted GREEN — 13 passed; final frontend `npm test` — 48 passed; `npm run build` — success (110 modules). Frontend-only production rollout with rollback `/root/backups/mps-feed-heading-20260822T151100Z`; `deploy/smoke.sh` passed; backend unchanged and active without restart.
- [x] F14 typing hotfix `7da63d4`: RED showed a manual `setContent` call during Bold text with a space; targeted GREEN — 6 passed; final frontend `npm test` — 48 passed; `npm run build` — success (110 modules). Replaced the manual input rewrite with TipTap `onUpdate`; frontend-only production rollout reached `d67155c`, previous dist retained at `/root/backups/mps-f14-typing-hotfix-20260822T145900Z`, `deploy/smoke.sh` passed; backend unchanged and active without restart.
- [x] F14 composer modal hotfix: RED — 2 expected frontend failures; GREEN targeted — 2 passed; final `npm test` — 46 passed; `npm run build` — success (110 modules). Frontend-only production rollout at `17a1a2d`: staging bundle verified with both VITE values and without localhost API; previous dist retained at `/root/backups/mps-f14-composer-modal-20260822T143700Z`; `deploy/smoke.sh` passed. Backend diff empty, `mps-backend` not restarted and active.
- [x] RED подтверждён: backend default sanitizer сохранял запрещённый `<code>`; frontend rich-text компоненты и composer отсутствовали до реализации.
- [x] GREEN: explicit nh3 allowlist применяется на create и patch; DOMPurify защищает read-render, legacy text остаётся текстом.
- [x] Frontend `npm test` — 44 passed; production `npm run build` — success (110 modules).
- [x] Full backend pytest — 59 passed.
- [x] `./init.sh` выполнен через Git Bash: MPS tests не стартовали только из-за внешнего Hermes pip check (missing charset-normalizer для pdfminer-six/reportlab/requests); F14 code/dependencies этого окружения не изменяет.
- [x] F14 code commit `c837e40` pushed to origin/main.
- [x] F14 production: rollback backup создан; VPS advanced to `c549085`; mps-backend active/readiness green; VITE production bundle verified; `deploy/smoke.sh` passed; direct HTTPS POST HTML sanitization verified and temporary draft cleanup confirmed.

- [x] Audit I-18 и I-20 закрыты; I-21 документирован как отложенный до pre-launch юридической проверки.
- [x] Legal page содержит утверждённые тексты Политики обработки персональных данных и Пользовательского соглашения; реквизиты остаются public settings, без статических секретов.
- [x] Frontend tests — 24 passed; production build успешен.
- [x] Full backend pytest — 47 passed; `./init.sh` — `No broken requirements found`, 47 passed.
- [x] VPS: Alembic применён до `20260820_0008`; backend active на `127.0.0.1:8001`; nginx config test и live HTTPS успешны.
- [x] VPS: `mps-backend.service`, `mps-digest.timer`, `mps-backup.timer`, `postgresql`, `redis-server`, `certbot.timer` — enabled и active.
- [x] VPS: HSTS включён после успешного certbot; адресный `certbot renew --dry-run --cert-name mir.pod-solncem.ru` успешен.
- [x] VPS: первый `mps-backup.service` завершился `Result=success`; создан непустой читаемый dump новой MPS БД.
- [x] VPS: создан первый admin по server-side `ADMIN_TG_ID`; ID не записан в tracker.
- [x] VPS: `/usr/bin/bash deploy/smoke.sh` — `[OK] smoke passed: https://mir.pod-solncem.ru`.
- [x] Незаполненные production env-поля зафиксированы в `session-handoff.md` только именами, без значений.
- [x] Финальная Git-проверка: local `main` совпадает с `origin/main`, рабочее дерево чисто после fetch и push.
