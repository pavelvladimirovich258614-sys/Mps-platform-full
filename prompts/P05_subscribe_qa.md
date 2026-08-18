# P05 — Сессия Codex: подписка + вопрос-ответ (фича F05)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F05**. Прочитай BACKEND_SPEC §2 (subscriptions, questions), §3 (subscribe, qa), §4 (tg_relay, mailer), TZ §3 F-D/F-E.

Сделай:
1. Модель subscriptions + миграция; double opt-in: POST /subscribe → письмо с confirm-ссылкой; GET /subscribe/confirm/{token}; GET /subscribe/unsub/{token}.
2. services/mailer.py: реальный клиент Unisender Go (httpx, ключ из env), шаблоны confirm и digest; функция build_digest(days=7) собирает HTML из опубликованных постов. Отправка дайджеста — команда `python -m app.jobs.send_digest` + systemd-timer в deploy/ (юнит написать, установку опиши в notes).
3. Модель questions + POST /qa, GET /qa/my.
4. services/tg_relay.py: отправка через Bot API (httpx, BOT_TOKEN): manager → MANAGERS_CHAT_ID, lawyer → LAWYER_TG_ID; текст с #Q{id}; сохранить tg_message_id.
5. bot_bridge/: POST /internal/qa-answer (секрет BOT_BRIDGE_SECRET) — принимает {question_id, answer, answered_by_name}, ставит answered, создаёт notification. Плюс файл bot_bridge/aiogram_router.py: готовый роутер aiogram 3.x, который ловит reply в чате менеджеров, парсит #Q{id} и дёргает этот эндпоинт — Павел вставит его в существующего бота «Под солнцем».
6. В тестах Unisender и Telegram мокай на уровне httpx-транспорта (respx или MockTransport). Тесты по verification F05.

Заверши по AGENTS.md.
