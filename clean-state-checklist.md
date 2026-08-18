# clean-state-checklist.md — F09b in progress

- [x] `./init.sh` проходит через Git Bash вне sandbox (pip check + 32 теста зелёные)
- [x] `python -m pytest backend/tests -q --basetemp .pytest-f09b-final` — 32 passed
- [x] `cd frontend/app && npm run build` — TypeScript + Vite production build без ошибок (46 modules)
- [x] Визуально проверены F09a2-разделы и F09a1 regression против dc-референса: dark/light и 375px; исходный dc.html сохранён
- [x] `rg -n 'sessionStorage|localStorage' frontend/app/src` содержит только `mps-theme2` и `mps-cookie-consent`
- [x] `claude-progress.md`: добавлена Session Record F09b и реальный blocker
- [x] `feature_list.json`: F09b in_progress с evidence и blocker
- [x] `session-handoff.md` перезаписан для продолжения F09b
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F09a2
- [ ] Browser E2E TZ §7.1–6 на backend :8000 + frontend :5173: требуется доступный PostgreSQL и Redis, затем email-code/refresh/toast проверка
