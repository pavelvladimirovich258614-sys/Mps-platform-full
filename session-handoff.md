# Session handoff — МПС

## Verified final state — 2026-08-24

Полный цикл F15–F24 завершён и deployed на `https://mir.pod-solncem.ru`; local `main`, `origin/main` и VPS синхронизированы на `9872364655cb…`.

- F15: редактирование и удаление опубликованных статей — composer prefill, PATCH, confirmation и redirect.
- F16–F21: загрузка изображений, validation, leading image carousel, удаление кадров, многократная загрузка без потери первого изображения и nginx ingress limit 11 MiB.
- F22: TipTap toolbar B/I/S (и formatter controls) реактивно пересчитывает active state по `selectionUpdate`/`transaction`.
- F23: Bold/Italic/Strike имеют `inclusive: false`; форматирование сбрасывается сразу на правой границе mark. Это осознанно отличается от стандартного поведения Word/Google Docs; ввод внутри mark и shortcuts не сломаны.
- F24: приватные черновики автора — `GET /posts/drafts`, `GET /posts/drafts/{id}`, `posts.updated_at`, draft→published через PATCH с `published_at`; composer сохраняет id первого draft и обновляет тот же Post, а не создаёт дубликат. Черновики видит только их автор.
- F24 deploy: PostgreSQL backup создан и проверен, Alembic достиг `20260824_0011`, `mps-backend` restarted/healthy, frontend rebuilt с production VITE variables, served F24 bundle и `deploy/smoke.sh` verified. Live own-draft smoke: POST 201, list/detail 200, PATCH publish 200, post подтверждён в public feed, cleanup DELETE 204.
- `init.sh` использует `python -m pip`; MPS requirements устанавливаются корректно. Остановка на global Hermes/desktop `pip check` остаётся внешней проблемой и не относится к MPS.

## Known unresolved boundary

Email remains blocked by the external Unisender/HostKey network path. Do not change email transport, credentials, firewall or VPS networking without Pavel's separate decision.

## Follow-up only when scope is approved

Foreign-draft access returns 404 in F24 automated tests. Live production verification не проводилась: на production был только один editor/admin, поэтому не создавалась вторая тестовая учётная запись. Если появится вторая тестовая editor/admin учётная запись, повторить живой smoke чужого draft → 404; это не блокирует закрытый F24 scope.

Новый продуктовый scope выбирает Павел.
