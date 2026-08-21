# Session handoff — 2026-08-21 production checkpoint

## Текущее подтверждённое состояние
- MPS Platform работает на `https://mir.pod-solncem.ru`: isolated PostgreSQL/Redis, backend `127.0.0.1:8001` за nginx, TLS/HSTS, systemd backend/digest/backup, `deploy/smoke.sh` successful.
- Production revision: `4ef4a07`. После deploy `mps-backend.service` перезапущен, health вернул `status: ok`, service active. Перед deploy сохранён recoverable archive прежнего `backend/app`.
- Frontend production build использует настоящий API URL и Auth-бота; устранены localhost API calls, Telegram widget configuration issue, Profile logout/avatar/name/online UI, а также невидимый toast/error email flow.
- UnisenderGo code uses `goapi.unisender.ru` by default and `X-API-KEY`; `go1`/`go2` remain valid explicit env overrides. Тело email/send не менялось и соответствует verified transport contract.

## Обязательная ручная проверка Павлом
1. Вне чата внести перевыпущенный `UNISENDER_GO_API_KEY` и корректный `UNISENDER_FROM_EMAIL` в `/etc/mps-platform/backend.env`, если это ещё не сделано; не записывать значения в Git, trackers или chat.
2. После подтверждения внесения значения перезапустить только `mps-backend.service` и выполнить smoke.
3. В browser проверить получение email-кода и полный email login. До этой проверки нельзя считать реальную доставку email подтверждённой, хотя код и mocked transport contract готовы.
4. В browser пройти Telegram Login Widget и Profile regression smoke: logout, avatar, name вместо role, gold online indicator и visible error toast.

## Следующая разработка
Публичная страница профиля обсуждалась, но не начиналась. Перед любыми изменениями подготовить отдельный план с файлами, рисками, RED-тестом и верификацией; после явного подтверждения реализовать её отдельным commit/push/deploy.

## Открытые boundary
- Audit: I-06b, I-19a/I-19b и C-05 остаются открытыми; I-21 отложен до pre-launch юридической проверки.
- VPS использует Python `3.11.0rc1`; нужен отдельный контролируемый переход на stable Python 3.11+.
- Relay/manager/lawyer production env поля по-прежнему требуют out-of-band configuration. Не передавать secrets, Telegram IDs или содержимое `.env` через чат.
