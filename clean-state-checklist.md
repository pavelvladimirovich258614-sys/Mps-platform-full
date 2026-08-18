# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит через Git Bash (установка + 12 тестов зелёные)
- [x] `python -m pytest tests -q` зелёный целиком, не только тесты F03
- [x] `claude-progress.md`: добавлена Session Record F03, Current Verified State указывает F04
- [x] `feature_list.json`: F03 passing с evidence, единственной in_progress нет
- [x] `session-handoff.md` перезаписан для F04
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F03
- [x] Следующая сессия может начать F04 без ручного ремонта
