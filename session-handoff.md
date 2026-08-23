# Session handoff — 2026-08-24

## Подтверждённое состояние

- F01–F21 имеют статус `passing`; F21 завершена локально и production deploy не выполнялся.
- Точная причина upload-ошибки: production nginx отклоняет допустимые `/api/v1/media` multipart requests больше default 1m с HTML `413 Request Entity Too Large` до FastAPI. Один и тот же token дал первый PNG `200`, второй валидный PNG 7 692 467 B — `413`; backend journal увидел только первый запрос и не содержал ошибок.
- `deploy/nginx.conf` теперь содержит `client_max_body_size 11m;`. Backend endpoint и его raw-file limit 10 MiB не менялись: oversized content по-прежнему должен доходить до FastAPI и возвращать русский JSON 422.
- RichTextEditor больше не использует текущую selection для image insertion. Первый img вставляется в позицию 0; существующая непрерывная начальная img/imageCarousel-группа flatten-ится и получает новый кадр в конце одной карусели. Текст остаётся ниже.
- RED/GREEN: nginx contract — 1 failed / 2 passed → backend/deploy targeted 10 passed; frontend middle/end/leading-group — 3 failed / 6 passed → 9 passed. Related frontend regression — 3 files / 17 passed.
- Final local verification: backend — 65 passed in 19.54s; frontend — 15 files / 73 passed; build — success, 114 modules и только стандартный chunk warning. `./init.sh` вне sandbox остановился до MPS tests только на согласованном внешнем Hermes pip check missing `charset-normalizer`.
- Production остаётся на F20 revision `aac5536`: live smoke ранее подтвердил одну карусель после 2/3 последовательных toolbar-upload без движения курсора; временная статья и media удалены. F21 nginx/frontend изменения ещё не применены.
- Dependencies, database, sanitizer и backend media implementation в F21 не менялись. `comments_moderation_enabled=false`; внешний сетевой блокер Unisender не трогать.

## Следующее действие

1. Дождаться отдельного подтверждения владельца на push и production deploy F21.
2. Перед nginx change создать backup активного MPS server block, применить только F21 directive, выполнить `nginx -t`, затем reload с rollback при ошибке. Backend restart не нужен.
3. Пересобрать frontend с проверенными production `VITE_API_URL` и `VITE_TELEGRAM_BOT_USERNAME`.
4. Live smoke: два последовательных toolbar upload одним session, второй валидный файл >1 MiB, оба POST должны вернуть 200; media должна оказаться одной каруселью в начале статьи. Опубликовать, проверить renderer, затем удалить временную статью и точные media-файлы.

## Наблюдение вне scope

- На VPS ранее наблюдались untracked `.deploy-backups/`, `frontend/app/.env.production`, `venv.py310.failed/` и каталог `\/`. Их не удалять и не изменять без отдельного read-only расследования и подтверждения.
- Drag-and-drop, paste insertion, reorder и autoplay не начинать без нового продуктового решения.
