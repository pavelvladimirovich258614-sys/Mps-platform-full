# Session handoff — 2026-08-22 F13 «Фишки»

## Текущее состояние

- Локально завершена F13: отдельный shareable route `/fishki` использует существующий `Feed` и те же карточки/ссылки на авторов, но показывает только `type=tip`.
- В desktop sidebar «Фишки» возвращены между «Страны» и «Отзывы». В mobile sheet пункт тоже есть; нижняя mobile nav сохранена как Лента / Страны / Отзывы / Ещё.
- На главной ленте filters упрощены до «Все» и «Статьи». «Фишки» теперь отдельный раздел, а «Видеообзоры» временно скрыты только из UI. Backend `PostType.VIDEO_REVIEW`, API и карточка не изменялись.
- Backend, миграции, `.env` и production не трогались.

## Верификация F13

- RED: 2 frontend tests упали до реализации — `/fishki` возвращал feed, sidebar-пункт отсутствовал. GREEN targeted: 11 passed.
- Final: frontend `npm test` — 40 passed; `npm run build` — 49 modules; full backend pytest — 58 passed in 11.45s.
- `./init.sh` вне sandbox дошёл до внешнего Hermes pre-flight и остановился на missing `charset-normalizer` для `pdfminer-six`, `reportlab`, `requests`; MPS-код и зависимости не менялись.

## Следующий разрешённый шаг

- Дождаться отдельного подтверждения Павла на frontend-only production deploy F13. При deploy: собрать `frontend/app` с production `VITE_API_URL` и `VITE_TELEGRAM_BOT_USERNAME`, проверить их в bundle и отсутствие localhost URL, обновить только static `dist`, затем `deploy/smoke.sh`. Backend restart и Alembic не нужны.
- После появления реальных опубликованных видеообзоров вернуть UI-tab отдельным небольшим scope. Не делать автопоказ по текущей странице ленты без надёжного API-признака.
