# P10 — Сессия Codex: деплой, домен, SEO, юр-обвязка (фича F10)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F10**. Прочитай TZ §3 F-J, §4; BACKEND_SPEC §1 (deploy/).

Сделай:
1. deploy/nginx.conf: домен, https (certbot), / → статика frontend/dist, /api → uvicorn upstream, /media → каталог медиа, gzip, кэш статики, HSTS.
2. deploy/mps-backend.service, deploy/mps-scheduler.service (если планировщик вынесен), deploy/backup.sh (pg_dump в /var/backups/mps, ротация 14 дней) + cron/timer.
3. SEO: эндпоинты /sitemap.xml (посты+страны+статичные) и /robots.txt на бекенде; OG-теги и метатеги для страниц постов — через пререндер-мидлвар для ботов (user-agent сниффинг: отдать HTML с мета) ЛИБО vite-plugin — выбери одно решение, объясни выбор в notes.
4. Микроразметка Article (JSON-LD) на страницах публикаций.
5. DEPLOY.md: пошаговая инструкция для Павла — установка на VPS, перенос домена со старого сайта (A-запись), выпуск сертификата, первый суперпользователь (management-команда create_admin), регистрация в Яндекс.Вебмастер и Google Search Console (чек-лист ручных шагов).
6. Верификация F10 по feature_list (боевые curl-проверки выполняет Павел после реального деплоя — подготовь скрипт deploy/smoke.sh, который гоняет их одной командой; в evidence — локальный прогон smoke.sh против staging).

Заверши по AGENTS.md.
