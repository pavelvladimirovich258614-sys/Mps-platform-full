# clean-state-checklist.md — контрольная точка audit I-18 2026-08-20

- [x] RED `python -m pytest tests/test_deploy_bootstrap.py -q --basetemp .pytest-i18-red` — 2 failed: отсутствовал pre-cert template; digest не содержал User/Group/EnvironmentFile
- [x] Targeted `python -m pytest tests/test_deploy_bootstrap.py -q --basetemp .pytest-i18-target-final` — 2 passed
- [x] Полный `python -m pytest tests -q --basetemp .pytest-i18-full-final` вне sandbox — 46 passed
- [x] Финальный `./init.sh` через Git Bash вне sandbox — `No broken requirements found`, 46 passed, `[OK] Верификация прошла`
- [x] `deploy/nginx.pre-cert.conf` содержит только HTTP/ACME; production `nginx.conf` и DEPLOY.md используют `YOUR_DOMAIN`, без `mir.pod-solncem.ru`
- [x] `mps-digest.service` запускается как `mps:mps` и читает `/etc/mps-platform/backend.env`
- [x] `docs/AUDIT_REPORT.md`, `claude-progress.md` и `session-handoff.md` фиксируют I-18; ручные VPS проверки явно отделены
- [x] В staging добавляются только файлы I-18 и относящиеся документы
- [x] Временные pytest-каталоги удалены перед коммитом
- [ ] Финальная Git-проверка: local `main` совпадает с `origin/main`, рабочее дерево чисто после push
