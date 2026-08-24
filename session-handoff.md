# Session handoff — МПС

## Verified final state — 2026-08-24

F01–F24 passing локально. F24 не pushed и не deployed; для production требуется approval, потому что есть PostgreSQL-миграция и backend change.

- F24: только автор draft может получить свой список или содержимое. `GET /posts/drafts` возвращает id/title/updated_at; `GET /posts/drafts/{id}` — полный контент. Другой editor/admin получает 404 для чужого draft. Published F15 visibility/editing rules remain unchanged.
- `posts.updated_at` is Alembic head `20260824_0011`. PATCH draft→published now assigns `published_at`, so the post enters the public feed and future digest selection.
- `/drafts` is shown only to editor/admin; it lists title/date, opens the existing F15 composer modal with prefill, keeps the newly created draft ID and PATCHes later Save Draft/Publish actions instead of creating duplicates.
- F24 RED→GREEN: backend list absent then 5 targeted passed; additional published_at RED then 5 passed; frontend list/PATCH RED then 2 files / 21 targeted passed. Full frontend: 15 files / 84 passed; build: 115 modules success; full backend: 66 passed. Alembic history confirms head.
- `init.sh` installs MPS requirements then stops only at the unrelated global Hermes/desktop pip check. Do not change external dependencies; full MPS suites are green separately.

## Known unresolved boundary

Email remains blocked by the external Unisender/HostKey network path. Do not change email transport, credentials, firewall or VPS networking without Pavel's separate decision.

## Next step

Await owner approval to push/deploy F24. Deployment must back up PostgreSQL, apply Alembic `20260824_0011`, restart `mps-backend`, rebuild frontend with verified production VITE values, run `deploy/smoke.sh`, then use an authorized temporary editor draft to check own-list/detail, foreign 404, PATCH draft save, publish-to-feed and cleanup.
