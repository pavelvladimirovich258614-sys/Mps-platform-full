# clean-state-checklist.md — контрольная точка audit I-01 2026-08-20

- [x] Полный `python -m pytest tests -q --basetemp .pytest-i01-full` вне sandbox — 39 passed in 14.73s
- [x] Финальный `./init.sh` через Git Bash вне sandbox — `No broken requirements found`, pytest завершился успешно
- [x] `feature_list.json` проверен: F01–F10 и F09a1/F09a2/F09b — 12 записей `passing`, записей `in_progress` нет
- [x] `claude-progress.md` содержит Session 17 с RED/green evidence I-01
- [x] `session-handoff.md` отражает закрытие I-01 и следующий выбранный пункт I-15
- [x] `docs/AUDIT_REPORT.md` фиксирует I-01 как закрытый; C-05 и остальные категории «Важно»/«Желательно» не изменялись
- [x] Временные pytest-каталоги удалены перед коммитом
- [x] В staging добавляются только файлы I-01: subscribe API/test и относящиеся документы
- [x] Финальная Git-проверка включает `git fetch origin main`, совпадение local `main` с `origin/main` и чистое рабочее дерево после push
