# P01 — Сессия Codex: каркас бекенда (фича F01)

Вставить в Codex, открытый в корне репозитория mps-platform:

---
Прочитай AGENTS.md и выполни стартовый воркфлоу. Твоя фича этой сессии — **F01 «Каркас бекенда»** из feature_list.json. Перед кодом прочитай docs/BACKEND_SPEC.md §1 (структура), §5 (безопасность), §6 (.env.example) и docs/TZ.md §5 (стек).

Сделай:
1. `backend/` по структуре из спеки: FastAPI-приложение с фабрикой, config.py на pydantic-settings, db.py (async engine + session), пустой Base + alembic, настроенный на async.
2. Роутер `GET /api/v1/health` → `{"status":"ok","version":"0.1.0"}`.
3. `requirements.txt`: fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg, alembic, pydantic-settings, redis, httpx, pytest, pytest-asyncio, aiosqlite, nh3, python-multipart, PyJWT, slowapi.
4. `tests/conftest.py` с тестовым приложением на aiosqlite и первым тестом health.
5. `.env.example` по спеке §6, `.gitignore` (env, __pycache__, node_modules, media).
6. Проверь, что `./init.sh` теперь проходит полный путь (установка + pytest).

Заверши сессию строго по разделу «Завершение сессии» из AGENTS.md: evidence в feature_list.json, запись в claude-progress.md, session-handoff.md, чек-лист, коммит.
