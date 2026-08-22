# Session handoff — 2026-08-22

## Текущее подтверждённое состояние

- Production: `https://mir.pod-solncem.ru`, revision `8f8978c`; frontend развёрнут с production `VITE_API_URL` и `VITE_TELEGRAM_BOT_USERNAME`, `mps-backend` active, `deploy/smoke.sh` прошёл.
- F14 завершён и задеплоен: TipTap rich-text composer доступен editor/admin через modal, а не показывается inline в ленте. Bold-space regression устранён штатным TipTap `onUpdate`; серверная nh3 allowlist и клиентская DOMPurify-защита сохраняются.
- Последующие UI-правки задеплоены: общий подзаголовок ленты, удаление `fishka` из composer, единый заголовок «Статьи» вместо фильтра и CTA «Подобрать тур в боте» после комментариев на полной статье.
- Миграция `20260822_0010` применена на production PostgreSQL. `comments_moderation_enabled=false`: новые комментарии сразу `approved` и видны через GET. Admin может переключать policy через `PATCH /admin/settings`; при `true` UI подтверждает отправку на проверку. Reviews не менялись.
- Локальная финальная верификация для этого пакета: SQLite migration clean, backend pytest — 61 passed, frontend — 15 suites / 51 tests passed, `npm run build` success. `./init.sh` по-прежнему останавливается на внешнем Hermes `pip check` из-за missing `charset-normalizer`, не из-за MPS.

## Следующий шаг — только диагностика лайков

Диагностировать отсутствие лайков на опубликованных статьях — последний не начатый пункт из списка находок Павла. Начать read-only: воспроизвести UI/API-путь, проверить запрос/ответ, состояние `post_likes` и правила видимости. Не менять комментарии, CTA, carousel или бизнес-логику лайков без подтверждённой причины и отдельного плана.
