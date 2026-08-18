# P04 — Сессия Codex: отзывы, комментарии, модерация (фича F04)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F04**. Прочитай BACKEND_SPEC §2 (reviews, comments, comment_reactions), §3, TZ §3 F-B/F-C.

Сделай:
1. Модели + миграция: reviews (source site|bot, статусы), comments (parent_id, 1 уровень — запрет ответа на ответ), comment_reactions (уникальность по пользователю, новая реакция заменяет старую).
2. Эндпоинты по спеке §3 reviews/comments, включая POST /reviews/by-token: одноразовый токен, который бот выдаёт клиенту после закрытия заявки (таблица review_tokens: token, tg_id, expires_at; эндпоинт для бота POST /internal/review-tokens под секретом BOT_BRIDGE_SECRET).
3. Модерация: PATCH .../moderate под require_role(editor); в ответ модератору — счётчик оставшихся pending.
4. При одобрении комментария/отзыва — notification автору (модель notifications создай здесь, полноценно понадобится в F08).
5. Тесты по verification F04.

Заверши по AGENTS.md.
