# Технический аудит mps-platform после F01–F10

Дата аудита: 2026-08-18
Область: `backend/`, `frontend/app/`, `deploy/`, `bot_bridge/`, спецификации и evidence F01–F10.
Формат аудита: анализ исходного кода и контрактов без изменения production-кода.

## Базовая проверка

- `./init.sh`: `pip check` — `No broken requirements found`; полный backend pytest — `37 passed`.
- На старте аудита `HEAD=eaa8d4f`, ветка `main` совпадала с `origin/main`.
- Зелёные тесты подтверждают реализованные happy-path контракты, но не опровергают перечисленные ниже интеграционные, deployment- и concurrency-проблемы.

## Критично

### C-01. Email-код сохраняется в Redis, но письмо не отправляется

**Где:** `backend/app/api/auth.py:54-58`, `backend/app/services/mailer.py:21`, `feature_list.json` — notes F02/F05/F09b.
**Проблема:** `POST /auth/email/request` генерирует код и вызывает `mailer.send_code()`, но `send_code()` только логирует факт запроса. Она не принимает runtime settings и не вызывает существующий Unisender-клиент `send_email()`. Это одинаково ломается с fakeredis и с настоящим Redis/PostgreSQL: API возвращает 204, код существует только в Redis, пользователь не получает его и не может войти. Тесты читают код непосредственно из fakeredis, поэтому обходят реальную доставку. F02 обещала transport в F05, но F05 подключила Unisender только к confirm/digest.
**Предлагаемый фикс:** передавать `Settings` в `send_code()`, формировать шаблон кода и вызывать `send_email()`; не подтверждать успешную отправку при отказе transport. Добавить respx-тест, проверяющий фактический запрос Unisender с кодом.
**Объём:** маленькая правка.

### C-02. Telegram Login Widget во frontend является неработающей кнопкой

**Где:** `frontend/app/src/components/Profile.tsx:4`, `frontend/app/src/hooks/index.ts:25-32`, `backend/app/api/auth.py:36-49`.
**Проблема:** backend `/auth/telegram` и HMAC-проверка существуют, но frontend не загружает официальный widget script, не регистрирует callback и не отправляет полученные Telegram-данные в API. Атрибут `data-telegram-login` на обычном `<button>` сам по себе widget не инициализирует; у кнопки нет даже `onClick`. Это не ограничение dev-стенда: production UI также ничего не сделает. F09b честно отмечала отсутствие проверки с реальным ботом, но не фиксировала, что client-side интеграция отсутствует полностью.
**Предлагаемый фикс:** изолированный TelegramLogin-компонент, официальный script с bot username из env, callback → `/auth/telegram`, memory-only access token и `/me`; тест callback/API wiring без реального Telegram.
**Объём:** требует отдельной сессии.

### C-03. URL из sitemap не открывают соответствующие React-экраны

**Где:** `backend/app/api/seo.py:35-44,47-62`, `frontend/app/src/App.tsx:16-23`, `deploy/nginx.conf:27-29`, `deploy/smoke.sh:6-12`.
**Проблема:** sitemap публикует `/reviews`, `/subscribe`, `/about`, `/countries/{id}` и `/posts/{slug}`, но React выбирает экран только из `window.location.hash` и без hash показывает feed. Для `/posts/{slug}` backend отдаёт обычному браузеру `index.html`, после чего React не читает pathname и не загружает пост по slug. Боты получают правильные OG/JSON-LD, поэтому smoke проходит, а человек из поисковой выдачи видит ленту вместо статьи.
**Почему F10 verification пропустила:** smoke проверяет наличие sitemap/robots/HSTS и `og:title` с User-Agent Googlebot, но не проходит sitemap URL обычным browser-клиентом. Это неполная интеграционная проверка F10, а не новый необязательный scope.
**Предлагаемый фикс:** pathname-router и API-загрузка detail по slug/id; browser-тест прямых переходов `/posts/{slug}`, `/countries/{id}` и статичных страниц без hash. Расширить smoke хотя бы проверкой канонического browser route.
**Объём:** требует отдельной сессии.

### C-04. Ссылка подтверждения подписки ведёт не на backend endpoint

**Где:** `backend/app/services/mailer.py:22`, `backend/app/api/subscribe.py:15-24`, `backend/app/main.py:87`, `deploy/nginx.conf:25,29`.
**Проблема:** письмо формирует `{BASE_URL}/subscribe/confirm/{token}`, тогда как реальный endpoint расположен под `/api/v1/subscribe/confirm/{token}`. Nginx отправит первый URL во frontend fallback; React такого маршрута не обрабатывает. В результате письмо может уйти, но подтвердить подписку по его ссылке нельзя. Тест вызывает API URL напрямую и не проверяет href письма.
**Предлагаемый фикс:** генерировать корректный API URL либо добавить публичный frontend route, который вызывает confirm API и показывает результат; зафиксировать контракт тестом HTML href → успешный confirm.
**Объём:** маленькая правка.

### C-05. Production rate limit объединяет пользователей за nginx и не защищает POST-контент

**Где:** `backend/app/rate_limit.py:1-4`, `backend/app/api/auth.py:37,53,62`, `backend/app/main.py:49`, `deploy/nginx.conf:25`, `docs/BACKEND_SPEC.md:114-120`.
**Проблема:** limiter использует IP `request.client` и memory storage. Nginx передаёт `X-Real-IP`, но не `X-Forwarded-For`; с uvicorn за localhost все клиенты могут учитываться как `127.0.0.1` и совместно исчерпывать 5 auth-запросов/мин. После нескольких логинов авторизация блокируется для всех. Спецификация также требует Redis-backed limit и 10 POST-контент запросов/мин/пользователь, но decorators есть только на auth.
**Предлагаемый фикс:** корректная trusted-proxy цепочка, `X-Forwarded-For`, Redis storage, отдельный user-id key для content routes и тесты нескольких IP/пользователей.
**Объём:** требует отдельной сессии.

### C-06. Автоматические PostgreSQL backup фактически не готовы к запуску

**Где:** `deploy/backup.sh:4-10`, `deploy/mps-backup.service:4-9`, `backend/.env.example:1`, git mode файлов `deploy/backup.sh` и `deploy/smoke.sh` — `100644`.
**Проблема:** application URL имеет вид `postgresql+asyncpg://...`, но `pg_dump --dbname` принимает libpq URI без `+asyncpg`. Кроме того, systemd запускает `backup.sh` напрямую, а файл закоммичен без executable bit; DEPLOY.md не содержит обязательного `chmod +x`. Timer может быть enabled, но backup завершится ошибкой, создавая ложное чувство защищённости данных. Локальная F10 проверка ограничилась `bash -n`, не запускала `pg_dump` с production-format URL и systemd ExecStart.
**Предлагаемый фикс:** отдельный `PG_DUMP_URL` или безопасное преобразование scheme, executable mode/явный `/usr/bin/bash`, проверка непустого архива и restore-smoke.
**Объём:** маленькая правка для запуска; полноценная restore-проверка требует отдельной сессии/VPS.

## Важно

### I-01. Подписка отвечает успехом даже при провале Unisender

**Статус: закрыто 2026-08-20.** `POST /api/v1/subscribe` теперь возвращает контролируемый `502` с русским сообщением, если Unisender не принял письмо. Неподтверждённая подписка и существующий confirm-token сохраняются для повторной попытки. Failure-path покрыт `test_subscription_reports_unisender_delivery_failure_without_losing_token`: Unisender `503` → API `502`, повтор использует тот же токен.

**Где:** `backend/app/services/mailer.py:14-20`, `backend/app/api/subscribe.py:11-14`.
**Проблема:** `send_confirm()` возвращает `False`, но endpoint игнорирует результат и всегда отвечает 201 с инструкцией проверить почту. Запись остаётся unconfirmed; повторный запрос переиспользует тот же токен, но снова сообщает успех независимо от transport.
**Предлагаемый фикс:** явно моделировать delivery state/retry или возвращать контролируемую 502/202 с честным сообщением; добавить failure-path test.
**Объём:** маленькая правка.

### I-02. QA фиксирует вопрос до Telegram relay и создаёт дубликаты при retry

**Где:** `backend/app/api/qa.py:14-16`, `backend/app/services/tg_relay.py:9-11`.
**Проблема:** вопрос коммитится до HTTP-вызова Telegram. Если relay падает, клиент получает 5xx, но строка уже сохранена без `tg_message_id`; повтор создаёт новый вопрос. Нет outbox/retry состояния.
**Предлагаемый фикс:** outbox/status `delivery_pending|sent|failed`, идемпотентный retry или компенсирующая транзакция; тест падения Telegram.
**Объём:** требует отдельной сессии.

### I-03. Ответ юриста через bot_bridge не попадёт обратно на платформу

**Где:** `backend/app/services/tg_relay.py:9-11`, `bot_bridge/aiogram_router.py:4-10`, `docs/BACKEND_SPEC.md:102-103`.
**Проблема:** relay отправляет lawyer-вопрос в личный чат, но router принимает reply только из `managers_chat_id`. Он также не проверяет HTTP status backend-ответа, поэтому отказ записи ответа проходит незаметно. Thread/topic менеджеров из спецификации не передаётся (`message_thread_id` отсутствует).
**Предлагаемый фикс:** разрешить отдельно настроенный lawyer chat, проверить `raise_for_status()`, логировать/сообщать ошибку и покрыть router unit-тестами.
**Объём:** маленькая правка.

### I-04. Стоп-темы Иришки создают Question, но не вызывают Telegram relay

**Где:** `backend/app/services/irishka.py:47-56,74-81`, `docs/BACKEND_SPEC.md:105-106`.
**Проблема:** ценовая/юридическая тема создаёт запись Question и AI-сообщение «уточню», но менеджер не получает Telegram-сообщение, а `tg_message_id` остаётся пустым. Такой вопрос может навсегда остаться open.
**Предлагаемый фикс:** использовать общий delivery/outbox QA, а не создавать Question напрямую; тест должен подтверждать relay или queued delivery.
**Объём:** требует отдельной сессии вместе с I-02.

### I-05. Лайки, views и forum counters подвержены lost update/race

**Где:** `backend/app/api/posts.py:31-46`, `backend/app/api/forum.py:121-136`, `backend/app/services/irishka.py:35-45,74-81`.
**Проблема:** read-modify-write для `views`, `likes_count`, `messages_count` не атомарен. Параллельные запросы теряют инкременты; одинаковые одновременные like могут столкнуться с PK, а несколько backend instances способны одновременно создать AI-ответ.
**Предлагаемый фикс:** атомарные SQL `UPDATE ... SET count=count+1`, PostgreSQL upsert/locking и uniqueness-инвариант AI-response; concurrency tests на PostgreSQL.
**Объём:** требует отдельной сессии.

### I-06. Пользовательские тексты санитизируются непоследовательно; JSON-LD допускает закрытие script

**I-06a — статус: закрыто 2026-08-20.** JSON-LD Article теперь после `json.dumps()` кодирует `<`, `>` и `&` как Unicode escapes перед вставкой в `<script type="application/ld+json">`. Security regression test подтверждает, что raw `</script><script>…` не попадает в HTML, а извлечённый JSON-LD остаётся валидным и сохраняет исходные значения.

**I-06b — открытый follow-up.** Широкая непоследовательная sanitization остаётся: `post.title/excerpt`, forum title/body, QA question/answer, profile name/bio и review author name требуют продуктового решения о допустимом содержимом до фикса. Это отдельная сессия: нужно определить plain-text/разрешённый HTML для каждого boundary и добавить соответствующие contract tests.

**Где:** `backend/app/api/posts.py:37-39,52-57`, `backend/app/api/comments.py:88`, `backend/app/api/reviews.py:57-62,83-87`, `backend/app/api/forum.py:80,124`, `backend/app/api/qa.py:16,29`, `backend/app/api/seo.py:59-62`.
**Проблема:** nh3 применяется к post/review/comment body, но не к forum title/body, QA body/answer, profile bio/name или post title/excerpt. React сейчас экранирует большинство значений, однако JSON-LD вставляет `json.dumps()` внутрь `<script>` без экранирования `</script>`. Пользователь с editor-доступом может сохранить строку, завершающую script; bot HTML доступен любому клиенту со spoofed User-Agent.
**Предлагаемый фикс:** единый boundary sanitization/escaping policy; для JSON-LD заменять `<` на `\u003c` либо использовать безопасный serializer/CSP; security regression test с `</script>`.
**Объём:** маленькая правка для JSON-LD; унификация требует отдельной сессии.

### I-07. Comments и countries выполняют N+1 запросы

**Где:** `backend/app/api/comments.py:18-42,59-70`, `backend/app/api/forum.py:27-40`.
**Проблема:** для каждого комментария отдельно загружается author, aggregate reactions и, для авторизованного viewer, его reaction: до `1 + 3N` запросов. Для каждой страны отдельно считается число тем.
**Предлагаемый фикс:** joins/subqueries с grouped counts и одним запросом viewer reaction; grouped country/topic count. Добавить query-count/performance test.
**Объём:** требует отдельной сессии.

### I-08. На часто используемых полях отсутствуют индексы

**Где:** `backend/app/models/user.py:21-32`, `post.py:24-41`, `comment.py:23-31`, `forum.py:5-10`, `notification.py:13-18`, `question.py:8-10`, `review.py:25-36`; миграции `backend/alembic/versions/20260818_0002_users.py:16`–`20260818_0006_forum.py:6`.
**Проблема:** кроме PK/UNIQUE практически нет индексов. Частые filters/sorts сканируют `users(last_seen_at,is_anonymous,created_at)`, `posts(status,published_at,country_id,views)`, `comments(post_id,status)`, `reviews(status,created_at)`, `questions(user_id,status)`, `forum_topics(country_id,author_id,created_at)`, `forum_messages(topic_id)`, `notifications(user_id,is_read,created_at)`.
**Предлагаемый фикс:** составные индексы на реальные query patterns, затем `EXPLAIN ANALYZE` на PostgreSQL.
**Объём:** требует отдельной сессии.

### I-09. Pagination публикаций недетерминирована, несколько списков не имеют pagination

**Где:** `backend/app/api/posts.py:24-29`, `reviews.py:43-48`, `forum.py:44-60,87-110`, `qa.py:17-18`, `admin.py:47-80`.
**Проблема:** `/posts` применяет offset/limit без `ORDER BY`, поэтому элементы могут повторяться или исчезать между страницами. Reviews, topic messages, QA history и moderation queue возвращают все строки. Forum search предварительно загружает все темы страны в Python.
**Предлагаемый фикс:** стабильный sort `(published_at,id)`, cursor/limit для растущих коллекций, database search.
**Объём:** требует отдельной сессии.

### I-10. Backend `fishka` не совпадает с frontend `tip`

**Где:** `backend/app/models/post.py:9`, `frontend/app/src/hooks/index.ts:9`, `frontend/app/src/components/Feed.tsx:5-12`.
**Проблема:** API возвращает type `fishka`, а TypeScript и фильтр ожидают `tip`. Фишка отображается как обычная статья, а фильтр «Фишки» показывает пустой список. TypeScript не ловит расхождение, потому что JSON приводится к заявленному generic без runtime validation.
**Предлагаемый фикс:** единый generated/shared contract либо явный adapter `fishka → tip`; contract test с реальным payload.
**Объём:** маленькая правка.

### I-11. Основные post-контракты не подключены к UI

**Где:** `backend/app/api/posts.py:22-34,40-46`, `frontend/app/src/hooks/index.ts:35`, `frontend/app/src/components/Feed.tsx:8-13`, `frontend/app/src/App.tsx:22-26`.
**Проблема:** UI не вызывает detail `GET /posts/{slug}`, поэтому views не растут; кнопки лайка отсутствуют, хотя критерий F09b проверял like только прямым API-запросом. DTO также не отдаёт/не использует значительную часть design-контракта: cover/excerpt/video/hotel/country/by_request/CTA.
**Предлагаемый фикс:** detail hook, like action/state и полный response DTO; frontend integration tests.
**Объём:** требует отдельной сессии.

### I-12. Notifications и online не обновляются после login и устаревают навсегда

**Где:** `frontend/app/src/hooks/index.ts:18-22,25-41`, `frontend/app/src/App.tsx:18-26`, `docs/TZ.md:41`.
**Проблема:** hooks монтируются до авторизации с пустыми dependencies. Notifications получает 401, затем после успешного login автоматически не reload; online запрашивается один раз, хотя presence предполагает polling ≤120 секунд. Ошибки этих hooks почти нигде не показываются toast.
**Предлагаемый фикс:** dependency на auth/user, reload после login, bounded polling/visibility handling, AbortController и единый error toast.
**Объём:** требует отдельной сессии.

### I-13. Profile state не синхронизируется с пользователем после login

**Статус: закрыто 2026-08-20.** `Profile` синхронизирует name, bio и anonymous при изменении `user.id` (включая anonymous → существующий пользователь после email или Telegram login), не сбрасывая draft при обновлении того же пользователя. `Profile.test.tsx` фиксирует rerender без unmount и сохранение полей существующего профиля.

**Где:** `frontend/app/src/components/Profile.tsx:4`.
**Проблема:** `name`, `bio`, `anonymous` инициализируются один раз из nullable user. После email verify тот же mounted component переключается на authenticated form со старыми локальными значениями; существующий профиль может быть затёрт пустыми данными при сохранении.
**Предлагаемый фикс:** effect/reset по `user.id` либо remount с key; тест login существующего пользователя → поля сохранены.
**Объём:** маленькая правка.

### I-14. Admin/editor UI и часть профиля из ТЗ отсутствуют

**Где:** `frontend/app/src/App.tsx:2-16,26`, список компонентов `frontend/app/src/components/`; `docs/TZ.md:41,48,80`; `backend/app/api/admin.py:21-143`.
**Проблема:** backend admin endpoints существуют, но frontend не содержит экранов статистики, moderation, ban/settings, CRUD публикаций или справочника стран. В профиле отсутствуют «страны где был». Приёмочный сценарий «администратор видит статистику и модерирует» через продукт выполнить нельзя.
**Предлагаемый фикс:** отдельный admin milestone и модель/profile API для visited countries; не маскировать backend API-тестом отсутствие UI.
**Объём:** требует отдельной сессии.

### I-15. Forum lock не применяется, notification содержит `message_id: null`

**Статус: закрыто 2026-08-20.** `POST /topics/{id}/messages` возвращает `423` для закрытой темы до создания сообщения. Для открытой темы route выполняет `flush()` до создания notification, поэтому payload содержит фактический ID сообщения. Контракты закреплены в `test_forum_rejects_messages_in_locked_topic` и расширенном forum success-path.

**Где:** `backend/app/models/forum.py:7`, `backend/app/api/forum.py:113-136`.
**Проблема:** `is_locked` хранится, но POST message его игнорирует. Notification создаётся до refresh/получения ID и записывает `message_id: None`, затрудняя точный переход к ответу.
**Предлагаемый фикс:** 423/403 для locked topic, flush перед notification, тест обоих контрактов.
**Объём:** маленькая правка.

### I-16. Повторная moderation/answer создаёт повторные уведомления

**Статус: закрыто 2026-08-20.** Повторное одинаковое решение moderation возвращает `200` без нового notification, а противоположное финальному решение получает `409`. Повторный QA-ответ возвращает `200` только при точном совпадении `answer` и `answered_by_name`; любое отличие возвращает `409`, не перезаписывая исходные ответ, автора и timestamp. Контракт покрыт negative/retry tests comments, reviews и QA.

**Где:** `backend/app/api/comments.py:135-150`, `reviews.py:97-113`, `qa.py:19-29`.
**Проблема:** повторный approve уже approved объекта снова добавляет notification; повторный internal answer также добавляет новую notification и перезаписывает ответ без проверки состояния.
**Предлагаемый фикс:** идемпотентные transitions и uniqueness/idempotency key; negative tests повторного вызова.
**Объём:** маленькая правка.

### I-17. Stats включают служебного пользователя и drafts в top posts

**Где:** `backend/alembic/versions/20260818_0007_irishka.py:7`, `backend/app/api/admin.py:31-43`.
**Проблема:** `users_total/new` считает системную Иришку обычным пользователем, а top-5 не фильтрует published posts. Метрики отличаются от ожидаемой продуктовой статистики. Это не отражено в notes F08.
**Предлагаемый фикс:** явный признак service account или исключение; documented definition метрик и published filter.
**Объём:** маленькая правка.

### I-18. Deployment bootstrap и digest unit неполны

**Где:** `deploy/nginx.conf:1-19`, `DEPLOY.md:13-20`, `deploy/mps-digest.service:1-6`, `deploy/mps-backend.service:8-10`.
**Проблема:** единственный nginx template уже ссылается на ещё не существующие certificate files, хотя инструкция предлагает сначала установить HTTP-конфигурацию и выполнить `nginx -t`. Отдельного bootstrap HTTP template нет. Digest service, в отличие от backend/backup, не подключает `/etc/mps-platform/backend.env`, поэтому использует defaults/.env из working directory и может не видеть production DB/Unisender.
**Предлагаемый фикс:** отдельный pre-cert HTTP config или пошаговая генерация; добавить EnvironmentFile/User/Group в digest unit и unit verification на VPS.
**Объём:** маленькая правка.

### I-19. Валидация email и внешних URL слишком слабая

**Где:** `backend/app/schemas/auth.py:14-19`, `backend/app/schemas/f05.py:3`, `backend/app/schemas/moderation.py:16-24`, `backend/app/schemas/user.py:22-26`.
**Проблема:** email — произвольная строка до 320 символов; subscribe имеет лишь min/max. `photo_url` не ограничен HTTP(S), avatar допускает любую строку. Это создаёт мусорные аккаунты/рассылки и риск опасных URL при будущем `<img>`/redirect использовании.
**Предлагаемый фикс:** нормализованный `EmailStr`, trim/case policy, `HttpUrl`/media-path whitelist.
**Объём:** маленькая правка с миграционным аудитом существующих данных.

### I-20. В production UI остаются фиктивные юридические и контактные данные

**Где:** `frontend/app/src/components/Layout.tsx:18`, `frontend/app/src/components/About.tsx:6`.
**Проблема:** футер показывает `ИП Иванова И.И.`, нулевой ИНН, example phone/address. Значения не берутся из env/settings. Для публичного запуска это юридически и репутационно неприемлемо.
**Предлагаемый фикс:** обязательная deploy-конфигурация/контент с реальными реквизитами и smoke, запрещающий placeholders.
**Объём:** маленькая правка после предоставления владельцем реальных данных.

## Желательно

### D-01. Две SQLAlchemy-сессии на один HTTP-запрос

**Где:** `backend/app/main.py:51-70`, `backend/app/deps.py:16-21`.
**Проблема:** middleware открывает сессию для last_seen, а большинство endpoints через `get_db` открывают вторую. Это удваивает connection/transaction overhead и создаёт разные snapshots; в `deps.py` также дублирован импорт AsyncSession (`:6-7`).
**Предлагаемый фикс:** один request-scoped session и единый transaction policy.
**Объём:** требует отдельной сессии из-за широкого влияния.

### D-02. Ручные DTO и endpoint schemas расходятся

**Где:** `backend/app/api/posts.py:22`, `reviews.py:27-36`, `qa.py:13`, `forum.py:57-59,98-109`, `comments.py:40-52`; `backend/app/schemas/`.
**Проблема:** большинство responses — свободные dict без `response_model`; OpenAPI не фиксирует contract, а frontend вручную дублирует types. Именно так появились `fishka/tip` и неполные response fields.
**Предлагаемый фикс:** Pydantic response models и генерация/проверка frontend types.
**Объём:** требует отдельной сессии.

### D-03. Остался неиспользуемый comments API adapter

**Где:** `frontend/app/src/api/comments.ts:14-21`, `frontend/app/src/hooks/index.ts:42`.
**Проблема:** `getComments()` и `reactToComment()` экспортируются, но hook повторяет те же вызовы напрямую; это поддерживает два способа обращения к одному контракту.
**Предлагаемый фикс:** использовать adapter в hook или удалить dead exports.
**Объём:** маленькая правка.

### D-04. Frontend resource hook допускает stale updates и скрывает часть ошибок

**Где:** `frontend/app/src/hooks/index.ts:18-42`, `frontend/app/src/components/Forum.tsx:14`, `QA.tsx:4`.
**Проблема:** нет abort/generation guard при смене country/topic и unmount; старый ответ может перезаписать новый. Ошибки posts/comments/notifications/online/QA часто превращаются в пустой экран, а forum error отображается success-стилем вместо русского toast.
**Предлагаемый фикс:** AbortController/query library, единый error boundary/toast и retry states.
**Объём:** требует отдельной сессии.

### D-05. Доступность модальных окон и форм неполна

**Где:** `frontend/app/src/components/Profile.tsx:4`, `QA.tsx:4`, `Layout.tsx:15`, `Reviews.tsx:7`, `Forum.tsx:20,26`.
**Проблема:** нет focus trap, Escape/restore focus; login dialog не имеет accessible name; многие inputs/textarea используют placeholder вместо `<label>`; mobile sheet не управляет фокусом. Avatar URLs не используются как изображения/alt.
**Предлагаемый фикс:** общий Dialog/Field component и axe/keyboard tests.
**Объём:** требует отдельной сессии.

### D-06. Frontend и bot_bridge вообще не имеют автоматических тестов

**Где:** `frontend/app/package.json:2-4`, `bot_bridge/aiogram_router.py:1-11`, `backend/tests/`.
**Проблема:** frontend проверяется только TypeScript build и прежними визуальными прогонами; нет component/router/accessibility tests. Bot bridge не тестируется. Это позволило passing при inert Telegram button и broken pathname routes.
**Предлагаемый фикс:** Vitest + Testing Library + router tests; aiogram router unit tests.
**Объём:** требует отдельной сессии.

### D-07. Зависимости не зафиксированы и test-пакеты ставятся в production

**Где:** `backend/requirements.txt:1-19`, `init.sh:5,18-30`.
**Проблема:** версии не pinned, а pytest/fakeredis/respx/aiosqlite находятся в общем runtime requirements. `pip check` проверяет совместимость текущего разрешения, но не воспроизводимость следующей установки.
**Предлагаемый фикс:** lock с hashes и отдельный requirements-dev.
**Объём:** требует отдельной сессии.

### D-08. Служебные job/transport функции не задают явные timeouts/retry policy

**Где:** `backend/app/services/mailer.py:16-20`, `tg_relay.py:9-11`, `irishka.py:58-72`, `backend/app/jobs/send_digest.py:7-11`, `bot_bridge/aiogram_router.py:10`.
**Проблема:** используется default httpx timeout, нет retry/backoff/idempotency/метрик; digest отправляет письма последовательно и не формирует итог успешных/неуспешных доставок.
**Предлагаемый фикс:** общий configured transport, bounded retry и observability.
**Объём:** требует отдельной сессии.

### D-09. Google Fonts — внешний runtime dependency

**Где:** `frontend/app/src/styles.css:1`.
**Проблема:** production page загружает шрифты с Google, что ухудшает privacy, CSP, скорость первого render и доступность без VPN/при блокировках, хотя ТЗ требует работу без VPN из РФ.
**Предлагаемый фикс:** self-hosted WOFF2 и preload с fallback.
**Объём:** маленькая правка.

### D-10. Systemd units почти не имеют hardening

**Где:** `deploy/mps-backend.service:5-12`, `mps-backup.service:4-9`, `mps-digest.service:3-6`.
**Проблема:** отсутствуют `NoNewPrivileges`, `PrivateTmp`, filesystem protections, explicit umask и ограничение writable paths. Digest не задаёт User/Group.
**Предлагаемый фикс:** hardening profile с writable allowlist для media/backups и `systemd-analyze security`.
**Объём:** требует отдельной VPS-сессии.

## Честные границы feature notes: что задокументировано, а что забыто

| Фича | Состояние границы |
|---|---|
| F02/F05 | Fakeredis и будущий Unisender transport описаны, но обещанная реальная доставка email-кода не завершена и не отмечена как оставшийся долг — C-01. |
| F05 | Unisender failure описан как логируемый, но ложный success `/subscribe`, неверный confirm URL, QA partial commit и lawyer bridge gap не отмечены — C-04, I-01–I-03. |
| F06 | Ограничение casefold/prefix search честно описано. N+1, load-all search, lock и `message_id:null` не отмечены — I-07, I-09, I-15. |
| F07 | APScheduler-in-lifespan, один instance и обязательный MiniMax key описаны. Отсутствие relay у stop-question не отмечено — I-04. |
| F08 | Premium без привилегий описан корректно. Service user/draft distortion stats не отмечен — I-17. |
| F09a1/a2 | Presentation-state был явно временным. После F09b постоянных фиктивных списков API-данных не найдено; локальный список только показывает созданный pending review до reload. |
| F09b | SQLite+fakeredis, respx и ручная browser/VPS граница описаны честно. Однако API-flow напрямую читал Redis-код, а Telegram был назван UI-элементом; реальная неработоспособность обоих login путей не зафиксирована — C-01/C-02. Дизайн/API reviews direction задокументирован корректно. |
| F10 | HSTS, отсутствие отдельного Иришка-unit и ручные VPS/DNS/certbot/pg_dump шаги описаны честно. Broken browser routes, backup executable/DSN и digest env не отмечены; staging-double smoke не мог их подтвердить — C-03, C-06, I-18. |
| Guardrails | `pip check`, respx mocks и запрет незамоканной сети реально присутствуют. Guard защищает только HTTPX-тесты и не заменяет integration/deploy verification. |

## Непокрытые тестами контракты и сценарии

Полностью отсутствуют frontend и bot_bridge test suites. В backend нет либо нет достаточного покрытия для следующих значимых сценариев:

- реальный вызов Unisender из email-code flow и failure response;
- корректность confirm href из отправленного письма;
- Telegram Widget callback → `/auth/telegram` → `/me`;
- pathname/deep-link render всех URL sitemap обычным browser user-agent;
- `/posts` filters, page boundaries и стабильный порядок;
- `PATCH /me`, синхронизация существующего profile после login;
- `GET /countries` contract и pagination/404 для forum collections;
- locked topic; notification с реальным forum `message_id`;
- Telegram failure после commit QA, retry/idempotency и lawyer private reply;
- повторный approve/answer без duplicate notifications;
- auth: future `auth_date`, banned refresh, malformed email, Redis/Unisender outage;
- content rate limiting и несколько client IP за nginx;
- concurrency likes/views/forum counters/Иришка на PostgreSQL;
- malicious `</script>` в SEO JSON-LD и остальные sanitization boundaries;
- admin self-ban, service-account exclusion и published-only top posts;
- actual `pg_dump`, restore, systemd ExecStart permissions, digest EnvironmentFile, nginx pre-cert bootstrap;
- frontend API error/retry/loading behavior, auth-dependent notifications, 120-second online polling;
- keyboard/focus/ARIA accessibility.

## Рекомендуемый порядок устранения

1. **Немедленно до production:** C-01 email-code, C-02 Telegram Widget, C-03 routing/SEO; затем C-04 confirmation link, C-05 rate limit и C-06 backup.
2. **Следующий reliability/security пакет:** I-01–I-06, I-15–I-20.
3. **Перед ростом данных/трафика:** I-07–I-09 и индексы с PostgreSQL EXPLAIN.
4. **Product completeness:** I-10–I-14.
5. **Quality program:** D-01–D-10, особенно frontend/bot_bridge tests.

До устранения C-01–C-06 проект нельзя считать production-ready, несмотря на зелёные 37 backend-тестов: текущая suite не моделирует delivery, browser routing, reverse-proxy identity и реальные systemd/pg_dump условия.
