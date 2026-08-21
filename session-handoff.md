# Session handoff — 2026-08-21 production checkpoint

## Текущее подтверждённое состояние
- MPS Platform работает на `https://mir.pod-solncem.ru`: isolated PostgreSQL/Redis, backend `127.0.0.1:8001` за nginx, TLS/HSTS, systemd backend/digest/backup, `deploy/smoke.sh` successful.
- Production revision: `4ef4a07`. После deploy `mps-backend.service` перезапущен, health вернул `status: ok`, service active. Перед deploy сохранён recoverable archive прежнего `backend/app`.
- Frontend production build использует настоящий API URL и Auth-бота; устранены localhost API calls, Telegram widget configuration issue, Profile logout/avatar/name/online UI, а также невидимый toast/error email flow.
- UnisenderGo code uses `goapi.unisender.ru` by default and `X-API-KEY`; `go1`/`go2` remain valid explicit env overrides. Тело email/send не менялось и соответствует verified transport contract.
- **Открытый внешний блокер:** VPS получает ConnectTimeout к `goapi` и `go1` на `31.184.200.*:443`; email-код и digest не могут быть доставлены. Local UFW/iptables не блокируют outgoing traffic, а `ya.ru` и `google.com` доступны. До ответа HostKey/Unisender реальную доставку email считать недоступной.

## Обязательная ручная проверка Павлом
1. Открыть тикет HostKey: selective outbound TCP timeout до `31.184.200.*:443` при рабочем HTTPS к ya.ru/google.com. Не менять firewall VPS без отдельного согласования.
2. После восстановления связности вручную проверить получение email-кода и полный email login; до этого email-code и digest остаются недоступными независимо от корректности ключа/config.
3. Рассмотреть SMTP-транспорт UnisenderGo или другого email-провайдера как отдельную согласованную работу, если сетевой маршрут не будет восстановлен.
4. В browser пройти Telegram Login Widget и Profile regression smoke: logout, avatar, name вместо role, gold online indicator и visible error toast.

## Следующая разработка
Публичная страница профиля обсуждалась, но не начиналась. Перед любыми изменениями подготовить отдельный план с файлами, рисками, RED-тестом и верификацией; после явного подтверждения реализовать её отдельным commit/push/deploy.

## Открытые boundary
- Audit: I-06b, I-19a/I-19b и C-05 остаются открытыми; I-21 отложен до pre-launch юридической проверки.
- VPS использует Python `3.11.0rc1`; нужен отдельный контролируемый переход на stable Python 3.11+.
- Relay/manager/lawyer production env поля по-прежнему требуют out-of-band configuration. Не передавать secrets, Telegram IDs или содержимое `.env` через чат.

## Известное ограничение среды разработки
- Локальный `./init.sh` сейчас может завершаться на глобальном Hermes Python `pip check`: внешним пакетам `pdfminer-six`, `reportlab` и `requests` не хватает `charset-normalizer`. Это не относится к зависимостям или runtime MPS Platform и не является production-блокером; не чинить Hermes-зависимости в рамках задач MPS.
