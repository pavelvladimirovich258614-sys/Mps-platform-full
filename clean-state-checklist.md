# clean-state-checklist.md — финальная production control point 2026-08-20

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
