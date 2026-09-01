# Session handoff — МПС

## Current checkpoint — 2026-09-01, SEC-HEIF-UPGRADE закрыт production GREEN

`feature_list.json`: **SEC-HEIF-UPGRADE = `passing`**. Все 10 шагов `docs/SEC-HEIF-UPGRADE-ROLLOUT.md` выполнены и подтверждены live-evidence на VPS `82.39.213.82` 2026-09-01 12:17–12:26 EDT.

### Что сделано (полная сводка)

1–5 (сделано в предыдущей сессии, подтверждено заново в этой): публикация wheel-asset, paired backup `/root/backups/sec-heif-upgrade-paired-20260901T070826Z/` (90/90 файлов `sha256sum -c` OK, `PAIR_COMPLETE`), stage нового wheel, fast-forward VPS до `fe3cd430a7af41ef652b4ab4c834e6868ac0fdea`, install `pillow-heif==1.5.0+libheif1.23.2`.

6. **Native verification от `mps`**: `libheif_info()` → `libheif=1.23.2, decoders.libde265=1.1.1, encoders.x265=4.2+1-e444744`. `readelf -d` на `_pillow_heif*.so` → `RPATH=$ORIGIN/pillow_heif.libs`. `ldd` резолвил исключительно bundled `libheif-c26addd2.so.1.23.2`, `libx265-ee74c10a.so.216`, `libde265-173ec07a.so.0.2.1`, без 1.23.1. Изолированный RGBA HEIC round-trip: encode 1112 bytes → decode `mode=RGBA size=(64,64) format=HEIF`.
7. **Permissions/readability gate**: `deploy/smoke.sh` и `deploy/backup.sh` были 644 без exec-бита (C-06); `chmod +x` подтверждён `stat` до/после (644→755). `media.py`/`requirements.txt`/`requirements-heif.lock` остаются 644, `runuser -u mps -- test -r` — OK для всех.
8. **Один restart**: до — `PID=1115264/NRestarts=51`; `systemctl restart mps-backend` exit 0; после — `PID=1192550/NRestarts=0/ExecMainStartTimestamp=Tue 2026-09-01 12:17:16 EDT`, active/running без crash-loop (повторная проверка через 8с — тот же PID). `journalctl` — чистый штатный shutdown/startup без traceback. `deploy/smoke.sh` → `[OK] smoke passed`, exit 0.
9. **Live production media verification** через временного ORM-созданного reader (`id=11`, synthetic email `sec-heif-verify-*@example.invalid`, in-memory JWT):
   - Real 128×128 RGBA HEIC → `200`, 6 вариантов
   - Real JPEG → `200`, 6 вариантов (регрессия не сломана)
   - Disguise (HEIC-байты, `MIME=image/jpeg`, `filename=.jpg`) → `200`, 6 вариантов — content-sniffing через allowlist корректно распознал HEIF независимо от заявленного MIME (safe decoder path)
   - Malformed (204-байтный truncated HEIC с валидным ftyp brand `heic`) → `422` с ожидаемым сообщением, НЕ 500
   - Все 6 вариантов реального HEIC проверены публичным GET: `200`, точный `Content-Type`, PIL-decode подтвердил `format/mode=RGBA/size=(128,128)`
10. **Cleanup**: удалены ровно 18 media-файлов (3 успешных загрузки × 6), `remaining=0`; тестовый пользователь `id=11` удалён, `REMAINING_MATCHING_USERS=0`; все временные скрипты/токен/файлы в `/tmp` на VPS удалены. Повторный health (loopback+public)=ok, `deploy/smoke.sh` → `[OK]` exit 0. PID стабилен `1192550/NRestarts=0`. Git SHA неизменён `fe3cd43`. Native-версии после тестов те же (1.23.2/1.1.1/4.2). Известные 4 untracked-артефакта сохранены.

### Известное исключение — требует решения владельца

После `chmod +x` шага 7 `git status --short deploy/` на VPS показывает:
```
M deploy/backup.sh
M deploy/smoke.sh
```
`git diff --stat` — чистое mode-изменение `644→755`, `0 insertions(+), 0 deletions(-)`. В репозитории (и локально, и на VPS до fast-forward) эти файлы трекаются как `100644` (`git ls-files -s` подтверждает; локальный `core.fileMode=false` на Windows скрывает это от `git status` в рабочем дереве, но индекс — правда).

**Последствие:** при следующем `git fetch`/`checkout --force`/fast-forward режим на VPS вернётся к 644, и exec-бит для `deploy/smoke.sh`/`deploy/backup.sh` снова пропадёт. Фикс НЕ закоммичен в этой сессии — только применён на сервере.

**Варианты для владельца:**
1. Закоммитить `git update-index --chmod=+x deploy/backup.sh deploy/smoke.sh` в репозитории отдельным коммитом (`fix: restore deploy/backup.sh and deploy/smoke.sh executable bit (C-06)`), тогда VPS и репозиторий будут согласованы навсегда.
2. Оставить как VPS-локальное исключение (аналогично известным untracked-артефактам) и не трогать репозиторий — тогда при следующем деплое кто-то должен не забыть повторить `chmod +x` вручную.

Ничего не решено автономно — ждёт explicit подтверждения.

## Working tree и push

Локально созданы: отдельный коммит трекеров (`feature_list.json` + `claude-progress.md` + `session-handoff.md`) поверх коммитов `CLAUDE.md` и предыдущей doc-sync правки. **Push НЕ выполнен** в этой сессии — ждёт отдельного «да» владельца, как договорено в начале сессии.

## VPS и deployment safety

- SSH: только `~/.ssh/mps_deploy_key`, используется явно (`-i`), НЕ через `~/.ssh/config` (там неверный `IdentityFile id_ed25519_deploy`, даёт Permission denied). `BatchMode=yes`, `IdentitiesOnly=yes`, strict host-key checking, fingerprint `SHA256:WiGVmbZnCZFtgaCfahdD1IyoUccJ0Si2xFb4TcHxSEE`.
- Посторонний `82.26.151.81` — не наш сервер, не задействован ни разу.
- Сохранить известные VPS untracked: `.deploy-backups/`, каталог с именем `\`, `frontend/app/.env.production`, `venv.py310.failed/`. Все 4 подтверждены неизменными после rollout.
- Rollback остаётся доступным и парным: `/root/backups/sec-heif-upgrade-paired-20260901T070826Z/` содержит и старый wheel (libheif 1.23.1), и stopgap source. Если потребуется откат — восстанавливать оба компонента вместе, никогда по отдельности; см. `docs/SEC-HEIF-UPGRADE-ROLLOUT.md` раздел «Mandatory paired rollback».
- Текущее production-состояние (guarded code + новый wheel + процесс перезапущен с новым кодом) — целевое состояние плана, не промежуточное/forbidden.
- VPS Python остаётся `3.11.0rc1`; замена на stable security-patched interpreter — отдельный backlog, не в этой сессии.

## Artifact and source evidence

- Local wheel: `D:/mps-platform-full/heif-wheel-build-20260901/dist/pillow_heif-1.5.0+libheif1.23.2-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`.
- Build verification: `D:/mps-platform-full/heif-wheel-build-20260901/VERIFICATION.md`.
- Production plan: `docs/SEC-HEIF-UPGRADE-ROLLOUT.md` (все 10 шагов выполнены).
- VPS paired upgrade backup (сохранён для будущего rollback): `/root/backups/sec-heif-upgrade-paired-20260901T070826Z/` (CURRENT_SHA=3ab6cdb, TARGET_SHA=fe3cd43, `PAIR_COMPLETE`).
- VPS stopgap backup (историческое, до upgrade): `/root/backups/mps-heif-stopgap-20260831T161551Z/` (source-sha=07566c8, target-sha=12203dd).

## Known independent backlog

1. Rotate `AUTH_BOT_TOKEN` and verify dependent integrations/log handling; do not copy token values into trackers.
2. Replace VPS Python 3.11.0rc1 with a supported stable security-patched interpreter and a new reproducible venv.
3. Reconcile the recorded 33 dependency-version drifts after Python stabilization.
4. Address remaining Medium, then Low security-audit findings as separate scopes.
5. F47/F48c remain independent historical `in_progress` exceptions; SEC-HEIF-UPGRADE closure does not touch them.

## Known local exceptions

- `init.sh` inside sandbox can fail with Git Bash Win32 Error 5. Outside sandbox it reaches the shared global Windows `pip check` and fails on unrelated global package conflicts. Direct isolated MPS suites are recorded separately; these failures are not called GREEN.
- `verification-before-completion` и `tdd-fix-workflow` прочитаны и применены текстуально в этой сессии (полный live-evidence перед `passing`, ни одно утверждение не сделано по памяти/предположению — все команды из шагов 6–10 запущены заново и вывод прочитан целиком).
