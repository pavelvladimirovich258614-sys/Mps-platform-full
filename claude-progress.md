# claude-progress.md — журнал прогресса МПС

## Current Verified State
- Repository root directory: mps-platform/
- Standard startup path: ./init.sh, затем `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Standard verification path: `python -m pytest backend/tests -q`
- Highest priority unfinished feature: F02 (авторизация: Telegram Login + email-код, JWT, роли)
- Current blocker: нет
- Frontend: M1 ЗАВЕРШЁН — финальный экспорт лежит в frontend/mir-pod-solncem.dc.html (см. frontend/README.md); до F09 работает на локальных данных — это ожидаемо, не баг.

## Session Record

### Session 0 — 2026-08-18 (Claude, подготовка)
- Goal: собрать обвязку проекта по методике Harness Engineering.
- Completed: AGENTS.md, init.sh, feature_list.json (F01–F10), документы docs/ (ТЗ, спека, роадмап, решения встречи, аудит фронта), промпты P00–P10.
- Verification run: json-валидация feature_list.json — OK; кода ещё нет.
- Evidence recorded: —
- Commits: первый коммит делает Павел после копирования в репо.
- Known risks: подписка Codex до конца месяца — M2 в приоритете; Telegram-релей зависит от доступа к боту «Под солнцем».
- Next best action: сессия P01 в Codex (фича F01) — фронтенд уже в репо, шаг 2 README выполнен.

<!-- Каждая следующая сессия добавляет запись НИЖЕ по этому же шаблону -->

### Session 1 — 2026-08-18 (Codex, F01)
- Goal: реализовать каркас async FastAPI-бекенда и проверяемый health endpoint.
- Completed: созданы app factory, Settings через pydantic-settings, async SQLAlchemy engine/session/Base, async Alembic и начальная пустая миграция, `GET /api/v1/health`, test app на aiosqlite, `.env.example`, `.gitignore` и requirements. `init.sh` скорректирован, чтобы штатно запускать pytest из `backend/`.
- Verification run: `python -m pip install -r backend/requirements.txt` — успешно; `DATABASE_URL=sqlite+aiosqlite:///:memory: python -m alembic upgrade head` — upgrade до `20260818_0001`; `python -m pytest backend/tests -q` — `1 passed in 0.27s`; локальный Uvicorn + GET `/api/v1/health` — `{"status":"ok","version":"0.1.0"}`; `./init.sh` — `[OK] Верификация прошла`, `1 passed in 0.26s`.
- Evidence recorded: feature_list.json → F01.evidence.
- Commits: будет создан локальный коммит `F01: каркас бекенда [passing]`.
- Known risks: миграция подтверждена на SQLite in-memory; подключение к реальному PostgreSQL остаётся задачей среды деплоя.
- Next best action: F02 — реализовать авторизацию Telegram/email с JWT и ролями.
