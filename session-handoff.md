# Session handoff — 2026-08-22 final production checkpoint

## Текущее подтверждённое состояние
- MPS Platform работает на `https://mir.pod-solncem.ru`: isolated PostgreSQL/Redis, backend `127.0.0.1:8001` за nginx, TLS/HSTS, systemd backend/digest/backup. После последних backend deploy `mps-backend` active/healthy, `deploy/smoke.sh` successful.
- Production backend revision: `7e8eb07`. Публичный профиль, часть А, работает: `GET /api/v1/users/{id}/profile` возвращает 200 и только public fields; вкладка «Публикации» использует профиль автора.
- Telegram Login работает. Production ORM role storage читает одновременно legacy upper-case enum names (например, `ADMIN`) и новые lower-case values (например, `editor`) без миграции PostgreSQL; safe live callback для legacy user вернул 200.
- Production frontend использует `https://mir.pod-solncem.ru/api/v1` и `Reg_Under_the_sun_bot`. Закрыты UI regression fixes: logout, avatar upload, real name instead of role, gold online indicator, visible toast over modal и `type=email`.
- Раздача `/media/` nginx исправлена: alias без conflicting `try_files`, `^~` имеет precedence, каталог доступен backend для записи и nginx для чтения.

## Единственный активный внешний блокер
- Email-код и digest **не работают на production** из-за ConnectTimeout VPS к сети Unisender `31.184.200.*:443` (goapi/go1). Код, `goapi` default, `X-API-KEY` и production config проверены; local UFW/iptables не блокируют outgoing traffic, ya.ru/google.com доступны.
- Следующий шаг: тикет HostKey по selective egress timeout либо отдельное согласованное решение SMTP/другого provider. Не менять firewall VPS без отдельного разрешения.

## Открытые boundary
- Audit: I-06b, I-19a/I-19b и C-05 остаются открытыми; I-21 отложен до pre-launch юридической проверки.
- VPS использует Python `3.11.0rc1`; нужен отдельный контролируемый переход на stable Python 3.11+.
- Локальный `./init.sh` может блокироваться до project tests внешним Hermes `pip check`: `pdfminer-six`, `reportlab` и `requests` не видят `charset-normalizer`. Это не MPS runtime/production проблема; не чинить Hermes-зависимости в задачах MPS.
