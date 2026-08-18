# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит через Git Bash (установка + 16 тестов зелёные)
- [x] `python -m pytest tests -q` зелёный целиком, не только тесты F04
- [x] `claude-progress.md`: добавлена Session Record F04, Current Verified State указывает F05
- [x] `feature_list.json`: F04 passing с evidence, единственной in_progress нет
- [x] `session-handoff.md` перезаписан для F05
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F04
- [x] Следующая сессия может начать F05 без ручного ремонта
