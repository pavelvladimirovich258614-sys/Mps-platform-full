# Session handoff — состояние после audit I-01, I-06a, I-13, I-15, I-16, I-18 и I-20 перед deploy

## Готовность проекта
- Backend и frontend полностью готовы к развёртыванию: F01–F10, включая последовательные этапы F09a1/F09a2/F09b, имеют статус `passing`; записей `in_progress` нет.
- Финальная локальная проверка I-20 2026-08-20: frontend tests — 6 files, 23 passed; production build успешен; полный backend pytest — 47 passed; `./init.sh` вне sandbox — `pip check` без конфликтов и 47 passed.
- Все согласованные launch blocker'ы устранены: реальная отправка email-кода через Unisender, официальный Telegram Login Widget, pathname/history routing, корректная subscribe confirm-ссылка и готовый к VPS-запуску PostgreSQL backup.
- Access JWT во frontend хранится только в памяти; refresh использует httpOnly cookie. В storage остаются только тема и cookie consent.
- Исходный Claude Design `frontend/mir-pod-solncem.dc.html` сохранён; production frontend собирается из `frontend/app`.

## Следующий шаг: VPS deploy
1. Выполнить `DEPLOY.md` по порядку, подставив реальные домен, email/TG ID и секреты. Не использовать значения из примеров как credentials.
2. Для первого TLS-запуска установить `deploy/nginx.pre-cert.conf`, заменить в нём `YOUR_DOMAIN` на реальный домен, выполнить `nginx -t`, затем `certbot certonly --webroot`; только после успеха установить `deploy/nginx.conf` и повторить `nginx -t`/reload.
3. Создать первого администратора командой `python -m app.management.create_admin` с реальными аргументами или интерактивным вводом.
4. Выпустить сертификат и проверить HTTPS; только после этого раскомментировать HSTS в `deploy/nginx.conf`.
5. В `/etc/mps-platform/backend.env` задать `PG_DUMP_URL` без `+asyncpg`, создать `/var/backups/mps` с владельцем `mps:mps` и правами `0700`. Этот же env читает `mps-digest.service`.
6. До признания backup рабочим получить `mps-backup: OK` в journal и выполнить реальный `pg_restore --list` по инструкции.
7. Запустить production smoke: `BASE_URL=https://REAL_DOMAIN POST_SLUG=REAL_POST_SLUG deploy/smoke.sh`, затем вручную пройти browser login/navigation flow.

## Архитектурные решения для эксплуатации
- Иришка работает в FastAPI lifespan; отдельный scheduler service не нужен. Не запускать несколько scheduler-инстансов без отдельной координации.
- nginx отдаёт `frontend/app/dist`, проксирует `/api`, обслуживает `/media`; HSTS намеренно выключен до подтверждённого HTTPS.
- `mps-digest.timer` и `mps-backup.timer` включаются на VPS после заполнения окружения и первого успешного ручного запуска.
- Реальные Telegram/Unisender/MiniMax, DNS, certbot, systemd и PostgreSQL backup требуют production credentials и проверяются на VPS.

## Оставшийся технический долг
- Неблокирующие замечания находятся в категориях «Важно» и «Желательно» `docs/AUDIT_REPORT.md`; они не препятствуют первому запуску.
- I-01 закрыт: при отказе Unisender `/api/v1/subscribe` возвращает `502`, а неподтверждённые подписка и confirm-token сохраняются для повторной отправки.
- I-06a закрыт: JSON-LD Article кодирует `<`, `>` и `&` перед вставкой в script-tag, поэтому данные поста не могут закрыть JSON-LD script. I-06b остаётся открытым: единая sanitization полей требует решения о допустимом содержимом.
- I-13 закрыт: после email/Telegram login та же смонтированная Profile-модалка синхронизирует поля по новому `user.id`; сохранённый профиль не может быть затёрт пустыми defaults.
- I-15 закрыт: закрытая forum-тема отклоняет новые сообщения с `423`; notification открытой темы содержит фактический `message_id`.
- I-16 закрыт: одинаковые retry moderation/QA не создают duplicate notifications; противоречащие final state/QA-payload получают `409`, а QA сравнивается только по точному тексту и автору.
- I-18 закрыт в репозитории: pre-cert nginx template не требует certificate files, а digest запускается от `mps:mps` с `/etc/mps-platform/backend.env`. Реальные `nginx`, certbot и systemd остаются ручной VPS-проверкой.
- I-20 закрыт: миграция `20260820_0008_public_legal_settings` при `alembic upgrade head` создаёт на чистой VPS БД шесть официальных публичных settings, включая ОГРН; admin API может обновлять их позже. Whitelist `GET /api/v1/settings/public` не раскрывает CTA/Irishka. Footer/About и privacy page используют settings, без фиктивных fallback.
- I-21 отложен до pre-launch юридической проверки: накопленных пользовательских данных, аналитики, рекламы и tracking cookies нет; policy, реквизиты оператора и UI-согласие уже есть. Перед публичным запуском после консультации с юристом предпочесть backend-хранение `consent_given_at`/`consent_version` и определить policy для стартовых API-запросов и cookies.
- C-05 исторически остаётся в разделе «Критично», но по явному решению Павла вынесен в отдельную security-задачу и не входил в последние launch-blocker фиксы.
- Deploy по `DEPLOY.md` по-прежнему можно начать вручную на VPS. После создания администратора задать публичные реквизиты через защищённый admin API; не передавать их через Codex. Следующая согласованная audit-задача — I-19a (email validation); I-19b и I-06b требуют отдельных продуктовых решений перед кодом.

## Основные команды
- Полная backend-проверка: `cd backend && python -m pytest`
- Стандартная проверка: `./init.sh`
- Frontend: `cd frontend/app && npm install && npm test && npm run build`
- Dev backend: `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Dev frontend: `cd frontend/app && npm run dev -- --host 127.0.0.1`
