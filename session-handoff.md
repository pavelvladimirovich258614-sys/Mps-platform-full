# Session handoff — МПС

## Current checkpoint — 2026-09-01, фактическое состояние после аудита

SEC-HEIF-UPGRADE остаётся `in_progress` в `feature_list.json`. Статус точный; ниже — на каком шаге плана `docs/SEC-HEIF-UPGRADE-ROLLOUT.md` остановились по факту, проверено read-only на VPS `82.39.213.82` через `mps_deploy_key` 2026-09-01 ~15:09 UTC.

### Что реально выполнено на VPS (шаги 1–5 плана)

1. **Публикация и read-only preflight.** Wheel asset опубликован под тегом `sec-heif-upgrade-1.5.0-libheif1.23.2`; независимый cache-bypassed `curl` ранее вернул HTTP 200, 5,610,340 bytes и SHA-256 `2588563fcf48184a1523e549d741345d43613c35b94e934eba01e8136dc62b3d` — совпадает с `backend/requirements-heif.lock` и с локальной сборкой `D:/mps-platform-full/heif-wheel-build-20260901/dist/`.
2. **Paired rollback backup** создан в `/root/backups/sec-heif-upgrade-paired-20260901T070826Z/` (CURRENT_SHA=3ab6cdb, TARGET_SHA=fe3cd43). Сохранены `stopgap-source.tar.gz`, `installed-package-snapshot/pillow_heif-1.5.0` со старой libheif 1.23.1, `metadata/{service-before.txt, pip-freeze.txt, pip-show-pillow-heif.txt, native-info-current.txt, source-stat.txt, current-git-sha.txt, health-before.json, …}`. Парный файл `PAIR_COMPLETE` помечен `COMPLETE`.
3. **Stage нового wheel:** `/opt/mps-release-staging/sec-heif-upgrade-1.5.0-libheif1.23.2/` создан, root-owned, `umask 077` не утекал в checkout.
4. **Fast-forward application code** выполнен: локальный, `origin/main` и VPS checkout сейчас все на `fe3cd43` (SEC-HEIF-UPGRADE: pin wheel and rollout plan). Файлы `backend/app/api/media.py`, `backend/tests/test_media.py`, `backend/requirements.txt` на диске имеют guarded upgrade-код (есть `libheif_info`, `MINIMUM_SAFE_LIBHEIF = (1, 23, 2)`, `HEIF_UNAVAILABLE`, `HEIF_BRANDS`, request-time `heif_enabled`).
5. **Install только нового wheel** выполнен: `/opt/mps-platform/venv/bin/pip show pillow-heif` показывает `Version: 1.5.0+libheif1.23.2`; `pip freeze` содержит `pillow_heif @ file:///opt/mps-release-staging/sec-heif-upgrade-1.5.0-libheif1.23.2/pillow_heif-1.5.0%2Blibheif1.23.2-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl#sha256=2588563…3d`. В `venv/lib/python3.11/site-packages/pillow_heif.libs/` лежат `libheif-c26addd2.so.1.23.2`, `libde265-173ec07a.so.0.2.1`, `libx265-ee74c10a.so.216` (mtime 2026-09-01 03:19 EDT).

### Что фактически НЕ выполнено и где остановились (шаги 6–10)

- **Шаг 6 — Native verification от `mps`:** выполнен частично при аудите. `runuser -u mps -- /opt/mps-platform/venv/bin/python -c "from pillow_heif import libheif_info; print(libheif_info())"` вернул `{'libheif': '1.23.2', 'HEIF': 'x265 HEVC encoder (4.2+1-e444744)', 'AVIF': '', 'encoders': {'x265': '…', 'mask': 'mask'}, 'decoders': {'libde265': 'libde265 HEVC decoder, version 1.1.1'}}` — libheif 1.23.2, libde265 1.1.1, x265 4.2 — все ключевые признаки для GREEN шага 6 есть. Полный `ldd`/RPATH-чек по `_pillow_heif*.so` и изолированный RGBA HEIC round-trip за рамками этого аудита не запускался; в backup-каталоге есть `metadata/native-info-current.txt` и `metadata/extension-ldd.txt`, но в эту read-only сессию они не перепроверялись против текущего диска.
- **Шаг 7 — Permissions/readability gate:** фактически пройден при аудите. `stat -c "%a"` для `backend/app/api/media.py`, `backend/requirements.txt`, `backend/requirements-heif.lock` = 644, owner root:root; `runuser -u mps -- test -r` для всех трёх — OK. Umask-утечки 077 в checkout нет.
- **Шаг 8 — один restart:** НЕ выполнен. `mps-backend` active/running, **MainPID=1115264, NRestarts=51**, ExecMainStartTimestamp=`Mon 2026-08-31 12:21:13 EDT`. По `journalctl -u mps-backend --since "2026-08-31 12:22 EDT"` других `Started MPS FastAPI backend` нет. Текущий процесс загрузил stopgap-код 12203dd в память ещё **до** того, как на диске появились upgrade-файлы (mtime 2026-09-01 03:16 EDT).
- **Шаг 9 — live production media verification:** НЕ выполнен. HEIC/JPEG upload против работающего API и проверка всех responsive WebP/AVIF вариантов не запускались. По `/proc/1115264/maps` в памяти процесса сейчас нет ни `pillow_heif`, ни `libheif` — stopgap-код 12203dd не импортирует pillow_heif на старте; live API по-прежнему отвечает 422 на HEIC.
- **Шаг 10 — cleanup и closeout:** НЕ выполнен.

### Текущее поведение API (между шагами 5 и 8)

- `/api/v1/health` → `200 {"status":"ok","version":"0.1.0"}`.
- HEIC/HEIF uploads → `422` со stopgap-сообщением (поведение SEC-HEIF-STOPGAP в памяти процесса).
- JPEG/PNG/WebP/AVIF uploads → `200` с шестью responsive WebP/AVIF вариантами, как при stopgap-deploy (live-проверено 2026-08-31 в `live-media-check.json`, в этой сессии не перезапускалось).
- nginx (`MainPID=178361`, NRestarts=0, ActiveEnterTimestamp=`2026-08-20 06:03:39 EDT`) и postgresql не трогались.

### Итог по фиче

`feature_list.json` корректно показывает SEC-HEIF-UPGRADE = `in_progress`. До перевода в `passing` нужно довести шаги 8–10 по плану `docs/SEC-HEIF-UPGRADE-ROLLOUT.md` с live-evidence и затем обновить `evidence` этой фичи.

## Emergency stop — 7-тасковая эстафета остановлена по лимитам, 2026-09-01

Павел сообщил об окончании подписки/лимитов. После этого не запускать новые задачи эстафеты и не продолжать production rollout без новой сессии. Текстовые правила `verification-before-completion` и `tdd-fix-workflow` применены в пределах известного gap `.codex/skills/*.md`: не считать незавершённый шаг GREEN, не коммитить непроверенное и сохранять точную границу между частичным deploy и live verification.

Эта остановка **не отменяет** доведение SEC-HEIF-UPGRADE до шага 8, если Павел отдельно подтвердит restart в новой сессии (см. «Следующий шаг» ниже).

### Точный статус очереди 1–7

| Задача | Статус на остановке | Что сделано / не сделано | Вопрос или следующий gate |
|---|---|---|---|
| 1. Импорт 125 фишек | **Не начата** | В этой эстафете не было диагностики sitemap, локального dry-run, проверки дубликатов, импорта или production DB-операции. Исторический импорт F37 не считать выполнением именно этой задачи. | Не задан; перед стартом определить authoritative sitemap/source и состав недостающих записей. |
| 2. Email-коды mail.ru/yandex.ru | **Не начата** | Не запускались проверки HostKey/Unisender-блока, DNS, SPF или DKIM; DNS не изменялся. | Перед работой подтвердить, можно ли исправить deliverability без изменения DNS. Любая требуемая DNS-запись — отдельный вопрос Павлу до mutation: какие точные TXT/MX значения и TTL согласованы. |
| 3. Tiptap вместо текущего редактора | **Не начата в этой эстафете** | Новая диагностика хранения формата, RED-тесты совместимости и migration plan не запускались. Исторический Tiptap-код в репозитории не является доказательством выполнения нового scope по замене/совместимости. | Если потребуется изменение формата сохранённых постов/черновиков, сначала получить решение по обратной совместимости и плану миграции; данные не менять автономно. |
| 4. «Закрытый клуб» real-time по странам | **Остановлена до реализации, вопрос** | Код, polling, WebSocket/SSE, nginx и backend не менялись. | Что именно означает «закрытый»: кто допускается, нужна ли отдельная модерация/роль и должен ли UI быть отделён от обычного форума? После ответ после выбрать безопасный MVP (polling) либо отдельно согласовать полноценный real-time стек. |
| 5. Per-country Иришка | **Остановлена до реализации, вопрос** | Диагностика текущей 248-entry базы/keyword search/MiniMax и код не запускались/не менялись. | Подтвердить смысл per-country: отдельная база знаний на страну (а) или фильтр контекста темы форума в общем движке (б). Вариант (б) — допустимый безопасный MVP после подтверждения покрытия запроса. |
| 6. Human-in-the-loop Иришка/логи | **Остановлена до реализации, вопрос** | Read-only admin UI, API, схема и активное вмешательство в ответы не создавались. | Подтвердить границу: только read-only просмотр истории и маркировка плохих ответов либо также редактирование/перехват ответов в реальном времени. Второе не начинать без отдельного scope/безопасностного решения. |
| 7. UGC-механика | **Не начата, остановлена с вопросами** | Код, данные, миграции и UX не менялись. | (1) Что именно входит в UGC сверх уже существующих публикаций, отзывов, фишек и форума? (2) Какие actors/content types и moderation states нужны? (3) Какой конкретный пользовательский поток/критерий готовности требуется? |

Итог: ни одна из семи задач эстафеты не прошла RED→GREEN→полную верификацию→deploy→smoke. Ни одна не была задеплоена в рамках этой очереди; rollback/smoke-failure отсутствуют.

## Рабочее дерево и публикация

До этой правки `session-handoff.md` `git status --short` показывал `M session-handoff.md` (незакоммиченная секция «Emergency stop» была добавлена в прошлой сессии). В этой сессии `session-handoff.md` и `claude-progress.md` переписаны так, чтобы отразить фактическое состояние VPS после аудита. Эти правки не закоммичены и не запушены — следующая сессия должна сначала перечитать оба файла и решить, нужен ли отдельный documentation commit. Локальный и `origin/main` HEAD остаются на `fe3cd430a7af41ef652b4ab4c834e6868ac0fdea`; VPS checkout уже на этой же ревизии.

## Следующий шаг — только после явного подтверждения владельца

Если Павел подтверждает продолжение SEC-HEIF-UPGRADE:

1. Live HEIC/JPEG/HEIF smoke против работающего API одним прогоном — но фактически это станет возможным **только после** шага 8 (restart), потому что текущий процесс ещё stopgap.
2. Один `systemctl restart mps-backend` (шаг 8), затем немедленно health, `journalctl` на отсутствие crash-loop, `deploy/smoke.sh`.
3. Live production media verification (шаг 9) по временному читателю: реальный HEIC/HEIF, MIME/filename disguise, malformed/truncated HEIF, JPEG, все responsive WebP/AVIF.
4. Cleanup (шаг 10): удалить точно созданные media/test principal, доказать remaining=0, повторить health/smoke, подтвердить стабильный PID/service state, точный Git SHA `fe3cd43`, native версии, tracked/index clean, сохранение известных untracked (`\.deploy-backups/`, каталог `\\`, `frontend/app/.env.production`, `venv.py310.failed/`).
5. Только после полного live GREEN обновить SEC-HEIF-UPGRADE на `passing` и записать live-evidence в `feature_list.json`.

Если Павел **не** подтверждает продолжение — VPS остаётся в текущем pre-restart состоянии; ничего не откатывать без причины; rollback выполнять только парно (stopgap source + старый wheel `pillow-heif==1.5.0` с libheif 1.23.1) по плану.

## VPS и deployment safety

- SSH: только `mps_deploy_key` (`~/.ssh/config` для хоста `82.39.213.82` ошибочно указывает `id_ed25519_deploy`; реально работает `mps_deploy_key`. В этой сессии использовался `mps_deploy_key` явно, `BatchMode=yes`, `IdentitiesOnly=yes`, strict host-key checking, fingerprint `SHA256:WiGVmbZnCZFtgaCfahdD1IyoUccJ0Si2xFb4TcHxSEE`).
- Посторонний `82.26.151.81` — не наш сервер, в этой и любой другой сессии не трогать.
- Сохранить известные VPS untracked: `.deploy-backups/`, каталог с именем `\`, `frontend/app/.env.production`, `venv.py310.failed/`.
- Не запускать pytest против production DB.
- Не выполнять общий `pip install -r` при rollout: только accepted wheel с `--no-deps`; сравнить `pip freeze` до/после.
- Backup `umask 077` должен быть ограничен backup subshell. В прошлой сессии leakage оставил root-owned `media.py` mode 600 и вызвал outage. До restart обязательно `stat` и `runuser -u mps -- test -r` для всех изменённых application files. Не ослаблять `.env`, keys или backups.
- Rollback атомарный: остановить backend, восстановить stopgap source и старый wheel вместе, проверить readability/native state, запустить один раз, подтвердить HEIC 422 + JPEG 200/variants + health/smoke.
- `deploy/smoke.sh` и `deploy/backup.sh` на VPS имеют mode 644 без executable-бита (известная проблема C-06 из `docs/AUDIT_REPORT.md`); для smoke использовать `curl` напрямую, а не запуск файла.
- VPS Python остаётся `3.11.0rc1`; замена на stable security-patched interpreter — отдельный backlog.

## Artifact and source evidence

- Local wheel: `D:/mps-platform-full/heif-wheel-build-20260901/dist/pillow_heif-1.5.0+libheif1.23.2-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`.
- Build verification: `D:/mps-platform-full/heif-wheel-build-20260901/VERIFICATION.md`.
- Source pins/checksums: `D:/mps-platform-full/heif-wheel-build-20260901/checksums.sha256` and Dockerfile in the same directory.
- Planned release URL and hash: `backend/requirements-heif.lock`.
- Production plan: `docs/SEC-HEIF-UPGRADE-ROLLOUT.md`.
- Stopgap production report: `D:/mps-platform-full/heif-stopgap-release-20260901/verification.md`.
- VPS paired upgrade backup: `/root/backups/sec-heif-upgrade-paired-20260901T070826Z/` (CURRENT_SHA=3ab6cdb, TARGET_SHA=fe3cd43, `PAIR_COMPLETE`).
- VPS stopgap backup: `/root/backups/mps-heif-stopgap-20260831T161551Z/` (source-sha=07566c8, target-sha=12203dd).

## Known independent backlog

1. Rotate `AUTH_BOT_TOKEN` and verify dependent integrations/log handling; do not copy token values into trackers.
2. Replace VPS Python 3.11.0rc1 with a supported stable security-patched interpreter and a new reproducible venv.
3. Reconcile the recorded 33 dependency-version drifts after Python stabilization.
4. Address remaining Medium, then Low security-audit findings as separate scopes.
5. F47/F48c remain independent historical `in_progress` exceptions; do not mix them into SEC-HEIF-UPGRADE.

## Known local exceptions

- `init.sh` inside sandbox can fail with Git Bash Win32 Error 5. Outside sandbox it reaches the shared global Windows `pip check` and fails on unrelated global package conflicts. Direct isolated MPS suites are recorded separately; these failures are not called GREEN.
- `verification-before-completion` и `tdd-fix-workflow` прочитаны и применены текстуально. Разрыв между файлами `.codex/skills/*.md` (которые присутствуют в checkout) и их текстовым применением остаётся известным и не меняется этой правкой.