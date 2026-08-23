# Session handoff — 2026-08-23

## Подтверждённое состояние

- Production `https://mir.pod-solncem.ru`: frontend code revision `d042d46`; likes UI deployed; `deploy/smoke.sh` passed; `mps-backend` remained active.
- F14 Phase 2 / F16 production complete: frontend-only `7a793f0` deployed. TipTap modal composer uploads one JPEG/PNG/WebP through the existing authenticated `POST /api/v1/media`; returned URL is inserted at current selection and existing safe HTML pipeline renders it. Remote build verified public VITE API/bot values and no localhost; rollback `/root/backups/mps-frontend-f16-20260823T131817Z`; `deploy/smoke.sh` passed; backend code was unchanged and mps-backend stayed active. Valid PNG upload returned 200 and a temporary public article rendered one img; invalid MIME returned 422, then DELETE 204/GET 404 cleaned the article. Browser had no authenticated editor/admin session, so live toolbar-click/toast interaction remains supported by served-bundle marker plus local DOM tests, not claimed as browser-authenticated.
- F17 local complete: damaged valid-signature `image/png` now runs `image.load()` before save; Pillow `OSError`/`UnidentifiedImageError` map to `422 «Некорректное изображение»`, and no media file is created. Backend-only deploy awaits owner approval; do not restart production backend before it.
- F15 production complete: `8255d55` frontend-only rollout; rollback `/root/backups/mps-frontend-f15-rollback-20260823T124845Z`; backend remained active. Served bundle includes F15 marker and production API without localhost; smoke passed. Authorized temporary editor/admin API smoke: create 201, patch 200 with same slug/body update, delete 204, then GET 404. Interactive Telegram/email browser session was unavailable; role/modal behavior remains covered by served bundle and frontend tests.
- `comments_moderation_enabled=false` by default and admin-configurable; likes appear in Feed and full article, authenticated toggle updates locally without reload, guest opens login modal.
- Do not touch Unisender: external network timeout is a separate known blocker.

## Вечерний backlog — строго по порядку

1. F17 backend-only deploy — только после отдельного подтверждения владельца.
2. F14 Phase 3: карусель из нескольких изображений — отдельная сессия только после отдельного продуктового решения. Не начинать её автоматически; drag-and-drop и paste также остаются вне scope F16.

## Наблюдение F16/F17

- F17 fixes the local F03 contract with RED/GREEN coverage; production remains on pre-F17 backend until an approved deploy. Invalid MIME (`text/plain`) already returns expected 422 detail.

## Наблюдение вне scope F15

- На VPS `git status --short` показывает untracked `.deploy-backups/`, `frontend/app/.env.production`, `venv.py310.failed/` и каталог `\\/`. Они не удалялись и не изменялись; происхождение требует отдельного read-only разбирательства.
