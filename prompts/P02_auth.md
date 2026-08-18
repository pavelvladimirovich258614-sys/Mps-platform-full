# P02 — Сессия Codex: авторизация и роли (фича F02)

---
Прочитай AGENTS.md и выполни стартовый воркфлоу. Фича сессии — **F02 «Авторизация»**. Прочитай docs/BACKEND_SPEC.md §2 (users), §3 (auth), §5 (безопасность).

Сделай:
1. Модель users + миграция alembic (CHECK: tg_id или email заполнен).
2. POST /api/v1/auth/telegram: приём полей Telegram Login Widget, проверка hash HMAC-SHA256(SHA256(bot_token)) по официальному алгоритму, auth_date не старше 24ч; создание/поиск пользователя, выдача JWT-пары (access 30 мин, refresh 30 дней, refresh — httpOnly cookie).
3. Email-флоу: POST /auth/email/request (6-значный код в Redis, TTL 10 мин; отправку письма оформи как вызов services/mailer.send_code — сам мейлер пока пишет в лог, реальный Unisender в F05, это зафиксируй в notes фичи, это НЕ placeholder-нарушение, а согласованная граница фичи), POST /auth/email/verify.
4. deps.py: get_current_user, require_role(...); роли из спеки.
5. GET /me, PATCH /me (name, bio, avatar_url, is_anonymous), обновление last_seen_at при каждом авторизованном запросе (middleware).
6. Rate limit slowapi: 5/мин на auth-эндпоинты.
7. Тесты по verification фичи F02, включая подделанный hash → 401.

Заверши по AGENTS.md.
