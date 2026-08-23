# clean-state-checklist.md — финальная production control point 2026-08-20

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
