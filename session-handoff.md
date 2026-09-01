# Session handoff — МПС

## Current checkpoint — 2026-09-01

1. **SEC-HEIF-UPGRADE локально GREEN, но остаётся `in_progress`.** Guarded HEIF-код закоммичен как `d8baea6`; production deploy не выполнялся. На каждом media-запросе HEIF opener/decoder allowlist включаются только при фактическом native libheif >=1.23.2; `<1.23.2`, отсутствующий или неисправный runtime автоматически сохраняют stopgap 422.
2. Wheel: `pillow-heif==1.5.0+libheif1.23.2`, cp311 manylinux_2_27/2_28, 5,610,340 bytes, SHA-256 `2588563fcf48184a1523e549d741345d43613c35b94e934eba01e8136dc62b3d`. Изолированно доказаны libheif 1.23.2, libde265 1.1.1, x265 4.2/ABI 216, RPATH `$ORIGIN/pillow_heif.libs`, отсутствие загрузки 1.23.1, imports/`pip check` и реальный RGBA HEIC round-trip.
3. TDD evidence: RED на stopgap — 7 failed / 3 passed / 12 deselected. Финальный media target — 23 passed. Свежий pre-commit PostgreSQL 16 мигрирован до `20260830_0020 (head)`; полный backend — 161 passed / 0 skipped in 105.06s; flake8 E4/E7/E9/F и `pip check` прошли. Коммит содержит ровно `media.py` и `test_media.py`.
4. Dependency/rollout preparation после `d8baea6` пока **не закоммичена**: `requirements.txt` включает новый `requirements-heif.lock` с exact version, GitHub release-asset URL и SHA-256. Asset опубликован под новым тегом в контролируемом origin; свежий cache-bypassed `curl` вернул HTTP 200, 5,610,340 bytes и точный SHA-256, имя и внутренние manylinux-теги совпали.
5. Полный план: `docs/SEC-HEIF-UPGRADE-ROLLOUT.md`. Он требует publish/hash preflight, paired source+old-wheel backup, fast-forward exact SHA, установку только нового wheel с `--no-deps`, native-проверку от `mps`, проверку mode/readability до restart, ровно один restart, health/smoke, live HEIC/JPEG/variants и точный cleanup.
6. Rollback только парный: stopgap code **вместе** со старым wheel. Запрещено оставлять новый HEIF-enabled code со старой libheif 1.23.1; stopgap code с новым wheel также считается несогласованным rollback state. До live verification production остаётся на текущем stopgap и libheif 1.23.1.
7. TOOLING-VITE6 и SEC-HEIF-STOPGAP остаются production-deployed `passing`. Это не означает, что permanent upgrade уже выпущен.
8. Production в этой локальной подготовке не подключалась и не менялась. Исторический backend PID/health не выдавать за свежие.

## Следующий шаг — только после явного подтверждения владельца

Выполнить `docs/SEC-HEIF-UPGRADE-ROLLOUT.md` по порядку:

1. Публикация принята: wheel asset независимо скачан и проверен по URL, SHA-256, размеру и tags.
2. Следующий одобренный шаг: push approved local commits и определить точный target SHA после commit/push, не угадывать его заранее.
3. Затем строгий read-only VPS preflight; любое неожиданное состояние останавливает rollout.
4. Создать paired backup текущего stopgap source, старого wheel и venv/service/native metadata и остановиться до установки нового wheel.
5. Fast-forward exact SHA; установить только новый wheel через `--no-deps`.
6. Native/RPATH/`ldd`/round-trip проверки от пользователя `mps`.
7. Проверить ownership/mode/readability всех изменённых application files и native libs до restart.
8. Один restart, health и smoke.
9. Live HEIC/HEIF, disguise, malformed и JPEG uploads; проверить все responsive WebP/AVIF variants.
10. Удалить только созданные тестовые media/principal и доказать remaining=0; повторить health/smoke.

Только после полного live GREEN обновить SEC-HEIF-UPGRADE на `passing` и записать production evidence.

## VPS и deployment safety

- SSH: только `mps_deploy_key`, `BatchMode=yes`, `IdentitiesOnly=yes`, strict host-key checking и ранее подтверждённый fingerprint.
- Сохранить известные VPS untracked: `.deploy-backups/`, каталог с именем `\`, `frontend/app/.env.production`, `venv.py310.failed/`.
- Не запускать pytest против production DB.
- Не выполнять общий `pip install -r` при rollout: только accepted wheel с `--no-deps`; сравнить `pip freeze` до/после.
- Backup `umask 077` должен быть ограничен backup subshell. В прошлой сессии leakage оставил root-owned `media.py` mode 600 и вызвал outage. До restart обязательно `stat` и `runuser -u mps -- test -r` для всех изменённых application files. Не ослаблять `.env`, keys или backups.
- Rollback атомарный: остановить backend, восстановить stopgap source и старый wheel вместе, проверить readability/native state, запустить один раз, подтвердить HEIC 422 + JPEG 200/variants + health/smoke.

## Artifact and source evidence

- Local wheel: `D:/mps-platform-full/heif-wheel-build-20260901/dist/pillow_heif-1.5.0+libheif1.23.2-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`.
- Build verification: `D:/mps-platform-full/heif-wheel-build-20260901/VERIFICATION.md`.
- Source pins/checksums: `D:/mps-platform-full/heif-wheel-build-20260901/checksums.sha256` and Dockerfile in the same directory.
- Planned release URL and hash: `backend/requirements-heif.lock`.
- Production plan: `docs/SEC-HEIF-UPGRADE-ROLLOUT.md`.
- Stopgap production report: `D:/mps-platform-full/heif-stopgap-release-20260901/verification.md`.

## Known independent backlog

1. Rotate `AUTH_BOT_TOKEN` and verify dependent integrations/log handling; do not copy token values into trackers.
2. Replace VPS Python 3.11.0rc1 with a supported stable security-patched interpreter and a new reproducible venv.
3. Reconcile the recorded 33 dependency-version drifts after Python stabilization.
4. Address remaining Medium, then Low security-audit findings as separate scopes.
5. F47/F48c remain independent historical `in_progress` exceptions; do not mix them into this rollout.

## Known local exceptions

- `init.sh` inside sandbox can fail with Git Bash Win32 Error 5. Outside sandbox it reaches the shared global Windows `pip check` and fails on unrelated global package conflicts. Direct isolated MPS suites are recorded separately; these failures are not called GREEN.
- `verification-before-completion` and `tdd-fix-workflow` were read and applied. The text-rule `.codex/skills/*.md` gap remains known and unchanged.
