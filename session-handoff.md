# Session handoff — 2026-08-23

## Подтверждённое состояние

- Production `https://mir.pod-solncem.ru`: frontend code revision `d042d46`; likes UI deployed; `deploy/smoke.sh` passed; `mps-backend` remained active.
- F14 Phase 2 / F16 production complete: frontend-only `7a793f0` deployed. TipTap modal composer uploads one JPEG/PNG/WebP through the existing authenticated `POST /api/v1/media`; returned URL is inserted at current selection and existing safe HTML pipeline renders it. Remote build verified public VITE API/bot values and no localhost; rollback `/root/backups/mps-frontend-f16-20260823T131817Z`; `deploy/smoke.sh` passed; backend code was unchanged and mps-backend stayed active. Valid PNG upload returned 200 and a temporary public article rendered one img; invalid MIME returned 422, then DELETE 204/GET 404 cleaned the article. Browser had no authenticated editor/admin session, so live toolbar-click/toast interaction remains supported by served-bundle marker plus local DOM tests, not claimed as browser-authenticated.
- F17 production complete: backend `35f6914` deployed ca0880f→35f6914. `mps-backend` restarted, loopback readiness passed on attempt 2, and `deploy/smoke.sh` passed. Authorized live smoke: truncated valid-signature/MIME PNG → `422 «Некорректное изображение»` with no media file; valid JPEG/PNG/WebP each → 200, then their exact test media files were removed. `image.load()` before save now maps Pillow `OSError`/`UnidentifiedImageError` to 422.
- F18 production complete: `6ab2e40` pushed; VPS fast-forwarded `61ebd31 → 6ab2e40` after a successful PostgreSQL backup. Backend restarted and loopback health is ok. Remote frontend build verified both production VITE markers and no localhost API; rollback `/root/backups/mps-frontend-f18-20260823T221000Z`; `deploy/smoke.sh` passed. Authorized temporary API smoke uploaded three PNG through an in-memory existing editor/admin token, published a strict two-image carousel plus a separate ordinary img, and guest browser confirmed carousel region, prev/next, dots and both directions of switching. Cleanup DELETE 204/API GET 404 removed the article and exactly three media files. No authenticated Telegram browser session was available, so literal toolbar clicks remain covered by local DOM regression and served build rather than claimed as live browser-authenticated.
- F15 production complete: `8255d55` frontend-only rollout; rollback `/root/backups/mps-frontend-f15-rollback-20260823T124845Z`; backend remained active. Served bundle includes F15 marker and production API without localhost; smoke passed. Authorized temporary editor/admin API smoke: create 201, patch 200 with same slug/body update, delete 204, then GET 404. Interactive Telegram/email browser session was unavailable; role/modal behavior remains covered by served bundle and frontend tests.
- `comments_moderation_enabled=false` by default and admin-configurable; likes appear in Feed and full article, authenticated toggle updates locally without reload, guest opens login modal.
- Do not touch Unisender: external network timeout is a separate known blocker.

## Вечерний backlog — строго по порядку

1. F19 (будущий отдельный scope): drag-and-drop, paste insertion, reorder и autoplay для изображений. F14 Phase 3 / F18 carousel закрыта локально; не начинать F19 автоматически без нового продуктового решения.

## Наблюдение F16/F17

- F17 closes the F03 corrupted-image contract on production: valid-signature broken PNG now returns 422 without a file. Invalid MIME (`text/plain`) continues to return expected 422 detail.

## Наблюдение вне scope F15

- На VPS `git status --short` показывает untracked `.deploy-backups/`, `frontend/app/.env.production`, `venv.py310.failed/` и каталог `\\/`. Они не удалялись и не изменялись; происхождение требует отдельного read-only разбирательства.
