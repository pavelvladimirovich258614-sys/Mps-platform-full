# Session handoff — production checkpoint после VPS deploy

## Текущее production-состояние
- MPS Platform работает на `https://mir.pod-solncem.ru`.
- VPS-развёртывание изолировано: `/opt/mps-platform`, системный пользователь `mps`, PostgreSQL DB `mps_platform` с отдельной ролью, Redis DB 2 и backend на `127.0.0.1:8001` за nginx.
- Production nginx, TLS-сертификат, HSTS, публичные `/sitemap.xml` и `/robots.txt` активны. `deploy/smoke.sh` прошёл на live-домене.
- Alembic применён до `20260820_0008`. Один администратор создан из server-side `ADMIN_TG_ID`; этот ID нельзя раскрывать или передавать через чат.
- `mps-backend.service`, `mps-digest.timer`, `mps-backup.timer`, `postgresql`, `redis-server` и `certbot.timer` включены и active. Автопродление certbot подтверждено адресным dry-run.
- Первый PostgreSQL backup успешно создал непустой читаемый архив в `/var/backups/mps` и нацелен только на MPS БД.

## Незавершённые production env-поля

Эти server-поля остаются незаполненными. Заполнять их нужно напрямую в `/etc/mps-platform/backend.env`, никогда не в чате и не в Git:

- `RELAY_BOT_TOKEN`
- `MANAGERS_CHAT_ID`
- `LAWYER_TG_ID`
- `BOT_BRIDGE_SECRET`
- `UNISENDER_GO_API_KEY`
- `UNISENDER_FROM_EMAIL`

После изменения env перезапускать только относящийся MPS service и подтверждать его работу. `MINIMAX_API_KEY` был задан на deploy; его реальное end-to-end поведение нужно проверить при приёмке, а не считать незаполненным полем.

## Legal и audit-состояние
- I-18 и I-20 закрыты и подтверждены в production.
- I-21 отложен до pre-launch юридической проверки: перед публичным запуском проконсультироваться с юристом, предпочесть backend-хранение `consent_given_at` / `consent_version` и определить policy для стартовых API-запросов и cookies.
- Legal page содержит утверждённые Политику обработки персональных данных и Пользовательское соглашение; реквизиты оператора по-прежнему загружаются из public settings.
- I-06b, I-19a/I-19b и C-05 остаются отдельными задачами. Не менять их мимоходом.

## Известный операционный технический долг
- MPS venv на VPS использует уже установленный Python `3.11.0rc1`, потому что системный Python 3.10 не поддерживает используемый кодом `datetime.UTC`. Предыдущий Python-3.10 venv сохранён как recoverable `/opt/mps-platform/venv.py310.failed`.
- Нужен плановый контролируемый переход на поддерживаемый stable Python 3.11+. После него пересоздать MPS venv, перезапустить только `mps-backend.service` и повторить live smoke.

## Следующее действие
1. Павел напрямую заполняет перечисленные Relay/Unisender server env-поля.
2. Выполнить ручную сквозную приёмку по `docs/TZ.md` §7: email login, Telegram Login Widget, подписка/Unisender, Relay flows, MiniMax/Irishka, moderation, profile и SEO post flow.
3. Не передавать секреты, Telegram ID и production env-значения в чат, source control или session trackers.
