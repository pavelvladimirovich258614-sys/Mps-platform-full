# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит через Git Bash вне sandbox (pip check + 31 тест зелёный)
- [x] `python -m pytest backend/tests -q --basetemp .pytest-f09a1-full` — 31 passed; F04 contract test — 2 passed
- [x] `cd frontend/app && npm run build` — TypeScript + Vite production build без ошибок
- [x] Визуально проверены Layout, Feed, Forum и article/comments против dc-референса: dark/light и 375px; исходный dc.html сохранён
- [x] `rg -n localStorage frontend/app/src` содержит только `mps-theme2`
- [x] `claude-progress.md`: добавлена Session Record F09a1, Current Verified State указывает F09a2
- [x] `feature_list.json`: F09a1 passing с evidence, F09a2/F09b not_started
- [x] `session-handoff.md` перезаписан для F09a2/F09b
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F09a1
- [x] Следующая сессия может начать F09a2 без ручного ремонта
