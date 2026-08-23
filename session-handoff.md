# Session handoff — 2026-08-23

## Подтверждённое состояние

- Production `https://mir.pod-solncem.ru`: frontend code revision `d042d46`; likes UI deployed; `deploy/smoke.sh` passed; `mps-backend` remained active.
- F14 complete: TipTap modal composer, Bold-space fix through `onUpdate`, safe HTML pipeline; UI series deployed (new subtitle, no `fishka` option, one «Статьи» heading, CTA after comments).
- `comments_moderation_enabled=false` by default and admin-configurable; likes appear in Feed and full article, authenticated toggle updates locally without reload, guest opens login modal.
- Do not touch Unisender: external network timeout is a separate known blocker.

## Вечерний backlog — строго по порядку

1. Добавить frontend UI для редактирования и удаления уже опубликованной статьи. Composer сейчас поддерживает только создание; existing-post editing is absent in frontend.
2. F14 Phase 2: добавить загрузку изображений в composer. Backend `POST /api/v1/media` уже готов с F03; F14 nh3 allowlist already permits `img[src,alt]`; frontend upload control is absent.
3. F14 Phase 3: карусель из нескольких изображений — отдельная сессия только после завершения Phase 2.
