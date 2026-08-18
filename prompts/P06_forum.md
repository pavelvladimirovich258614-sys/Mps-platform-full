# P06 — Сессия Codex: форум по странам (фича F06)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F06**. Прочитай BACKEND_SPEC §2 (countries, forum_topics, forum_messages), §3 (forum), TZ §3 F-F.

Сделай:
1. Модели forum_topics, forum_messages + миграция (countries уже есть из F03 — проверь сидер: ОАЭ, Турция, Вьетнам, Таиланд, Китай, Египет, Мальдивы, Россия; недостающие добавь миграцией данных).
2. Эндпоинты по спеке: страны со счётчиками, темы с поиском (ilike по title), создание темы (лимит 3 для роли reader, конфиг FORUM_TOPIC_LIMIT; текст ошибки по-русски), сообщения (обновление messages_count и last_message_at).
3. Notification автору темы при новом сообщении в его теме.
4. Тесты по verification F06.

Заверши по AGENTS.md.
