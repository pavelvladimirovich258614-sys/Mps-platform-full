# Session handoff — 2026-08-22 F13 «Фишки»

## Текущее состояние

- F13 задеплоена на `https://mir.pod-solncem.ru`: code SHA `fff502a`, static backup `/root/backups/mps-f13-20260822T130855Z`. Отдельный shareable route `/fishki` использует существующий `Feed` и те же карточки/ссылки на авторов, но показывает только `type=tip`.
- В desktop sidebar «Фишки» возвращены между «Страны» и «Отзывы». В mobile sheet пункт тоже есть; нижняя mobile nav сохранена как Лента / Страны / Отзывы / Ещё.
- На главной ленте filters упрощены до «Все» и «Статьи». «Фишки» теперь отдельный раздел, а «Видеообзоры» временно скрыты только из UI. Backend `PostType.VIDEO_REVIEW`, API и карточка не изменялись.
- Backend, миграции и runtime `.env` не менялись; backend restart не требовался и `mps-backend` остался active.

## Верификация F13

- RED: 2 frontend tests упали до реализации — `/fishki` возвращал feed, sidebar-пункт отсутствовал. GREEN targeted: 11 passed.
- Final: frontend `npm test` — 40 passed; `npm run build` — 49 modules; full backend pytest — 58 passed in 11.45s.
- `./init.sh` вне sandbox дошёл до внешнего Hermes pre-flight и остановился на missing `charset-normalizer` для `pdfminer-six`, `reportlab`, `requests`; MPS-код и зависимости не менялись.
- Production: VITE API/bot embedded and localhost absent in served bundle; `deploy/smoke.sh` — `[OK]`; `/fishki` — 200, route/sidebar markers live, video filter marker absent. Public `/api/v1/posts` currently returns `[]`, поэтому live имеет empty state, а не карточки для наглядного фильтра.

## Возможный следующий шаг

- Наполнить платформу реальными фишками/статьями: тогда live-проверка покажет карточки раздела «Фишки» и авторские ссылки.
- После появления реальных опубликованных видеообзоров вернуть UI-tab отдельным небольшим scope. Не делать автопоказ по текущей странице ленты без надёжного API-признака.
- Либо выбрать отдельный пакет: косметика дублирования счётчиков подписок, follower list или Unisender network blocker.
