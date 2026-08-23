# clean-state-checklist.md — финальная production control point 2026-08-20

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
