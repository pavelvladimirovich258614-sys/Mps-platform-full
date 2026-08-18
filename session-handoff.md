# session-handoff.md — передача между сессиями

## Currently verified
- F01 и F02 passing; Alembic применяет `20260818_0002` с таблицей users и identity CHECK.
- `python -m pytest backend/tests -q` — `5 passed in 0.37s`; `./init.sh` — `5 passed in 0.55s`.

## Changes this session
- Добавлены users, auth JWT/Telegram/email, profile/roles, Redis-коды, rate limit и last_seen middleware.
- В тестах Redis заменён fakeredis: проверяются фактические TTL и чтение/удаление кодов.

## Still broken or unverified
- Реальные PostgreSQL/Redis/Unisender не проверялись; production Redis конфигурируется через .env, Unisender — F05.

## Next best action
- Выполнить F03: публикации, видеообзоры и лайки. Не менять frontend до F09.

## Commands
- Старт: `./init.sh`
- Верификация: `python -m pytest backend/tests -q`
- Dev-сервер: `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Миграции: `cd backend && alembic upgrade head`
