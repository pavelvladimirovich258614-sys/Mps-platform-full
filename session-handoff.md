# Session handoff — после F09a1

## Verified state
- F01–F08 и F09a1 passing; Alembic head `20260818_0007`; full pytest and `./init.sh`: 31 passed. Next: F09a2, затем F09b.
- `frontend/app` — новый Vite + React + TypeScript каркас. Исходник истины дизайна остаётся `frontend/mir-pod-solncem.dc.html`; не удалять и сохранять семантику 1:1. F09a1 уже содержит Layout, Feed, Forum, ArticleComments и обе темы/mobile.
- `frontend/app/src/api/comments.ts` — узкий адаптер исправленного F04 контракта. `GET /posts/{id}/comments` возвращает `author`, `reactions`, `my_reaction`; `POST /comments/{id}/react` toggles текущий emoji и возвращает новые `reactions`/`my_reaction`. Access token пока читается из sessionStorage только как временная граница до F09b; в F09b заменить общим memory-only auth client с refresh cookie.
- F09a2 scope: Reviews, Subscribe, QA, Profile, Notifications, About, legal/cookie/footer и complete mobile sheet. F09b scope: VITE_API_URL fetch-client, hooks, email auth, Telegram Login Widget, real component data and E2E criteria. Не начинать F09b без отдельного подтверждения.

## F08 contracts
- `/api/v1/admin/stats`, `/admin/moderation/queue`, `/admin/users`, `/admin/users/{id}`, `/admin/settings` доступны только `role=admin`. Premium не имеет особых прав.
- Stats возвращает `users_total`, `users_active_30d`, `users_new_7d`, `users_new_30d`, `subscribers_confirmed`, `questions_open`, `questions_answered`, `reviews_pending` и до пяти `top_posts`, отсортированных по views DESC.
- `PATCH /admin/settings` принимает `cta_bot_url`, `cta_manager_url`, `irishka_enabled`, `irishka_delay_min`; значения хранятся в key-value settings. Иришка читает их при очередном запуске задачи.
- `GET /online` не требует авторизации и возвращает до 12 неанонимных пользователей с last_seen не старше 120 секунд, только `id`, `name`, `avatar_url`. Авторизованный запрос обновляет last_seen middleware.
- `GET /notifications?page=&page_size=` отдаёт только собственные уведомления. `PATCH /notifications/read` с `{}` помечает все непрочитанные собственные, а с `{ "ids": [...] }` — только перечисленные собственные; чужие ID не меняются.

## M3 guardrails
- `init.sh` запускает `python -m pip check` после установки зависимостей и до pytest; несовместимые или отсутствующие пакеты прерывают проверку.
- `backend/tests/conftest.py` использует strict `respx` для каждого теста: любой HTTPX-вызов без явного мока завершается `AllMockedAssertionError` до сетевого соединения. ASGI transport не затрагивается; F07 использует явный `respx` mock MiniMax.

## Commands
- Start/verify: `& 'C:\Program Files\Git\bin\bash.exe' ./init.sh`
- Tests: `cd backend && python -m pytest tests -q`; migrations: `cd backend && alembic upgrade head`
- Frontend: `cd frontend/app && npm install && npm run build`; local preview: `npm run dev -- --host 127.0.0.1`.
