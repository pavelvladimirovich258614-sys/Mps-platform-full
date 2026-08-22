# Session handoff — 2026-08-22 F14 rich-text редактор

## Текущее состояние

- Локально проверен и pushed, но ещё не задеплоен hotfix `7da63d4`: из `RichTextEditor` удалён ручной `onInput → setContent(innerHTML)`, который сбрасывал ProseMirror transaction state и ломал пробел в Bold-режиме. Теперь синхронизация идёт только через штатный TipTap `onUpdate`. Также обновлён подзаголовок ленты; в composer остался только тип «Статья», а `fishka` убрана и из общего `PostDraft`. Frontend `npm test` — 48 passed, build success; для production требуется отдельное подтверждение.
- F14 composer hotfix задеплоен на production: VPS revision `17a1a2d`, rollback static dist `/root/backups/mps-f14-composer-modal-20260822T143700Z`. Editor/admin больше не видит composer инлайн: компактная золотая кнопка «Создать публикацию» открывает TipTap в modal overlay; закрытие работает по Escape, клику на фон и «×». Новый bundle содержит production VITE API/bot values и не содержит localhost API. Backend diff пуст, поэтому `mps-backend` не рестартовался и остаётся active; `deploy/smoke.sh` — `[OK]`.
- `post.body` хранит HTML только для новых rich-text постов. Server-side nh3 allowlist допускает ровно `p/br/strong/em/s/h1-h3/ul/ol/li/blockquote/a[href]/img[src,alt]`; client-side DOMPurify повторяет фильтрацию при чтении в Feed, full article и PublicProfile. Старые plain/Markdown body остаются escaped plaintext с переносами; миграция БД не требуется.
- Final F14: frontend `npm test` — 44 passed; `npm run build` — 110 modules success; backend full pytest — 59 passed. `./init.sh` остановился только на известном внешнем Hermes `charset-normalizer` pre-flight, до MPS pytest. Production `deploy/smoke.sh` — `[OK]`; direct authenticated HTTPS API smoke saved `<p>test</p>` and stripped script, then independently confirmed cleanup. Visual browser check не выполнен: agent-browser CLI отсутствует в среде после попытки запуска; не подменять это утверждением о screenshot-проверке.

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

- Павел может вручную войти editor-ролью и создать первую реальную публикацию, чтобы оценить writing UX на production.
- Следующая editor-фаза: безопасная загрузка изображений (HTML allowlist уже содержит `img`, но upload/UI не реализованы), preview, редактирование черновиков, autosave, embeds и более полный Substack-like workflow — только отдельными пакетами.

- Наполнить платформу реальными фишками/статьями: тогда live-проверка покажет карточки раздела «Фишки» и авторские ссылки.
- После появления реальных опубликованных видеообзоров вернуть UI-tab отдельным небольшим scope. Не делать автопоказ по текущей странице ленты без надёжного API-признака.
- Либо выбрать отдельный пакет: косметика дублирования счётчиков подписок, follower list или Unisender network blocker.
