# Деплой «Мир под солнцем»

Ниже команды рассчитаны на Ubuntu VPS и выполняются под пользователем с sudo. Секреты не вставляйте в shell history и не коммитьте.

## Подготовка сервера

1. Установите пакеты: `sudo apt update && sudo apt install nginx certbot python3-certbot-nginx postgresql-client redis-server`.
2. Создайте пользователя и каталог: `sudo useradd --system --create-home --shell /usr/sbin/nologin mps`; затем разверните репозиторий в `/opt/mps-platform`, создайте `/opt/mps-platform/venv` и установите `backend/requirements.txt`.
3. Создайте `/etc/mps-platform/backend.env` с правами `640`, владельцем `root:mps`. Задайте реальные `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, Telegram/Unisender/MiniMax настройки, `BASE_URL=https://YOUR_DOMAIN`, `CORS_ORIGINS=https://YOUR_DOMAIN` и `FRONTEND_DIST_DIR=/opt/mps-platform/frontend/app/dist`. Для backup обязательно добавьте отдельный `PG_DUMP_URL=postgresql://USER:PASSWORD@HOST:5432/DB`: это libpq URL без драйвера `+asyncpg`, в отличие от application `DATABASE_URL`.
4. Перед сборкой frontend создайте `/opt/mps-platform/frontend/app/.env.production` и задайте публичные build-time переменные `VITE_API_URL=https://YOUR_DOMAIN/api/v1` и `VITE_TELEGRAM_BOT_USERNAME=REAL_BOT_USERNAME` (username без `@`, не токен бота). Затем выполните `cd /opt/mps-platform/frontend/app && npm ci && npm run build`.
5. Выполните миграции: `cd /opt/mps-platform/backend && /opt/mps-platform/venv/bin/alembic upgrade head`.

> Переменные `VITE_*` встраиваются в статические файлы на этапе сборки. При смене Telegram-бота или API URL нужен полный повторный `npm run build`; простого перезапуска backend/nginx недостаточно.

## Домен и HTTPS

1. У старого сайта замените A-запись домена и `www` на IP VPS. Дождитесь распространения DNS.
2. Установите bootstrap-конфигурацию **до** получения сертификата: создайте challenge-каталог `sudo install -d -m 0755 /var/www/certbot`, скопируйте `deploy/nginx.pre-cert.conf` в nginx site, подставьте в нём ваш домен вместо каждого `YOUR_DOMAIN`, включите site и выполните `sudo nginx -t && sudo systemctl reload nginx`. Этот шаблон обслуживает только HTTP и ACME challenge; в нём нет ссылок на certificate files.
3. Выпустите сертификат через webroot: `sudo certbot certonly --webroot -w /var/www/certbot -d YOUR_DOMAIN -d www.YOUR_DOMAIN`.
4. Только после успешного certbot замените bootstrap site на `deploy/nginx.conf`, подставьте ваш домен вместо каждого `YOUR_DOMAIN`, затем выполните `sudo nginx -t && sudo systemctl reload nginx`.
5. Проверьте `https://YOUR_DOMAIN` в браузере и `curl -sI https://YOUR_DOMAIN`.

> **ВНИМАНИЕ: не включайте `Strict-Transport-Security` до первого успешного certbot и проверки HTTPS.** HSTS заставляет браузер требовать HTTPS; при ошибочном сертификате нельзя будет безопасно вернуться на HTTP. В шаблоне nginx директива намеренно закомментирована. Раскомментируйте её только после успешной проверки, затем `sudo nginx -t && sudo systemctl reload nginx`.

## Services, digest и backup

1. Скопируйте `deploy/mps-backend.service`, `mps-digest.service`, `mps-digest.timer`, `mps-backup.service`, `mps-backup.timer` в `/etc/systemd/system/`.
2. До запуска timer создайте закрытый writable-каталог: `sudo install -d -o mps -g mps -m 0700 /var/backups/mps`.
3. Выполните `sudo systemctl daemon-reload && sudo systemctl enable --now mps-backend mps-digest.timer mps-backup.timer`.
4. Иришка запускается внутри FastAPI lifespan, поэтому отдельный `mps-scheduler.service` намеренно отсутствует. Держите ровно один backend instance, иначе задача продублируется.
5. Проверьте units: `systemctl status mps-backend mps-digest.timer mps-backup.timer`. Backup запускается через `/usr/bin/bash`, поэтому executable bit у `deploy/backup.sh` не требуется.
6. Обязательно выполните первый реальный backup: `sudo systemctl start mps-backup.service`, затем `sudo systemctl status --no-pager mps-backup.service` и `sudo journalctl -u mps-backup.service -n 50 --no-pager`. Успех содержит `mps-backup: OK`; при отсутствии `PG_DUMP_URL`, `pg_dump` или прав журнал содержит конкретное `mps-backup: ERROR`, которое нужно исправить до продолжения деплоя.
7. Убедитесь, что дамп непустой: `sudo find /var/backups/mps -type f -name 'mps-*.dump.gz' -size +0 -print`. Проверьте читаемость последнего файла: `sudo bash -o pipefail -c 'gzip -dc "$(find /var/backups/mps -type f -name "mps-*.dump.gz" | sort | tail -1)" | pg_restore --list >/dev/null'`. Скрипт ежедневно удаляет дампы старше 14 дней (`-mtime +13`).

## Первый администратор

После миграций создайте администратора по реальному email или Telegram ID:

```bash
cd /opt/mps-platform/backend
/opt/mps-platform/venv/bin/python -m app.management.create_admin --email REAL_EMAIL --name "Павел"
```

Команда также умеет интерактивный ввод и `--tg-id`. В модели МПС нет парольной авторизации: вход происходит по email-коду или Telegram Login. Не используйте строки `YOUR_DOMAIN`, `REAL_EMAIL` или любые примеры из этой инструкции буквально; сразу задайте реальные данные и секреты окружения.

## Ручные SEO шаги

1. В Яндекс.Вебмастере добавьте сайт, подтвердите владение выбранным способом, отправьте `https://YOUR_DOMAIN/sitemap.xml`.
2. В Google Search Console добавьте property, подтвердите DNS/HTML способом, отправьте тот же sitemap.
3. После публикации поста проверьте `curl -A Googlebot https://YOUR_DOMAIN/posts/SLUG | grep og:title`.

## Smoke после деплоя

После HSTS и создания опубликованного поста выполните:

```bash
cd /opt/mps-platform
BASE_URL=https://YOUR_DOMAIN POST_SLUG=REAL_POST_SLUG deploy/smoke.sh
```

Проверьте свежий файл в `/var/backups/mps/`. Реальная VPS-проверка сертификата, systemd, PostgreSQL backup и DNS выполняется владельцем инфраструктуры после развёртывания.
