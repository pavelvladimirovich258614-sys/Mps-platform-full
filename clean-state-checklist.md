# clean-state-checklist.md — F10 passing

- [x] `./init.sh` проходит через Git Bash вне sandbox (pip check + 37 тестов зелёные)
- [x] `python -m pytest backend/tests -q --basetemp .pytest-f10-full` — 37 passed
- [x] `cd frontend/app && npm run build` — TypeScript + Vite production build без ошибок (46 modules)
- [x] Визуально проверены F09a2-разделы и F09a1 regression против dc-референса: dark/light и 375px; исходный dc.html сохранён
- [x] `rg -n 'sessionStorage|localStorage' frontend/app/src` содержит только `mps-theme2` и `mps-cookie-consent`
- [x] F10 target tests: sitemap/robots/OG/JSON-LD/create_admin — 4 passed
- [x] `deploy/smoke.sh` — [OK] против localhost staging-double; backup/smoke shell syntax зелёный
- [x] `claude-progress.md`: F10 passing, все F01–F10 завершены
- [x] `feature_list.json`: F10 passing с разделением local/VPS evidence
- [x] `session-handoff.md` и `DEPLOY.md` содержат production/manual шаги Павла, HSTS warning и GSC/Яндекс checklist
- [x] `git status` проверен перед коммитом; в коммит не попадают .env, __pycache__, node_modules или временные каталоги Pytest
- [x] Нет placeholder-кода и закомментированных «времянок» в F09a2
- [x] Реальные VPS DNS/certbot/HSTS/systemd/pg_dump curl проверки вынесены в DEPLOY.md; не могут быть симулированы локально
