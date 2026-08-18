# Деплой «Мир под солнцем»

Ниже команды рассчитаны на Ubuntu VPS и выполняются под пользователем с sudo. Секреты не вставляйте в shell history и не коммитьте.

## Подготовка сервера

1. Установите пакеты: `sudo apt update && sudo apt install nginx certbot python3-certbot-nginx postgresql-client redis-server`.
2. Создайте пользователя и каталог: `sudo useradd --system --create-home --shell /usr/sbin/nologin mps`; затем разверните репозиторий в `/opt/mps-platform`, создайте `/opt/mps-platform/venv` и установите `backend/requirements.txt`.
3. Создайте `/etc/mps-platform/backend.env` с правами `640`, владельцем `root:mps`. Задайте реальные `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, Telegram/Unisender/MiniMax настройки, `BASE_URL=https://YOUR_DOMAIN`, `CORS_ORIGINS=https://YOUR_DOMAIN` и `FRONTEND_DIST_DIR=/opt/mps-platform/frontend/app/dist`.
4. Соберите frontend: `cd /opt/mps-platform/frontend/app && npm ci && npm run build`.
5. Выполните миграции: `cd /opt/mps-platform/backend && /opt/mps-platform/venv/bin/alembic upgrade head`.

## Домен и HTTPS

1. У старого сайта замените A-запись домена и `www` на IP VPS. Дождитесь распространения DNS.
2. Сначала установите HTTP-конфигурацию nginx и проверьте challenge: `sudo nginx -t && sudo systemctl reload nginx`.
3. Выпустите сертификат: `sudo certbot --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN`.
4. Проверьте `https://YOUR_DOMAIN` в браузере и `curl -sI https://YOUR_DOMAIN`.

> **ВНИМАНИЕ: не включайте `Strict-Transport-Security` до первого успешного certbot и проверки HTTPS.** HSTS заставляет браузер требовать HTTPS; при ошибочном сертификате нельзя будет безопасно вернуться на HTTP. В шаблоне nginx директива намеренно закомментирована. Раскомментируйте её только после успешной проверки, затем `sudo nginx -t && sudo systemctl reload nginx`.

## Services, digest и backup

1. Скопируйте `deploy/mps-backend.service`, `mps-digest.service`, `mps-digest.timer`, `mps-backup.service`, `mps-backup.timer` в `/etc/systemd/system/`.
2. `sudo systemctl daemon-reload && sudo systemctl enable --now mps-backend mps-digest.timer mps-backup.timer`.
3. Иришка запускается внутри FastAPI lifespan, поэтому отдельный `mps-scheduler.service` намеренно отсутствует. Держите ровно один backend instance, иначе задача продублируется.
4. Проверьте: `systemctl status mps-backend mps-digest.timer mps-backup.timer`; первый backup можно выполнить `sudo systemctl start mps-backup`.

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
