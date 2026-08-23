# Session handoff — МПС

## Verified final state — 2026-08-24

Composer и карусель полностью функциональны и проверены вживую на production `https://mir.pod-solncem.ru` на revision `ada1f52`.

- Editor/admin может создавать, редактировать (prefill + PATCH) и удалять опубликованные статьи (confirmation + DELETE/redirect).
- TipTap загружает JPEG/PNG/WebP через `POST /api/v1/media`; nginx допускает multipart до 11m, backend сохраняет raw-file limit 10 MiB и 422-валидацию.
- Повторные загрузки формируют одну карусель из нескольких изображений; она работает и в editor preview, и на опубликованной странице с Prev/Next/точками. Изображение или активный кадр удаляется крестиком.
- Новые изображения всегда попадают в начало документа; последующие расширяют ту же leading-карусель независимо от позиции курсора. Текст статьи остаётся ниже.
- F15–F21 прошли RED→GREEN, полные backend/frontend suites и production smoke; temporary production posts/media live-checks удалены.

## Known unresolved boundary

Email по-прежнему заблокирован внешней сетью к Unisender/HostKey. Не менять email transport, credentials, firewall или VPS networking без отдельного решения Павла.

## Next step

Следующий scope не определён. Выбор остаётся за Павлом при старте следующей сессии.
