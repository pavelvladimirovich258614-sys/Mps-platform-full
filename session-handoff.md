# Session handoff — после F08

## Verified state
- F01–F08 passing; Alembic head `20260818_0007`; full pytest and `./init.sh`: 31 passed. Next: F09. Frontend не менять до F09.

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
