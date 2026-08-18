# clean-state-checklist.md — пройти перед закрытием каждой сессии

- [x] `./init.sh` проходит через Git Bash вне sandbox (pip check + 31 тест зелёный)
- [x] `python -m pytest backend/tests -q --basetemp .pytest-f09a2-full` — 31 passed
- [x] `cd frontend/app && npm run build` — TypeScript + Vite production build без ошибок (44 modules)
- [x] Визуально проверены F09a2-разделы и F09a1 regression против dc-референса: dark/light и 375px; исходный dc.html сохранён
- [x] `rg -n localStorage frontend/app/src` содержит только `mps-theme2` и `mps-cookie-consent`
- [x] `claude-progress.md`: добавлена Session Record F09a2, Current Verified State указывает F09b
- [x] `feature_list.json`: F09a2 passing с evidence, F09b not_started
- [x] `session-handoff.md` перезаписан для F09b
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F09a2
- [x] Следующая сессия может начать F09b без ручного ремонта
