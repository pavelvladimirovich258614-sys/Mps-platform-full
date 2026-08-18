# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит через Git Bash вне sandbox (установка + 30 тестов зелёные)
- [x] `python -m pytest tests -q` зелёный целиком, не только тесты F08
- [x] `claude-progress.md`: добавлена Session Record F08, Current Verified State указывает F09
- [x] `feature_list.json`: F08 passing с evidence, единственной in_progress нет
- [x] `session-handoff.md` перезаписан для F09
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F08
- [x] Следующая сессия может начать F09 без ручного ремонта
