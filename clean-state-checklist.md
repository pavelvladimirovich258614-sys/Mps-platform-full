# clean-state-checklist.md — контрольная точка audit I-01/I-06a/I-15/I-16 2026-08-20

- [x] Полный `python -m pytest tests -q --basetemp .pytest-i06a-full` вне sandbox — 44 passed in 11.89s
- [x] Финальный `./init.sh` через Git Bash вне sandbox — `No broken requirements found`, 44 passed, `[OK] Верификация прошла`
- [x] `feature_list.json` проверен: F01–F10 и F09a1/F09a2/F09b — 12 записей `passing`, записей `in_progress` нет
- [x] `claude-progress.md` содержит Session 17/18/19/20 с RED/green evidence I-01/I-06a/I-15/I-16
- [x] `session-handoff.md` отражает закрытие I-01/I-06a/I-15/I-16 и открытую границу I-06b
- [x] `docs/AUDIT_REPORT.md` фиксирует I-01/I-06a/I-15/I-16 как закрытые, а I-06b — как открытый follow-up; C-05 и остальные категории «Важно»/«Желательно» не изменялись
- [x] Временные pytest-каталоги удалены перед коммитом
- [x] В staging добавляются только файлы I-06a: SEO API/test и относящиеся документы
- [x] Финальная Git-проверка включает `git fetch origin main`, совпадение local `main` с `origin/main` и чистое рабочее дерево после push
