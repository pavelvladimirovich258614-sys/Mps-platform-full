# claude-progress.md — журнал прогресса МПС

## Current Verified State
- Repository root directory: mps-platform/
- Standard startup path: ./init.sh, затем `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Standard verification path: `python -m pytest backend/tests -q`
- Highest priority unfinished feature: F09 (интеграция фронтенда с API)
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

### Session 2 — 2026-08-18 (Codex, F02)
- Goal: реализовать пользователей, Telegram/email авторизацию, JWT и роли.
- Completed: модель users и миграция с CHECK identity, проверка Telegram Login HMAC и auth_date, JWT access/refresh с httpOnly cookie, Redis email-коды, `/me`, профиль, роли, presence middleware и auth rate limit.
- Verification run: SQLite Alembic upgrade до `20260818_0002`; `python -m pytest backend/tests -q` — `5 passed in 0.37s`; `./init.sh` — `[OK]`, `5 passed in 0.55s`.
- Evidence recorded: feature_list.json → F02.evidence.
- Commits: будет создан локальный коммит `F02: авторизация и роли [passing]`.
- Known risks: fakeredis выбран для тестов, так как redis-server отсутствует; production использует Redis URL из .env. Mailer намеренно логирует отправку до F05.
- Next best action: F03 — публикации и лайки.

### Session 3 — 2026-08-18 (Codex, F03)
- Goal: завершить публикации, видеообзоры, лайки и загрузку изображений.
- Completed: добавлены countries/posts/post_likes и Alembic revision `20260818_0003`; CRUD публикаций для editor, публичная лента и просмотр, toggle-like, slug с транслитерацией/коллизией, обязательный `shot_at` для video_review, Pillow upload JPEG/PNG/WebP с лимитом 10 МБ. PATCH теперь принимает частичный payload и сохраняет инвариант видеообзора. `MEDIA_DIR` поступает из Settings и изолирован в тестах.
- Verification run: `python -m pytest tests/test_posts.py tests/test_media.py -q --basetemp .pytest-tmp` — 7 passed; `DATABASE_URL=sqlite+aiosqlite:///:memory: alembic upgrade head` — upgrade до `20260818_0003`; `python -m pytest tests -q --basetemp .pytest-tmp-full` — 12 passed; `./init.sh` через Git Bash — `[OK]`, 12 passed.
- Evidence recorded: feature_list.json → F03.evidence (коды reader/editor CRUD, video validation, likes/views, partial PATCH, slug и media).
- Commits: локальный `F03: публикации [passing]`.
- Known risks: в production media должны отдаваться nginx, а видео v1 остаются URL без транскодинга; это не проверялось локально.
- Next best action: F04 — отзывы, комментарии, премодерация и реакции.

### Session 4 — 2026-08-18 (Codex, F04)
- Goal: реализовать отзывы, комментарии, модерацию, реакции и выдачу bot review-token.
- Completed: добавлены reviews/comments/comment_reactions/review_tokens/notifications и миграция `20260818_0004`; public approved-only списки, создание pending, editor moderation с pending_count, notifications автору при approve, реакции с заменой emoji, ответы только одного уровня. `/internal/review-tokens` защищён `BOT_BRIDGE_SECRET`; token одноразовый и действует 7 дней.
- Verification run: `python -m pytest tests/test_reviews.py tests/test_comments.py -q --basetemp .pytest-f04-target` — 4 passed; `DATABASE_URL=sqlite+aiosqlite:///:memory: alembic upgrade head` — upgrade до `20260818_0004`; `python -m pytest tests -q --basetemp .pytest-f04-full` — 16 passed; `./init.sh` через Git Bash — `[OK]`, 16 passed.
- Evidence recorded: feature_list.json → F04.evidence (pending visibility, roles, approve/reject, nested reply, reactions, token 201/404/410 и notifications).
- Commits: локальный `F04: модерация [passing]`.
- Known risks: review token пока возвращается внутреннему bot bridge без deep-link сборки; её доставка клиенту — интеграционный поток F05. Уведомления сохраняются, API чтения будет F08.
- Next best action: F05 — email double opt-in, дайджест и Telegram-релей вопросов.

### Session 5 — 2026-08-18 (Codex, F05)
- Goal: подписки, дайджест и вопросы Telegram.
- Completed: subscriptions/questions, Alembic 0005, Unisender Go client, digest job/timer, Q&A relay, bot bridge router.
- Verification run: target 4 passed; Alembic 0005; full pytest 20 passed; init.sh 20 passed.
- Evidence recorded: feature_list.json F05.
- Commits: F05: подписки и вопросы [passing].
- Known risks: systemd units не установлены на VPS; aiogram router должен быть подключён Павлом в существующем боте.
- Next best action: F06.

### Session 6 — 2026-08-18 (Codex, F06)
- Goal: форум по странам, темы, сообщения и лимиты.
- Completed: forum_topics/forum_messages, migration 0006, countries/topics/messages API, reader/premium limit 3, editor/admin unlimited, notification автору темы.
- Verification run: fresh Alembic -> 0006; F06 test 1 passed; full pytest 21 passed; init.sh 21 passed.
- Evidence recorded: feature_list.json F06.
- Commits: F06: форум [passing].
- Known risks: prefix search is MVP only; replace with PostgreSQL full-text at scale.
- Next best action: F07.

### Session 7 — 2026-08-18 (Codex, F07)
- Goal: добавить один автоматический ИИ-ответ Иришки в старые темы форума без ответа.
- Completed: Alembic `20260818_0007` создаёт settings и служебного editor-пользователя «Иришка · ИИ-помощник». `services/irishka.py` читает `irishka_enabled` и `irishka_delay_min` из БД, вызывает OpenAI-совместимый MiniMax `/chat/completions`, создаёт `is_ai` сообщение только в теме без сообщений; ценовые/визовые темы переадресует менеджеру и создаёт Question. AsyncIOScheduler запускает задачу каждые 5 минут в FastAPI lifespan.
- Verification run: fresh SQLite Alembic upgrade до `20260818_0007`; `python -m pytest tests/test_irishka.py -q --basetemp .pytest-f07-check` — 5 passed in 0.92s; `python -m pytest tests -q --basetemp .pytest-f07-full-check` — 26 passed in 5.26s; `./init.sh` вне sandbox — `[OK]`, 26 passed in 5.35s.
- Evidence recorded: feature_list.json → F07.evidence.
- Commits: будет создан `F07: Иришка [passing]`.
- Known risks: production requires a non-empty `MINIMAX_API_KEY`; otherwise httpx rejects the empty Bearer header. Scheduler runs in API process, so deployment must keep one scheduler instance.
- Next best action: F08 — admin settings endpoint can expose `irishka_enabled` without redeploy.

### Session 8 — 2026-08-18 (Codex, F08)
- Goal: реализовать админскую статистику, модерацию, бан пользователей, настройки, online-панель и API уведомлений.
- Completed: добавлены admin-only `GET /admin/stats`, единая очередь pending отзывов/комментариев, пагинированный `GET /admin/users`, бан через `PATCH /admin/users/{id}` и `PATCH /admin/settings` для CTA и `irishka_*`. Добавлены `/online` (120 секунд, без анонимов, max 12), пагинация уведомлений и пометка всех/выбранных собственных уведомлений прочитанными. Premium не получил отдельной логики.
- Verification run: `python -m pytest tests/test_admin.py tests/test_presence.py -q --basetemp .pytest-f08-target` — 4 passed; `python -m pytest tests -q --basetemp .pytest-f08-full` — 30 passed; `./init.sh` — 30 passed, `[OK]`.
- Evidence recorded: feature_list.json → F08.evidence (403 reader, полный набор метрик, top-5 по views, online, notifications ownership).
- Commits: будет создан `F08: админка и статистика [passing]`.
- Known risks: top_posts учитывает все публикации по текущей спецификации, включая draft; если продукту нужна только опубликованная выборка, это отдельное уточнение.
- Next best action: F09 — подключить утверждённый frontend к готовому API, не меняя Claude Design-разметку.

### Session 9 — 2026-08-18 (Codex, M3 review hardening)
- Goal: устранить замечание M3 Maintainability и добавить pre-flight dependency/network guardrails перед M4.
- Completed: F06 forum endpoints и F07 `irishka.run()` отформатированы и снабжены контрактными docstrings без изменения поведения. `init.sh` теперь запускает `python -m pip check` перед pytest. Глобальный strict `respx` fixture блокирует незамоканный HTTPX до сетевого соединения; отдельный тест фиксирует этот контракт, а F07 MiniMax mocks остаются рабочими.
- Verification run: `python -m pytest tests/test_network_guard.py tests/test_forum.py tests/test_irishka.py -q --basetemp .pytest-m3-guard-target` — 7 passed; `python -m pytest tests -q --basetemp .pytest-m3-review-full` — 31 passed; `./init.sh` — `No broken requirements found`, 31 passed.
- Evidence recorded: evaluator-rubric.md → M3 Maintainability re-evaluation.
- Commits: будет создан `fix: M3 review — maintainability + dependency/network guardrails`.
- Known risks: strict respx fixture защищает HTTPX-клиенты; при добавлении другого HTTP-клиента ему потребуется собственный no-network guard.
- Next best action: F09 — подключить утверждённый frontend к готовому API, не меняя Claude Design-разметку.
