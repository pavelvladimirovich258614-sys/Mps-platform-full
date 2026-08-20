# clean-state-checklist.md — контрольная точка audit I-01/I-15/I-16 2026-08-20

- [x] Полный `python -m pytest tests -q --basetemp .pytest-i16-full` вне sandbox — 43 passed in 11.00s
- [x] Финальный `./init.sh` через Git Bash вне sandbox — `No broken requirements found`, 43 passed, `[OK] Верификация прошла`
- [x] `feature_list.json` проверен: F01–F10 и F09a1/F09a2/F09b — 12 записей `passing`, записей `in_progress` нет
- [x] `claude-progress.md` содержит Session 17/18/19 с RED/green evidence I-01/I-15/I-16
- [x] `session-handoff.md` отражает закрытие I-01/I-15/I-16 и границу следующей оценки audit
- [x] `docs/AUDIT_REPORT.md` фиксирует I-01/I-15/I-16 как закрытые; C-05 и остальные категории «Важно»/«Желательно» не изменялись
- [x] Временные pytest-каталоги удалены перед коммитом
- [x] В staging добавляются только файлы I-16: moderation/QA API/tests и относящиеся документы
- [x] Финальная Git-проверка включает `git fetch origin main`, совпадение local `main` с `origin/main` и чистое рабочее дерево после push
