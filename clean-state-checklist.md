# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит через Git Bash вне sandbox (установка + 26 тестов зелёные)
- [x] `python -m pytest tests -q` зелёный целиком, не только тесты F07
- [x] `claude-progress.md`: добавлена Session Record F07, Current Verified State указывает F08
- [x] `feature_list.json`: F07 passing с evidence, единственной in_progress нет
- [x] `session-handoff.md` перезаписан для F08
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F04
- [x] Следующая сессия может начать F08 без ручного ремонта
