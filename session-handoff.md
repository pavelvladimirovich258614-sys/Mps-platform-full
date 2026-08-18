# session-handoff.md — передача между сессиями

## Currently verified
- F01 passing: `GET /api/v1/health` возвращает `{"status":"ok","version":"0.1.0"}`.
- Async Alembic применяет начальную миграцию `20260818_0001` на SQLite.
- `python -m pytest backend/tests -q` — `1 passed in 0.27s`.
- `./init.sh` — успешная установка и `1 passed in 0.26s`.

## Changes this session
- Создан `backend/`: FastAPI app factory, конфигурация pydantic-settings, async SQLAlchemy и Alembic, health router, тесты на aiosqlite.
- Добавлены `backend/.env.example`, root `.gitignore`, зависимости и pytest-конфигурация.
- `init.sh` запускает pytest из `backend/`, как предписывает AGENTS.md.

## Still broken or unverified
- Подключение к реальному PostgreSQL/Redis не проверялось: локальные сервисы и секреты намеренно не создавались.

## Next best action
- Выполнить F02: Telegram Login, email-код, JWT и роли. Не менять frontend до F09.

## Commands
- Старт: `./init.sh`
- Верификация: `python -m pytest backend/tests -q`
- Dev-сервер: `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Миграции: `cd backend && alembic upgrade head`
