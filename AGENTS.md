# AGENTS.md — операционные правила проекта МПС («Мир под солнцем»)

Ты — кодовый агент проекта mps-platform. Этот файл — твой закон. Прочитай его полностью в начале КАЖДОЙ сессии.

## Стартовый воркфлоу (обязателен, по порядку)
1. Запусти `./init.sh`. Если верификация падает — сначала чини базу, никаких новых фич.
2. Прочитай `claude-progress.md` → секцию Current Verified State и последнюю Session Record.
3. Прочитай `feature_list.json` → найди фичу с наименьшим priority и статусом not_started (или продолжи единственную in_progress).
4. Прочитай релевантные разделы `docs/TZ.md` и `docs/BACKEND_SPEC.md` для этой фичи.
5. Переведи фичу в `in_progress` (только одну!) и работай ТОЛЬКО над ней.

## Рабочие правила
- **Одна фича за сессию.** Не трогай код вне области фичи. Заметил чужой баг — запиши в notes фичи или в Known risks, не чини мимоходом.
- **Никаких placeholder'ов.** Запрещены: `pass  # TODO`, моки вместо реальной логики, «сделаю потом». Если фичу нельзя доделать — статус `blocked` + причина в notes.
- **Схема БД — только через Alembic-миграции.** Никогда не правь таблицы вручную.
- **Секреты — только в .env.** В коммит идёт только `.env.example`.
- **Стек фиксирован** (docs/BACKEND_SPEC.md §5). Не добавляй новые фреймворки/библиотеки без явного разрешения в промпте сессии.
- **Фронтенд в `frontend/` создан в Claude Design.** Не переписывай его дизайн и разметку. Разрешено (только в фиче F09): добавить API-слой, hooks, обработку состояний.
- Русский язык во всех пользовательских текстах, ошибках API — тоже по-русски.
- Пиши тесты вместе с кодом фичи (минимум: happy-path + 1 негативный), а не после.

## Definition of Done (самое важное)
Фича считается `passing` ТОЛЬКО когда:
1. Все шаги из поля `verification` фичи выполнены тобой реально (команды запущены, вывод получен).
2. Доказательство записано в поле `evidence`: команда + ключевые строки вывода (код ответа, id созданной записи, результат pytest `N passed`).
3. `pytest` по всему проекту зелёный, `./init.sh` проходит.
4. Нет незакоммиченных случайных файлов (`git status` чист после коммита).
Перед тем как писать `passing`, пройди [verification checklist](.codex/verification-checklist.md).
Если хотя бы один пункт не выполнен — статус остаётся `in_progress` или `blocked`. Ложный `passing` — худшее нарушение.

## Завершение сессии (обязательно, по порядку)
1. Обнови `feature_list.json` (статус + evidence).
2. Допиши Session Record в `claude-progress.md`: Goal / Completed / Verification run / Evidence recorded / Commits / Known risks / Next best action.
3. Обнови Current Verified State (highest priority unfinished feature, blocker).
4. Заполни `session-handoff.md` (перезаписывай, это заметка для следующей сессии).
5. Пройди `clean-state-checklist.md`.
6. Коммит: `git add -A && git commit -m "F<ID>: <краткое описание> [passing|in_progress|blocked]"`.

## Команды проекта
- Установка: `cd backend && pip install -r requirements.txt`
- Верификация: `cd backend && python -m pytest -q`
- Запуск dev: `cd backend && uvicorn app.main:app --reload --port 8000`
- Миграции: `cd backend && alembic upgrade head` · новая: `alembic revision --autogenerate -m "..."`
- Фронт dev: `cd frontend && npm install && npm run dev`
