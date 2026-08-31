# Session handoff — МПС

## Current checkpoint — 2026-09-01, production releases complete; documentation closeout

1. **TOOLING-VITE6: passing, в production.** Vite 6.4.3 + Vitest 3.2.6 (plugin-react 4.7.0) выпущены вместе коммитами 06dd1b8 и 07566c8. Исходные 5 npm findings (3 moderate, 1 high, 1 critical) закрыты; свежий closeout `npm audit --registry=https://registry.npmjs.org --json` — total=0, exit 0. Принятые ранее frontend 32 файла / 200 тестов с первого прогона без правок, build, dev/HMR и real-dist browser light/dark 375/768/1024/1440 (8/8) не выдаются за повторные проверки документационного шага.
2. **SEC-HEIF-STOPGAP: passing, в production на 12203dd84e9b40e70c819c4b6c699e0c9881ad0e.** POST /api/v1/media временно отклоняет HEIC/HEIF: HTTP 422, `Формат HEIC/HEIF временно недоступен, используйте JPEG/PNG/WebP`. Decoder allowlist не допускает HEIF даже при подмене MIME/filename; JPEG/PNG/WebP/AVIF остаются в прежнем pipeline. Native libheif 1.23.1 **не обновлена и не объявлена исправленной**.
3. Stopgap verification до релиза: RED 10 failed / 4 passed / 6 deselected; media GREEN 20 passed, полный backend 158 passed / 0 skipped на одноразовом PostgreSQL 16 со штатными Alembic-миграциями; targeted final 8 passed / 12 deselected, flake8 двух файлов passed. Это сохранённое evidence реализации, не новый прогон closeout. Живая проверка после deploy: HEIC и тот же HEIC под JPEG — 422 с точным сообщением; JPEG — 200, шесть responsive WebP/AVIF файлов, публичные варианты GET 200 и decode OK. Все шесть файлов и временный reader удалены, remaining=0. Health/smoke exit 0, frontend dist не менялся.
4. Свежий closeout preflight: local HEAD/origin reference и VPS на 12203dd; VPS tracked tree clean; production lockfile Vite 6.4.3 / Vitest 3.2.6. Backend active/running, health status=ok, media.py mode 644, PID 1115264 и NRestarts 51 без прироста после восстановления. Само число 51 накопилось при неуспешном первом старте, это не новые рестарты.
5. **Полный security-аудит по 13 запрошенным категориям завершён как диагностика**, snapshot исходников/production 07566c8: [report.md](D:/mps-platform-full/security-audit-20260831/report.md), [dependencies.md](D:/mps-platform-full/security-audit-20260831/dependencies.md). Отчёты вне git сохранены, не переписаны. Завершение аудита не означает устранение всех находок; C1 только временно mitigated, H1/H2 и остальные замечания открыты. Не заявлялся полный CVE-анализ всей ОС/каждого native codec.
6. Владелец разрешил отдельный документационный коммит **только** feature_list.json, claude-progress.md, session-handoff.md поверх 12203dd, push и синхронизацию VPS без нового разрешения. Финальный documentation SHA читается из git после коммита и сверяется с GitHub/VPS; не угадывать его внутри собственного коммита. Application release остаётся 12203dd. Только fast-forward трекеров: без restart, frontend rebuild, install, миграций, изменений конфигурации/секретов/БД. Не повторять старые pending-release шаги из исторических записей.

## Следующие шаги — приоритет владельца по аудиту

1. **Полноценный upgrade libheif >=1.23.2 и возврат HEIC.** Сначала определить совместимый пакет/native build и подтвердить фактически загруженную версию в целевом окружении; одного номера pillow-heif или зелёного pip-audit недостаточно. Отдельно согласовать узкий rollout, написать RED на восстановление HEIC/HEIF, вернуть декодер только после обновления, пройти targeted media и полный backend suite (с одноразовой migrated PostgreSQL), health/smoke и live HEIC/JPEG с очисткой. До верификации исправленной библиотеки сохранять stopgap. Релиз/rollback не должен незаметно вернуть уязвимый путь.
2. **Ротация AUTH_BOT_TOKEN.** Аудит нашёл два точных совпадения действовавшего токена в историческом journal за 2026-08-26, в исключениях Telegram sendMessage. В trackers/log exports секрет не копировать. Отдельный согласованный operational шаг: замена токена, проверка зависимых Telegram-интеграций и Login HMAC, защита от повторного логирования, доступ/retention исторических логов. Ротация ещё не выполнена; публичная утечка или компрометация бота не доказаны.
3. **Убрать VPS Python 3.11.0rc1 (release candidate) и 33 расхождения пакетов.** Выбрать поддерживаемый stable security-patched интерпретатор; создать отдельный воспроизводимый venv с согласованными constraints/lock вместо in-place обновления production. Drift snapshot: [dependency-drift.json](D:/mps-platform-full/security-audit-20260831/dependency-drift.json), 33 общих пакета local/VPS имеют разные версии. Проверить install/pip check в целевом venv, imports, Alembic compatibility, весь backend suite и rollback; учесть setuptools и остальные находки из dependencies.md. Не считать локальный GREEN доказательством идентичного production graph.

## Известный системный риск deployment permissions

- При security deploy ограничительный **umask 077** для backup сохранился при checkout: root-owned media.py получил **600 вместо 644**, service user mps не смог прочитать файл, первый restart вызвал PermissionError и недоступность backend. Исправление прав на пяти обновлённых tracked файлах до 644 и повторный restart восстановили сервис; health/smoke и live upload прошли.
- **Не считать разовой случайностью.** Проверить/исправить deploy-скрипт/операционный сценарий при следующей возможности, предпочтительно до очередного backend restart: локализовать umask 077 в операции backup, явно контролировать режим checkout, ownership и читаемость изменённых файлов от service user до restart, затем readiness с rollback. Не ослаблять права .env, ключей и backup до 644; секреты должны остаться защищёнными. Исправление самого workflow в этот документационный коммит не входит.
- Были также прерывистые SSH timeouts; использовать существующий mps_deploy_key, BatchMode/IdentitiesOnly и проверять результат команды, не считать тайм-аут успешным deploy.

## Актуальные release evidence и rollback

- Stopgap report: [verification.md](D:/mps-platform-full/heif-stopgap-release-20260901/verification.md). Backend source backup **07566c8**: `/root/backups/mps-heif-stopgap-20260831T161551Z/backend-before.tar.gz`, SHA-256 `600b90b4cd7e331c2439fb2cb57188646409657535331cb827074ccf80aabbab`, checksum verified. Архив только tracked backend source, не БД/media/.env/venv. Откат вернёт уязвимый HEIF-путь — только аварийная мера доступности.
- Vite release report: [vite6-production-release.md](C:/Users/vin-m/.codex/visualizations/2026/08/31/01a057ec-8c49-78c0-9ff1-976f3a32506e/vite6-production-release.md). Frontend backup `/root/backups/mps-frontend-vite6-20260831T151143Z/frontend-dist.tar.gz`, SHA-256 `43acd2f719b648e00932819816923e98df69d78096d0b7b715ec920e638efe46`. Production build/served `index-Cx13uxnX.js` SHA-256 `10aab2d75ed5501f94431932ad0f72fc01eb5d29134971d15ae3e18288501009`, VITE values matched, localhost fallback absent, smoke passed, backend PID 1041154 тогда не менялся (позже изменился при stopgap restart).
- Не использовать pytest на production БД: fixtures drop/create tables. Test PostgreSQL заранее подготовить штатными Alembic-миграциями, включая pg_trgm; Docker/test DB не оставлять работающими после проверок.

## Сохранённые независимые задачи и границы

- Назначение Сергея админом завершено существующей management-командой: ровно один matching user, роль admin, не заблокирован. Не повторять создание; идентификаторы и лишние персональные данные не выводить.
- Q&A F40/F41: manager replies разрешены через настроенный managers group chat, отдельного user/username whitelist нет. Павел вручную добавляет четырёх менеджеров в Telegram-группу; роли admin/editor сайта им не назначались.
- Svyazio: live-widget message-creation API ранее вернул 201, но видимость в «Чаты» и Telegram-уведомления агенту не подтверждены из-за отсутствия входа в SaaS-панель. Проверить personal Telegram notification binding агента и channel/department assignment; точная причина ещё не доказана, код виджета на основании этой диагностики не менять.
- F47/F48c остаются прежними in_progress, другие 60 feature records не меняются. Никакие остальные audit fixes в этот closeout не включены.
- verification-before-completion и tdd-fix-workflow прочитаны и применены. Для документационного closeout не создавался искусственный RED, старые suites не выдаются за новые. Текстовый `.codex/skills/*.md` gap остаётся известным и неизменённым.
- Известные init.sh Win32 Error 5/global shared pip-check сбои не чинить изменением общей Python-среды. Прямые MPS suites и их фактические результаты учитываются отдельно.

## Historical checkpoint — WIDG-1 + WIDG-2 production complete

The records below preserve the previous rollout/rollback evidence. Stage 4 did not reconnect to the VPS or refresh production health. Initial session preflight recorded local/origin/VPS `38c6e07` before the local upgrade.

1. WIDG-1 and WIDG-2 are both production-deployed `passing`. The completed application rollout is `9586cafe0885941cfcfbd6c4f3bd634751e69680`, confirmed on local `main`, `origin/main` and the VPS checkout before this documentation-only closeout.
2. WIDG-1 commits `6711b0f` and `dc2e89e` are live. Alembic reached `20260830_0020`; `mps-backend` is active/healthy. The public tour-request form, consent gate, persistence and existing Telegram relay path are deployed.
3. WIDG-2 commit `9586caf` is live. `Layout` mounts one idempotent Svyazio integration; the mobile-only launcher/teaser offset is applied through the open Shadow DOM, while desktop and fullscreen vendor behavior remain unchanged.
4. The WIDG-2 production frontend build contains the production API/bot values and no localhost fallback. The served bundle matched the built asset, `deploy/smoke.sh` passed, and backend PID remained unchanged because this rollout was frontend-only.
5. Live iPhone 14 verification at 390x664 confirmed both launchers simultaneously visible after the normal cookie-consent step: WIDG-1 on the left, WIDG-2 on the right, no mutual or mobile-nav overlap, `bottom: 74px`, zero horizontal overflow, clickable Svyazio launcher and fullscreen 390x664 chat with no page errors or Svyazio request failures.
6. Known vendor boundary: the current third-party launcher exposes no accessible name inside its Shadow DOM. This remains a separate vendor/accessibility decision rather than an unverified local override.

## Completed production checkpoint — WIDG-4 + P0-POST-MEDIA

1. WIDG-4 and all five P0 post-media stages are production-deployed and verified `passing`. Application code was deployed at `0b33784d18736b82526b9dd35cc6def245ae239c`; the final scoped nginx-test/template/tracker commit is the next commit in `origin/main` after this handoff.
2. PostgreSQL is at Alembic `20260830_0019 (head)` with `pg_trgm` and the three discovery indexes. `mps-backend` is active/healthy. Production serves `index-Y8_k3Iw_.js` with the production API/bot markers and no localhost fallback.
3. The production post `poezdka-v-tailand-2026` now references four UUID media sets with 24 physical WebP/AVIF variants. The guarded transaction updated one row, originals were not deleted, and every public variant matched the saved SHA manifest.
4. The scoped `/media/` nginx mapping serves AVIF as `image/avif` and WebP as `image/webp`, retains `try_files`, inherited `nosniff`, and 30-day cache headers. `nginx -t`, reload and post-change smoke passed without restarting backend.
5. Start the next owner-selected task from the normal HEAD/origin/VPS/clean/init preflight. Do not reopen this cycle because of the known frontend chunk warning, guest 401s, F47 or F48c; those are separate scopes.

## Verified rollback inventory

- PostgreSQL: `/var/backups/mps/mps-2026-08-30-084759.dump.gz`, SHA-256 `3912ffd2bc3d21da7f74ff93b781591391890f015fe77b64067cbff98e36689f`; `pg_restore --list` passed.
- Combined media rollback directory: `/root/backups/p0-post-media-20260830T124758Z`.
- Frontend archive SHA-256: `afdb9b4cbde9c2aac10ca7367e82df204c469c7fc575491f5118045336f37f91`.
- Original post-row SHA-256: `5586f418021864831eb47630258bfdb9d37d170c8cfb5bde08d88c54fc102c6c`.
- Four-original PNG manifest SHA-256: `a68dd7201f9902eea5b5bd35104b5b1be568499e95a4165548531becae77bf33`.
- 24-variant manifest SHA-256: `ccbd75139039f4a3c233a33a8e47ac5335204b4fc0dd89425287da2b7548da6f`; mapping SHA-256 `df28ac2c47413aedcc62ef9b2e81e4eb8fbfc3127725fa388de3573711d11587`.
- Nginx `sites-available` backup: `/root/backups/mps-nginx-avif-20260830T130411Z.conf`, SHA-256 `ced963e07a1da93ab8244f60702f9cea24b387164777f949f8b1056b8a179dcc`.
- Nginx active `sites-enabled` backup: `/root/backups/mps-nginx-enabled-avif-20260830T130857Z.conf`, SHA-256 `6fb3004d3fc419a019b09ec56206fdc057bbaff3b8ad65054bf7c28c0287bee7`.

## Historical final verification evidence

- MIME RED: deploy-bootstrap target `1 failed / 3 passed` because scoped types/cache were absent. After preserving production `try_files`, GREEN target passed `4/4`.
- Public media: 24/24 SHA matches; AVIF=`image/avif`, WebP=`image/webp`, `X-Content-Type-Options=nosniff`, `Cache-Control=max-age=2592000`, Expires present.
- Throttled Playwright at 400 Kbit/s, 400ms latency, CPU×4: iPhone 14 load/network-idle `7.945/21.434s`; Pixel 7 `7.490/20.851s`, versus original `97–112s`. Initial media `418316` bytes; no inactive slide requests, request failures or page errors.
- Full backend: `131 passed, 10 skipped` (the known PostgreSQL-only environment skips). Full frontend: 29 files / 190 tests. Production-configured build: 123 modules, JS 705.15 kB / gzip 228.02 kB, expected CJS/chunk warning only.
- `deploy/smoke.sh` passed after code deployment and again after the nginx MIME reload. Backend PID remained `1034912` across the nginx-only change.

## Known boundaries

- `./init.sh` still stops at the known Git Bash Win32 Error 5/global shared-environment `pip check`; direct complete MPS suites are the completion evidence. Do not repair the shared environment in this project.
- The known text-rule `.codex/skills/*.md` gap remains unchanged. The existing `verification-before-completion/SKILL.md` and `tdd-fix-workflow/SKILL.md` were read and applied; no replacement rule files were added.
- Three guest `401` console messages are exactly `/api/v1/me`, `/api/v1/notifications`, and `/api/v1/auth/refresh`; none is a failed/hanging request.
- The historical 705.15 kB production chunk and the local Stage 3 Vite 6 chunk of 731.91 kB remain above the 500 kB warning threshold; optimization is a separate scope.
- `/etc/nginx/sites-enabled/mps-platform` is a regular file rather than a symlink to `sites-available`; both exact media blocks were backed up and updated. Do not silently change that topology in a future task.
- F47 and F48c remain their pre-existing independent `in_progress` tracker items and were not changed by this cycle.
