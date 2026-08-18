# P03 — Сессия Codex: публикации (фича F03)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F03 «Публикации»**. Прочитай BACKEND_SPEC §2 (posts, post_likes), §3 (posts), TZ §3 F-A.

Сделай:
1. Модели posts, post_likes + миграция. Поля video_review: video_url, hotel_name, country_id (пока nullable FK на будущую таблицу countries — создай countries прямо здесь с сидером из F06 notes, чтобы не блокировать), shot_at NOT NULL для типа video_review (валидация на уровне схемы Pydantic).
2. Эндпоинты: GET /posts (published, пагинация 20, фильтры type и country), GET /posts/{slug} (+views), POST/PATCH/DELETE /posts (editor+), POST /posts/{id}/like (toggle, атомарно обновляет likes_count).
3. Slug: транслитерация title, при коллизии суффикс из 6 hex.
4. Санитизация body через nh3 при записи.
5. Загрузка обложек: POST /api/v1/media (авторизованный, jpeg/png/webp ≤ 10 МБ, ресайз до 1600px через Pillow — добавь pillow в requirements), файлы в MEDIA_DIR из конфига.
6. Тесты по verification F03.

Заверши по AGENTS.md.
