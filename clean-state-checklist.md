# clean-state-checklist.md — F09b passing

- [x] `./init.sh` проходит через Git Bash вне sandbox (pip check + 33 теста зелёные)
- [x] `python -m pytest backend/tests -q --basetemp .pytest-f09b-full-final` — 33 passed
- [x] `cd frontend/app && npm run build` — TypeScript + Vite production build без ошибок (46 modules)
- [x] Визуально проверены F09a2-разделы и F09a1 regression против dc-референса: dark/light и 375px; исходный dc.html сохранён
- [x] `rg -n 'sessionStorage|localStorage' frontend/app/src` содержит только `mps-theme2` и `mps-cookie-consent`
- [x] API acceptance TZ §7.1–6: SQLite+fakeredis ASGI, 1 passed; Unisender/Telegram explicitly mocked
- [x] `npm run dev -- --host 127.0.0.1` — Vite ready at :5173
- [x] `claude-progress.md`: F09b passing, next F10
- [x] `feature_list.json`: F09b passing с evidence
- [x] `session-handoff.md` содержит ручной Postgres/Redis browser smoke для Павла
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F09a2
- [x] Ручной browser smoke с живым Postgres/Redis вынесен в F10/deploy-инструкцию; он не блокирует эквивалентную ASGI verification
