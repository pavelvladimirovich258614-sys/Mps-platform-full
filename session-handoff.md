# Session handoff — 2026-08-23

## Подтверждённое состояние

- F01–F20 имеют статус `passing`; F20 — локальный frontend-only hotfix, production deploy не выполнялся.
- F20 исправляет repeated upload в TipTap composer: `setImage` и reposition selection выполняются одной chain. После вставленного block image выбирается ближайшая text selection впереди, а на конце документа используется `GapCursor`; затем существующий `groupAdjacentImages` формирует строгий `figure[data-carousel="images"]`.
- RED воспроизвёл production-дефект: browser-like `NodeSelection` + две последовательные toolbar-загрузки оставляли только второй img. GREEN сохраняет оба URL; третья загрузка также сохраняет существующие кадры.
- Regression coverage: одиночный img без carousel wrapper, вставка в середину с сохранением текста до/после, удаление standalone image и активного carousel image.
- Final local verification: related frontend — 3 files / 16 passed; full frontend — 15 files / 72 passed; build — success, 114 modules; full backend — 63 passed in 14.19s. `./init.sh` вне sandbox остановился до MPS tests только на согласованном внешнем Hermes pip check missing `charset-normalizer`.
- Production остаётся на frontend F19 revision `d46d786`; последний rollout проверил production VITE markers, served bundle и `deploy/smoke.sh`, backend оставался active без restart. Live F19 smoke выявил закрываемый F20 дефект; временная статья и пять media-файлов были удалены.
- Backend, sanitizer, `ImageCarouselNode`, dependencies и database в F20 не менялись.
- `comments_moderation_enabled=false`; отдельный сетевой блокер Unisender не трогать.

## Следующее действие

1. Дождаться отдельного подтверждения на push и frontend-only production deploy F20.
2. После deploy выполнить authenticated browser smoke: два раза подряд «Вставить изображение → выбрать файл» без End/ArrowRight должны показать editor carousel с обоими кадрами; затем проверить published carousel и удалить временную статью/media.
3. Drag-and-drop, paste insertion, reorder и autoplay не начинать без нового продуктового решения.

## Наблюдение вне scope

- На VPS ранее наблюдались untracked `.deploy-backups/`, `frontend/app/.env.production`, `venv.py310.failed/` и каталог `\/`. Их не удалять и не изменять без отдельного read-only расследования и подтверждения.
