# clean-state-checklist.md — контрольная точка audit I-20 legal-compliance 2026-08-20

- [x] RED backend `python -m pytest tests/test_admin.py -q --basetemp .pytest-i20-red` — 1 failed: public settings endpoint отсутствовал (404)
- [x] RED frontend `npm run test:quiet -- src/components/PublicContacts.test.tsx` — фиктивный `ИП Иванова И.И.` присутствовал в DOM
- [x] Targeted backend — 3 passed; targeted frontend — 2 passed
- [x] Frontend `npm run test:quiet` — 6 files, 23 passed; `npm run build` — 48 modules, успешно
- [x] Полный `python -m pytest tests -q --basetemp .pytest-i20-full` вне sandbox — 47 passed
- [x] Финальный `./init.sh` через Git Bash вне sandbox — `No broken requirements found`, 47 passed, `[OK] Верификация прошла`
- [x] Public API выдаёт только legal/contact whitelist и не раскрывает `cta_bot_url`; пустая конфигурация скрывает реквизиты в Footer/About
- [x] Реальные реквизиты и секреты не добавлены в исходники, тесты или документацию
- [x] Миграция `20260820_0008` воспроизводимо заполняет публичные реквизиты на чистой БД; I-21 фиксирует незакрытые consent/cookie риски
- [x] Дополнительные проверки I-20: frontend — 23 passed, build успешен; backend — 47 passed; `./init.sh` — 47 passed
- [x] `docs/AUDIT_REPORT.md`, `DEPLOY.md`, `claude-progress.md` и `session-handoff.md` обновлены для I-20
- [x] Временные pytest-каталоги удалены перед коммитом
- [ ] Финальная Git-проверка: local `main` совпадает с `origin/main`, рабочее дерево чисто после push
