# Session handoff — МПС

## Verified final state — 2026-08-24

F01–F22 passing локально; production остаётся на `ada1f52` без F22 до отдельного approval.

- Composer toolbar теперь реактивно обновляет B/I/S, H1–H3, списки, цитату и link по TipTap `selectionUpdate`/`transaction`. Bold/italic после перехода в обычный текст не наследуются новым вводом; toggle-команды и stored HTML не менялись.
- F15 edit UX проверен регрессией: editor/admin получает prefill, PATCH, delete confirmation и redirect; `PostComposer`, `ArticleComments` и `App.routing` зелёные.
- Composer/cарусель production-state прежний и подтверждён: media JPEG/PNG/WebP, 11m nginx ingress / 10 MiB backend limit, leading-карусель, edit/delete статей, likes/comments/profile.
- F22 RED→GREEN; full frontend 15 files / 76 passed, build success (114 modules), backend 65 passed. `./init.sh` с корректным Hermes venv останавливается только на внешнем pip check missing charset-normalizer.

## Known unresolved boundary

Email по-прежнему заблокирован внешней сетью к Unisender/HostKey. Не менять email transport, credentials, firewall или VPS networking без отдельного решения Павла.

## Next step

Дождаться отдельного approval Павла для frontend-only deployment F22 и authenticated composer smoke. Следующий product scope отдельно выбирает Павел.
