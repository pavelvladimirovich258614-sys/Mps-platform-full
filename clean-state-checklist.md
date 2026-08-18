# clean-state-checklist.md — audit remediation C-04/C-06

- [x] Стартовый и финальный `./init.sh` выполнены через Git Bash вне sandbox: `pip check` согласован, 38 тестов зелёные
- [x] `python -m pytest tests/test_subscribe.py -q --basetemp .pytest-c04-green` — 2 passed; URL извлечён из реального HTML письма и подтверждает подписку
- [x] Полный `python -m pytest --basetemp .pytest-c04-c06-full` — 38 passed
- [x] `bash -n deploy/backup.sh` — синтаксис корректен
- [x] Негативный backup smoke без `PG_DUMP_URL` — exit 1 с понятным `mps-backup: ERROR` для systemd journal
- [x] Функциональный backup smoke — непустой `.dump.gz`, атомарная публикация и удаление файла старше 14 дней
- [x] `mps-backup.service` запускает script через `/usr/bin/bash` и направляет stdout/stderr в journal
- [x] `DEPLOY.md` разделяет локальный smoke и обязательный реальный VPS `pg_dump`/`pg_restore --list`
- [x] `feature_list.json`, `claude-progress.md` и `session-handoff.md` содержат актуальные evidence и риски
- [x] C-05 и пункты «Важно»/«Желательно» не изменялись
- [x] Перед коммитом проверяются JSON, shell syntax, staged diff и отсутствие временных pytest/smoke каталогов
