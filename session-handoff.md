# Session handoff — МПС

## Current verified state — 2026-08-27

- F37 Sessions A (`4f86725`), B (`df36dc2`), C (`b2b41fb`) and D (`9ab7b0e`) are production-deployed. Session C embeds the admin-only `fishka_submissions_enabled` toggle; Session D adds nullable categories, dynamic category API/filter UI, the emoji expansion and the guarded idempotent importer.
- Production import initially created 160 published fishki for `Павел` across 13 categories. Approved data operation 2026-08-27 physically deleted only the 15 exact imported rows from `Реальные кейсы Сергея (главное)` after title-by-title approval and a fresh backup. Current data state is 145 imported fishki, 146 fishki total and 12 categories.
- Full cycle F38 Package 3 through F44 remains complete and production-deployed. Current production revision is `9ab7b0e`; Alembic is `20260827_0016 (head)`. The post-delete API and live `/fishki` dropdown no longer expose the removed category. F45 race-condition diagnosis remains `in_progress` at unchanged priority and was not modified by this operation.
- F38 Package 3 (`21e55ac`) adds direct non-persistent «Иришка ИИ» Q&A with synchronous MiniMax answers and keyword retrieval over 248 knowledge records. Packages 1–2 (`9d18156`, `a97327c`) provide manager relay plus timeout/transient retry and per-topic scheduler isolation.
- F39 (`e688773`) excludes fishka from default `GET /posts`; the main feed contains article/video_review while `/fishki` uses an explicit fishka query.
- F40 (`4f868ef`) restores a full-size Q&A textarea and confirms outbound Telegram relay through `Reg_Under_the_sun_bot` for both manager and lawyer destinations.
- F41 (`1782b5a`) provides the secret-protected inbound Telegram webhook. Real manager and lawyer replies both update Questions and notifications end-to-end; relay failures do not log tokens.
- F42 (`3d6ac1c`) strips a complete leading MiniMax `<think>…</think>` block in the shared helper used by interactive Q&A and forum autoreply.
- F43 (`2ffb60d`) deep-links qa_answered notifications to the exact Question with correct manager/lawyer copy and polls every 30 seconds only while an open Question exists.
- F44 (`0e49bbe`) consumes the deep-link once so tabs remain switchable, uses an inline SVG bell, shows local post-submit guidance, distinguishes incoming answers with a dark-red bubble, and adds owner soft archive. Late Telegram replies automatically unarchive and restore the thread.

## Verification and rollback

- F37 Session C RED — 1 expected failure / 32 passed because the admin checkbox was absent. GREEN target — 34 passed. Full frontend — 21 files / 137 passed; relevant backend regression — 14 passed; build — 117 modules with the standard chunk warning only.
- F37 Session D Package D1 RED stopped at the expected missing importer; GREEN target — 13 passed. Package D2 RED — 2 expected failures / 34 passed; GREEN — 36 passed. Isolated Alembic upgrade/downgrade/re-upgrade passed. Isolated importer dry-run persisted 0, first apply inserted 160, second apply inserted 0/recognized 160 unchanged; 13 categories and 0 activity events were confirmed. Full backend — 119 passed/3 skipped; full frontend — 21 files/139 passed; build — 117 modules.
- Session D code/migration/frontend rollout and the separately approved production import are complete. The production import dry-run planned 160 with zero conflicts, apply inserted 160 and the repeated dry-run recognized 160 unchanged.
- Pre-delete data rollback: `/var/backups/mps/mps-2026-08-27-113206.dump.gz`, SHA-256 `9fff4b720377939eaf55216d32e9fa146a5ae00a690205993e039ec80a7650f1`; the dump is non-empty and passed `gzip -dc | pg_restore --list`.
- Exact data verification: 15 agreed ids/slugs matched before DELETE; afterward target ids/category rows are zero, imported fishki are 145 and all fishki are 146. Categories API returns 12, the removed exact filter returns 0, and the live dropdown contains only `Все темы` plus those 12 categories.
- F44 full verification: backend 115 passed / 3 skipped; frontend 21 files / 134 passed; production build 116 modules. The final tracker-only closeout changes no application or production state.
- PostgreSQL rollback: `/var/backups/mps/mps-2026-08-26-080806.dump.gz`, SHA-256 `864cd0ff313665a1ed66f06d8234758577c6a5609fea5666531eb3831ddd6482`.
- Backend rollback: `/root/backups/mps-backend-f44-20260826T120806Z.tgz`, SHA-256 `4a3616851113aff4c3fbb1edfc35d86caf1ef1ceeaac009021f78613cbe0df95`.
- Frontend rollback: `/root/backups/mps-frontend-f44-20260826T120806Z`, tree SHA-256 `11a087ad3807005e6d16871938cae8328dbe6ac84500a81d35bbc652699345df`.
- `./init.sh` still stops only at the known external Hermes/desktop global pip-check before MPS tests; do not change the shared Python environment to mask it.

## Deferred / unresolved work

- Email remains blocked by external Unisender/HostKey networking. Telegram is the only visible login path; email UI returns only after the transport is repaired and `EMAIL_LOGIN_ENABLED` is deliberately enabled.
- F37 is `passing` through production-deployed Session D and the approved 2026-08-27 data correction. No additional fishki code is required because the category list is dynamic.
- F45 duplicate-answer race-condition diagnosis is the active `in_progress` work and retains its existing priority. This data correction neither advances nor resets it; the separate admin UI for Иришка settings remains deferred.
- Remaining forum N+1 work is low priority and deferred.
- `npm ci` reports five known dependency advisories (3 moderate, 1 high, 1 critical). Dependencies have not changed across these sessions; schedule a separate audit/remediation session rather than applying breaking upgrades opportunistically.

## Next action and boundaries

Continue F45 race-condition diagnosis at its existing priority. Commit only `feature_list.json`, `claude-progress.md` and `session-handoff.md` for this completed data operation; keep that tracker commit local until separate push approval. Do not modify fishki code or start another deferred item without a new plan and approval.
