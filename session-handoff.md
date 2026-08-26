# Session handoff — МПС

## Current verified state — 2026-08-26

- Full cycle F38 Package 3 through F44 is complete, `passing` and production-deployed. Production/local/origin revision is `0e49bbe`; Alembic is `20260826_0015 (head)`, `mps-backend` is active/healthy, the served frontend has production VITE values with no localhost API, and `deploy/smoke.sh` passed.
- F38 Package 3 (`21e55ac`) adds direct non-persistent «Иришка ИИ» Q&A with synchronous MiniMax answers and keyword retrieval over 248 knowledge records. Packages 1–2 (`9d18156`, `a97327c`) provide manager relay plus timeout/transient retry and per-topic scheduler isolation.
- F39 (`e688773`) excludes fishka from default `GET /posts`; the main feed contains article/video_review while `/fishki` uses an explicit fishka query.
- F40 (`4f868ef`) restores a full-size Q&A textarea and confirms outbound Telegram relay through `Reg_Under_the_sun_bot` for both manager and lawyer destinations.
- F41 (`1782b5a`) provides the secret-protected inbound Telegram webhook. Real manager and lawyer replies both update Questions and notifications end-to-end; relay failures do not log tokens.
- F42 (`3d6ac1c`) strips a complete leading MiniMax `<think>…</think>` block in the shared helper used by interactive Q&A and forum autoreply.
- F43 (`2ffb60d`) deep-links qa_answered notifications to the exact Question with correct manager/lawyer copy and polls every 30 seconds only while an open Question exists.
- F44 (`0e49bbe`) consumes the deep-link once so tabs remain switchable, uses an inline SVG bell, shows local post-submit guidance, distinguishes incoming answers with a dark-red bubble, and adds owner soft archive. Late Telegram replies automatically unarchive and restore the thread.

## Verification and rollback

- F44 full verification: backend 115 passed / 3 skipped; frontend 21 files / 134 passed; production build 116 modules. The final tracker-only closeout changes no application or production state.
- PostgreSQL rollback: `/var/backups/mps/mps-2026-08-26-080806.dump.gz`, SHA-256 `864cd0ff313665a1ed66f06d8234758577c6a5609fea5666531eb3831ddd6482`.
- Backend rollback: `/root/backups/mps-backend-f44-20260826T120806Z.tgz`, SHA-256 `4a3616851113aff4c3fbb1edfc35d86caf1ef1ceeaac009021f78613cbe0df95`.
- Frontend rollback: `/root/backups/mps-frontend-f44-20260826T120806Z`, tree SHA-256 `11a087ad3807005e6d16871938cae8328dbe6ac84500a81d35bbc652699345df`.
- `./init.sh` still stops only at the known external Hermes/desktop global pip-check before MPS tests; do not change the shared Python environment to mask it.

## Deferred / unresolved work

- Email remains blocked by external Unisender/HostKey networking. Telegram is the only visible login path; email UI returns only after the transport is repaired and `EMAIL_LOGIN_ENABLED` is deliberately enabled.
- F37 remains `in_progress`: Sessions A/B are deployed, but Session C (admin toggle UI for fishka submissions) and Session D (import of 160 fishki) are paused and were not started.
- Deferred Иришка enhancements were not started: duplicate-answer race protection for forum autoreplies and an admin UI for Иришка settings. They require a new plan and are not part of closed F38.
- Remaining forum N+1 work is low priority and deferred.
- `npm ci` reports five known dependency advisories (3 moderate, 1 high, 1 critical). Dependencies have not changed across these sessions; schedule a separate audit/remediation session rather than applying breaking upgrades opportunistically.

## Next action and boundaries

Commit only `feature_list.json`, `claude-progress.md`, `session-handoff.md` and `clean-state-checklist.md`, then wait for separate push approval. Do not start any deferred item or change production configuration in this closeout.
