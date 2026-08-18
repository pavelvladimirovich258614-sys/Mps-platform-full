# Спецификация бекенда МПС (для Codex — читать перед каждой backend-сессией)

## 1. Структура репозитория
```
mps-platform/
├── AGENTS.md, init.sh, feature_list.json, claude-progress.md, ...   # обвязка
├── docs/                       # ТЗ, спека, роадмап
├── frontend/                   # экспорт из Claude Design (React + Vite)
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app, CORS, роутеры
│   │   ├── config.py           # pydantic-settings, читает .env
│   │   ├── db.py               # engine, async_session, Base
│   │   ├── models/             # SQLAlchemy: user.py, post.py, review.py, comment.py,
│   │   │                       #   subscription.py, question.py, forum.py, notification.py
│   │   ├── schemas/            # Pydantic-схемы (зеркалят models)
│   │   ├── api/                # роутеры: auth.py, posts.py, reviews.py, comments.py,
│   │   │                       #   subscribe.py, qa.py, forum.py, admin.py, profile.py
│   │   ├── services/           # tg_relay.py, irishka.py, mailer.py, moderation.py
│   │   └── deps.py             # get_db, get_current_user, require_role
│   ├── alembic/                # миграции
│   ├── tests/                  # pytest + httpx AsyncClient
│   ├── requirements.txt
│   └── .env.example
├── bot_bridge/                 # мини-модуль aiogram: релей вопрос-ответ (можно встроить в существующего бота)
└── deploy/                     # nginx.conf, systemd-юниты, backup.sh
```

## 2. Модели данных (PostgreSQL)

### users
id PK, tg_id BIGINT UNIQUE NULL, email UNIQUE NULL, email_verified BOOL, name, avatar_url, bio, role ENUM(reader, premium, editor, admin) DEFAULT reader, is_anonymous BOOL DEFAULT false, is_banned BOOL, last_seen_at, created_at.
Правило: заполнен tg_id ИЛИ email (CHECK).

### posts
id PK, type ENUM(article, fishka, video_review), title, slug UNIQUE, cover_url NULL, body TEXT (markdown), excerpt, author_id FK users, status ENUM(draft, published) , published_at, views INT DEFAULT 0, likes_count INT DEFAULT 0 (денормализация), cta_enabled BOOL DEFAULT true.
Для video_review дополнительно: video_url, hotel_name, country_id FK, shot_at DATE NOT NULL, by_request BOOL.

### post_likes
post_id FK, user_id FK, created_at; PK(post_id, user_id).

### reviews
id, user_id NULL (может прийти по токену из бота), author_name, rating SMALLINT 1–5, body, photo_url NULL, status ENUM(pending, approved, rejected), moderated_by FK NULL, source ENUM(site, bot), created_at.

### comments
id, post_id FK, user_id FK, parent_id FK comments NULL, body, status ENUM(pending, approved, rejected), created_at.
### comment_reactions
comment_id FK, user_id FK, emoji VARCHAR(8); PK(comment_id, user_id).

### subscriptions
id, email UNIQUE, confirmed BOOL, confirm_token, unsub_token, created_at.

### questions
id, user_id FK, target ENUM(manager, lawyer), body, status ENUM(open, answered, closed), answer TEXT NULL, answered_by_name NULL, tg_message_id BIGINT NULL (для матчинга reply), created_at, answered_at.

### countries
id, name, flag_emoji, sort_order, is_active.
### forum_topics
id, country_id FK, author_id FK, title, is_locked BOOL, messages_count INT, created_at, last_message_at.
### forum_messages
id, topic_id FK, author_id FK, body, is_ai BOOL DEFAULT false, created_at.

### notifications
id, user_id FK, type VARCHAR, payload JSONB, is_read BOOL, created_at.

### settings (key-value)
cta_bot_url, cta_manager_url, irishka_delay_min, irishka_enabled, digest_day …

## 3. API (префикс /api/v1)

### auth
POST /auth/telegram — данные Telegram Login Widget (проверка hash по bot_token) → JWT-пара.
POST /auth/email/request — email → код на почту (6 цифр, TTL 10 мин, Redis).
POST /auth/email/verify — email+код → JWT-пара. POST /auth/refresh. GET /me. PATCH /me (name, bio, avatar, is_anonymous).

### posts
GET /posts?type=&country=&page= (published, пагинация 20) · GET /posts/{slug} (+инкремент views) · POST /posts/{id}/like (toggle) · CRUD POST/PATCH/DELETE /posts — роль editor+.

### reviews
GET /reviews?status=approved · POST /reviews (аноним разрешён при наличии bot-токена: POST /reviews/by-token) · PATCH /reviews/{id}/moderate {approve|reject} — editor+.

### comments
GET /posts/{id}/comments (approved) · POST /posts/{id}/comments (status=pending) · POST /comments/{id}/react {emoji} · PATCH /comments/{id}/moderate — editor+.

### subscribe
POST /subscribe {email} → письмо-подтверждение · GET /subscribe/confirm/{token} · GET /subscribe/unsub/{token}.

### qa
POST /qa {target, body} → создаёт question + services.tg_relay.send() · GET /qa/my — мои вопросы с ответами.

### forum
GET /countries · GET /countries/{id}/topics?search= · POST /countries/{id}/topics (лимит 3 на читателя) · GET /topics/{id}/messages · POST /topics/{id}/messages.

### profile / presence
GET /online — список пользователей с last_seen ≤ 120 c и is_anonymous=false (имя+аватар, max 12). Каждый авторизованный запрос обновляет last_seen. GET /notifications · PATCH /notifications/read.

### admin
GET /admin/stats (метрики из ТЗ F-I) · GET/PATCH /admin/users · GET /admin/moderation/queue · PATCH /admin/settings.

## 4. Сервисы

### tg_relay (вопрос-ответ)
Отправляет вопрос в Telegram: target=manager → рабочий чат менеджеров (topic/thread «Вопросы с сайта»), target=lawyer → личка юриста через бота. Сообщение содержит #Q{id}. Ответ ловится ботом: reply на сообщение → парсим #Q{id} → PATCH question(status=answered, answer, answered_at) → создаём notification. Реализация: отдельный роутер в существующем боте «Под солнцем» (bot_bridge/), общая БД или HTTP-вызов backend с секретом BOT_BRIDGE_SECRET.

### irishka (ИИ-помощник форума)
Cron/arq-задача раз в 5 мин: находит темы где messages_count == 0 (или последний вопрос без ответа) и created_at < now - delay. Промпт MiniMax: «Ты Иришка, дружелюбный помощник турагентства… Отвечай кратко и полезно по теме "{title}". Не называй цены, не давай юридических гарантий; если вопрос про цены/документы — предложи спросить менеджера». Ответ публикуется от служебного user (role=editor, name="Иришка · ИИ-помощник", is_ai=true). Не более 1 ИИ-ответа на тему.

### mailer
Unisender Go API. Шаблоны: confirm, digest. Дайджест: cron четверг 10:00 МСК — посты за 7 дней → HTML-письмо всем confirmed.

### media
Загрузка изображений: POST /media (авторизованный), сохранение в /var/www/mps/media, ресайз до 1600px (Pillow), отдача через nginx. Видео для видеообзоров v1 — ссылкой (Telegram/VK Video/файл на сервере), без транскодинга.

## 5. Безопасность
- JWT: access 30 мин, refresh 30 дней, httpOnly cookie для refresh.
- Rate limit (slowapi/Redis): auth 5/мин/IP, POST-контент 10/мин/пользователь.
- Валидация Telegram Login hash строго по алгоритму (HMAC-SHA256 от bot_token).
- Санитизация HTML в body (bleach/nh3) — разрешён безопасный markdown-рендер.
- Секреты только в .env, .env в .gitignore, есть .env.example.
- CORS: только домен платформы.

## 6. .env.example (обязательные ключи)
```
DATABASE_URL=postgresql+asyncpg://mps:***@localhost:5432/mps
REDIS_URL=redis://localhost:6379/3
JWT_SECRET=
BOT_TOKEN=                # бот «Под солнцем»
MANAGERS_CHAT_ID=
LAWYER_TG_ID=
BOT_BRIDGE_SECRET=
UNISENDER_GO_API_KEY=
MINIMAX_API_KEY=
MINIMAX_MODEL=
BASE_URL=https://<домен>
```

## 7. Тесты (минимум на каждую фичу)
pytest + httpx AsyncClient + sqlite/pg-тестовая БД. На фичу: happy-path + 1 негативный (403/422). Обязательные: auth telegram hash (валидный/подделка), лайк-toggle, премодерация комментария (pending не виден гостю), лимит 3 темы, relay создаёт notification при ответе.
