# Session handoff — 2026-08-23

## Подтверждённое состояние

- Production `https://mir.pod-solncem.ru`: frontend code revision `d042d46`; likes UI deployed; `deploy/smoke.sh` passed; `mps-backend` remained active.
- F14 Phase 2 / F16 local complete: TipTap modal composer now uploads one JPEG/PNG/WebP through the existing authenticated `POST /api/v1/media`; returned URL is inserted at current selection and existing safe HTML pipeline renders it. F16 production deploy remains unapproved.
- F15 production complete: `8255d55` frontend-only rollout; rollback `/root/backups/mps-frontend-f15-rollback-20260823T124845Z`; backend remained active. Served bundle includes F15 marker and production API without localhost; smoke passed. Authorized temporary editor/admin API smoke: create 201, patch 200 with same slug/body update, delete 204, then GET 404. Interactive Telegram/email browser session was unavailable; role/modal behavior remains covered by served bundle and frontend tests.
- `comments_moderation_enabled=false` by default and admin-configurable; likes appear in Feed and full article, authenticated toggle updates locally without reload, guest opens login modal.
- Do not touch Unisender: external network timeout is a separate known blocker.

## Вечерний backlog — строго по порядку

1. F14 Phase 3: карусель из нескольких изображений — отдельная сессия только после отдельного продуктового решения. Не начинать её автоматически; drag-and-drop и paste также остаются вне scope F16.

## Наблюдение вне scope F15

- На VPS `git status --short` показывает untracked `.deploy-backups/`, `frontend/app/.env.production`, `venv.py310.failed/` и каталог `\\/`. Они не удалялись и не изменялись; происхождение требует отдельного read-only разбирательства.
