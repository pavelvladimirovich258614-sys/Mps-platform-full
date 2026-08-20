# clean-state-checklist.md — контрольная точка audit I-01/I-15 2026-08-20

- [x] Полный `python -m pytest tests -q --basetemp .pytest-i15-full` вне sandbox — 40 passed in 10.56s
- [x] Финальный `./init.sh` через Git Bash вне sandbox — `No broken requirements found`, 40 passed, `[OK] Верификация прошла`
- [x] `feature_list.json` проверен: F01–F10 и F09a1/F09a2/F09b — 12 записей `passing`, записей `in_progress` нет
- [x] `claude-progress.md` содержит Session 17/18 с RED/green evidence I-01/I-15
- [x] `session-handoff.md` отражает закрытие I-01/I-15 и следующий выбранный пункт I-16
- [x] `docs/AUDIT_REPORT.md` фиксирует I-01/I-15 как закрытые; C-05 и остальные категории «Важно»/«Желательно» не изменялись
- [x] Временные pytest-каталоги удалены перед коммитом
- [x] В staging добавляются только файлы I-15: forum API/test и относящиеся документы
- [x] Финальная Git-проверка включает `git fetch origin main`, совпадение local `main` с `origin/main` и чистое рабочее дерево после push
