# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит через Git Bash вне sandbox (pip check + 31 тест зелёный)
- [x] `python -m pytest tests -q` зелёный целиком, включая M3 network guard
- [x] `claude-progress.md`: добавлена Session Record M3 review hardening, Current Verified State указывает F09
- [x] `feature_list.json`: F08 passing с evidence, единственной in_progress нет
- [x] `session-handoff.md` перезаписан для F09
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в M3 hardening
- [x] Следующая сессия может начать F09 без ручного ремонта
