# claude-progress.md — журнал прогресса МПС

## Current Verified State
- Repository root directory: mps-platform/
- Standard startup path: ./init.sh, затем `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Standard verification path: `python -m pytest backend/tests -q`
- Highest priority unfinished feature: нет — F01–F10 passing
- Current blocker: C-04/C-06 устранены; C-05 остаётся отдельной согласованной security-задачей и в этой сессии не изменялся
- Frontend: F09a1/F09a2 ЗАВЕРШЕНЫ — Vite+React перенос дизайна в frontend/app; исходный экспорт frontend/mir-pod-solncem.dc.html сохранён. F09b подключает auth/API.

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

### Session 10 — 2026-08-18 (Codex, F09a1)
- Goal: перенести в Vite+React каркас Claude Design, основной журнал, форум и article/comments до API/auth-этапа.
- Completed: создан frontend/app (Vite + React + TypeScript) с компонентами Layout, Feed, Forum и ArticleComments. Сохранены dark/light themes, анимации, desktop sidebar/presence, mobile sheet/nav, feed cards для article/tip/video, страны/тема и Иришка. Комментарии используют F04 API-contract `author`, aggregate `reactions`, `my_reaction` и POST toggle.
- Verification run: `cd frontend/app && npm install && npm run build` — Vite production build (36 modules) зелёный вне sandbox; визуальная сверка с dc-референсом Layout/Feed/Forum/article-comments в обеих темах и на 375px; `python -m pytest backend/tests/test_comments.py -q --basetemp .pytest-f09a1-comments` — 2 passed; полный `python -m pytest backend/tests -q --basetemp .pytest-f09a1-full` — 31 passed; `./init.sh` вне sandbox — pip check и 31 passed.
- Evidence recorded: feature_list.json → F09a1.evidence.
- Commits: будет создан `F09a1: каркас и журнал [passing]`; в push также войдёт уже готовый `75090d8 fix: F04 comment reactions contract for frontend`.
- Known risks: email/Telegram login, общий API client/hooks, реальные данные Reviews/Subscribe/QA/Profile/Notifications/About и сквозной сценарий перенесены в F09a2/F09b по утверждённой разбивке. В F09a1 login button — элемент дизайна, не auth-flow.
- Next best action: представить план F09a2 и ждать подтверждения пользователя.

### Session 11 — 2026-08-18 (Codex, F09a2)
- Goal: перенести оставшиеся Claude Design разделы и расширить навигацию, не заходя в API/auth F09b.
- Completed: добавлены Reviews, Subscribe, QA, Profile, Notifications, About, Legal и CookieBanner; Layout получил полный desktop/mobile navigation, notifications popover, profile/Q&A modal, юридический footer и QR-announce. Добавлена hash-навигация для воспроизводимой проверки экранов. В storage остаются только `mps-theme2` и `mps-cookie-consent`; reviews/subscribe/QA/profile/notifications используют только локальный presentation-state до F09b.
- Verification run: `cd frontend/app && npm run build` — 44 Vite modules, 928ms; визуальная сверка новых разделов и F09a1 regression на Vite :5173 в обеих темах и 375px; `rg -n localStorage frontend/app/src` — только theme/cookie keys; `python -m pytest backend/tests -q --basetemp .pytest-f09a2-full` — 31 passed in 6.77s; `./init.sh` вне sandbox — pip check и 31 passed.
- Evidence recorded: feature_list.json → F09a2.evidence.
- Commits: будет создан `F09a2: остальные разделы дизайна [passing]`.
- Known risks: реальные profile/notifications/reviews/subscribe/QA данные, email/Telegram login, JWT refresh и общие hooks не реализованы намеренно — это отдельная F09b.
- Next best action: представить план F09b и ждать подтверждения пользователя.

### Session 12 — 2026-08-18 (Codex, F09b)
- Goal: подключить перенесённый React-дизайн к REST API и email-авторизации.
- Completed: добавлены memory-only JWT client с refresh/retry 401, hooks auth/posts/reviews/comments/subscribe/QA/forum/notifications/online; реальные API подключены к компонентам. Email-код — рабочий UI-flow, Telegram-кнопка использует VITE_TELEGRAM_BOT_USERNAME, роль приходит из `/me`, dev role switch ограничен `import.meta.env.DEV`. Флаги стран берутся из фиксированного frontend-справочника. Отдельный commit `143e813` исправил F06 messages response: author и is_ai.
- Verification run: `python -m pytest tests/test_f09b_api_flow.py -q --basetemp .pytest-f09b-flow-final` — 1 passed: SQLite+fakeredis ASGI flow covers TZ §7.1–6, email code/JWT/refresh, reader `/me`, posts/reviews/comments/QA/forum, with explicit Unisender/Telegram respx mocks. Full `python -m pytest tests -q --basetemp .pytest-f09b-full-final` — 33 passed in 9.64s; `npm run dev -- --host 127.0.0.1` — Vite ready at :5173; `npm run build` — 46 modules, 1.11s; `./init.sh` — pip check, 33 passed.
- Evidence recorded: feature_list.json → F09b.evidence.
- Commits: `143e813 fix: F06 forum messages contract for frontend`; далее будет `F09b: подключение API и авторизации [passing]`.
- Known risks: финальная браузерная проверка с живым Postgres/Redis остаётся ручным smoke Павла на локальной машине или при F10; принятая эквивалентная ASGI SQLite+fakeredis API-верификация полностью пройдена. Внешние Telegram/Unisender/MiniMax намеренно не вызываются, их transport contracts замоканы.
- Next best action: F10 — деплой и production/manual browser smoke.

### Session 13 — 2026-08-18 (Codex, F10)
- Goal: подготовить production deploy, SEO и backup для финальной фичи.
- Completed: добавлены nginx HTTPS/static/API/media template, backend systemd unit, daily pg_dump backup timer, smoke script и DEPLOY.md. SEO endpoints `/sitemap.xml`, `/robots.txt`, bot-specific `/posts/{slug}` OG/meta+Article JSON-LD; обычный browser получает собранный index.html. Добавлена `python -m app.management.create_admin` с email/TG identity и интерактивным вводом без default credentials. Иришка остаётся в FastAPI lifespan, scheduler unit не нужен.
- Verification run: F10 target tests — 4 passed; localhost staging-double `deploy/smoke.sh` — [OK]; shell syntax OK; full pytest — 37 passed; Vite build — 46 modules; `./init.sh` — pip check + 37 passed.
- Evidence recorded: feature_list.json → F10.evidence.
- Commits: будет создан `F10: деплой и SEO [passing]`.
- Known risks: реальные DNS/certbot/HSTS/systemd/pg_dump/production curl и ручная регистрация webmaster выполняются Павлом на VPS по DEPLOY.md. HSTS намеренно закомментирован до первого корректного HTTPS.
- Next best action: Павел выполняет DEPLOY.md и production smoke, затем вручную проходит browser login/click smoke.

### Session 14 — 2026-08-18 (Codex, audit remediation)
- Goal: закрыть три launch blocker из `docs/AUDIT_REPORT.md` до production deploy.
- Completed: F02 email-код теперь реально отправляется через Unisender с атомарной очисткой Redis при отказе; F09b использует официальный Telegram Login Widget и `/auth/telegram`; F10 frontend переведён с hash на pathname/history routing с прямыми статьями и странами, отдельными 404/API-error состояниями.
- Verification run: frontend `npm test` — 4 files, 20 passed; `npm run build` — 48 modules; backend full pytest — 38 passed; storage grep — только theme/cookie-consent.
- Commits: `522a00d` email delivery; `937a6a5` Telegram Widget; текущий `fix: launch blocker — client-side routing по pathname вместо hash`.
- Result: audit-remediation launch blockers завершены; оставшиеся пункты «Важно»/«Желательно» остаются для отдельной приоритизации перед или после реального VPS deploy.

### Session 15 — 2026-08-18 (Codex, C-04/C-06 remediation)
- Goal: исправить confirm URL подписки и сделать PostgreSQL backup unit готовым к первому VPS-запуску без затрагивания C-05 и остальных audit-задач.
- Completed: confirm-письмо ведёт на `BASE_URL/api/v1/subscribe/confirm/{token}`; тест переходит по ссылке из реального HTML payload. Backup использует отдельный `PG_DUMP_URL`, проверяет pg_dump/права/непустой результат, атомарно публикует архив и удаляет файлы старше 14 дней. Systemd пишет понятные `mps-backup: ERROR/OK` в journal и запускает script через `/usr/bin/bash`.
- Verification run: targeted subscribe — 2 passed; `bash -n deploy/backup.sh` — OK; missing-env smoke — явный exit 1; functional backup smoke — непустой файл и rotation OK; full backend pytest — 38 passed; финальный `./init.sh` вне sandbox — pip check + 38 passed.
- Evidence recorded: feature_list.json → F05 C-04 и F10 C-06 audit remediation; DEPLOY.md содержит обязательные VPS `PG_DUMP_URL`, каталог, journal и реальный pg_dump/pg_restore steps.
- Known risks: реальный PostgreSQL/pg_dump/systemd отсутствует в локальной Windows-среде и проверяется Павлом на VPS; C-05 не изменялся.
- Next best action: выполнить DEPLOY.md на VPS и не включать backup timer в доверенный operational state до первого `mps-backup: OK` и успешного `pg_restore --list`.
