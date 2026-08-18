# P08 — Сессия Codex: админка, статистика, уведомления, онлайн (фича F08)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F08**. Прочитай BACKEND_SPEC §3 (admin, profile/presence), TZ §3 F-G/F-I.

Сделай:
1. GET /admin/stats: пользователи всего, активные 30д (last_seen), новые 7д/30д, подписчики confirmed, вопросы open/answered, отзывы pending, топ-5 постов по просмотрам.
2. GET /admin/moderation/queue (pending отзывы+комментарии единым списком), GET/PATCH /admin/users (бан), PATCH /admin/settings (cta_bot_url, cta_manager_url, irishka_*).
3. GET /online по спеке (≤120с, без анонимов, максимум 12, имя+аватар).
4. GET /notifications (пагинация), PATCH /notifications/read (все или по id).
5. Тесты по verification F08.

Заверши по AGENTS.md. После этой сессии Павел запускает evaluator-rubric.md (прогон №2).
