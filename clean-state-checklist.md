# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит (установка + верификация зелёные)
- [x] `python -m pytest backend/tests -q` зелёный целиком, не только тесты фичи
- [x] `claude-progress.md`: добавлена Session Record, обновлён Current Verified State
- [x] `feature_list.json`: статусы честные, ни одного passing без evidence, максимум одна in_progress
- [x] `session-handoff.md` перезаписан
- [x] `git status` чист после коммита; в коммит не попали .env, __pycache__, node_modules
- [x] Нет placeholder-кода и закомментированных «времянок»
- [x] Следующая сессия может продолжить без ручного ремонта (мысленно проверь: открой репо с нуля — понятно ли, что делать?)
