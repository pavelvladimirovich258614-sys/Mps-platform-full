# Session handoff — МПС

## Current verified state — 2026-08-28

- All 47 tracker records covering F01–F45 are `passing` with evidence; historical F09 is split into F09a1/F09a2/F09b.
- Production application revision is `a5186bce67c107dd8912f39361fa15b7fb637351`; local/origin/VPS were synchronized on that application checkpoint before the tracker-only follow-up. Production PostgreSQL is at `20260828_0017 (head)`; `mps-backend` is active/healthy and `deploy/smoke.sh` passes. The documentation checkpoint needs no production deployment.
- F37 Sessions A (`4f86725`), B (`df36dc2`), C (`b2b41fb`) and D (`9ab7b0e`) are complete and production-deployed.
- Session C embeds the admin-only `fishka_submissions_enabled` toggle directly in `/fishki`; non-admin roles neither render the control nor request the admin settings API.
- Session D adds nullable fishka categories, `GET /posts/fishki/categories`, the dynamic «Тема» filter and 11 new exact Unicode emoji choices. Its guarded importer parsed and idempotently imported 160 published fishki for `Павел` across 13 categories.
- The approved data operation permanently deleted only the 15 exact imported records in `Реальные кейсы Сергея (главное)`. Production now contains 145 imported fishki, 146 fishki total and 12 dynamic categories; the API and live dropdown no longer expose the removed category.
- F38 Packages 1–3 through F44 remain complete and production-deployed. Interactive «Иришка ИИ», outbound/inbound Telegram relay, reasoning cleanup, notification deep-links/polling and Q&A soft archive remain live.
- F45 is complete and production-deployed. Background Иришка processing obtains a transaction-scoped PostgreSQL advisory lock per `topic_id` before MiniMax/Telegram, performs a final ForumTopic `FOR UPDATE` plus message recheck, commits each topic independently and is backed by partial unique index `UNIQUE (topic_id) WHERE is_ai IS TRUE`.

## Verification and rollback

- F37 Session C: RED 1 expected failure / 32 passed; GREEN target 34 passed; full frontend 137 passed; relevant backend regression 14 passed; build and production smoke passed.
- F37 Session D: D1 GREEN 13 passed; D2 GREEN 36 passed; isolated migration and importer dry-run/apply/idempotency checks passed; full backend 119 passed/3 skipped, frontend 139 passed and build succeeded. Production dry-run planned 160 without conflicts, apply inserted 160 and repeated dry-run matched 160 unchanged.
- Fishki data cleanup rollback: `/var/backups/mps/mps-2026-08-27-113206.dump.gz`, SHA-256 `9fff4b720377939eaf55216d32e9fa146a5ae00a690205993e039ec80a7650f1`. Exact deletion removed 15 and left 145 imported/146 total fishki plus 12 categories.
- F45 PostgreSQL RED was `([1, 1], 2 provider calls, 2 AI rows, messages_count=2)`; GREEN was `([1, 0], 1, 1, 1)`. Full `test_irishka.py` passed 19 tests; full backend passed 126 with PostgreSQL integration tests active.
- F45 isolated Alembic cycle passed `0016 → 0017 → 0016 → 0017`. Multiple human rows were accepted and a second AI row for one topic was rejected by `uq_forum_messages_one_ai_per_topic`.
- F45 production preflight found 0 topics, 0 messages and 0 duplicate AI topics. Backup `/var/backups/mps/mps-2026-08-27-123301.dump.gz`, SHA-256 `3ac9b6d2cfca55f97bb83d549c7d4896c99011ec3f0a293567e49e6054325043`, is non-empty and readable through `pg_restore --list`. Migration `0017`, backend restart/health and smoke passed. Frontend diff was empty and no frontend build/deploy was performed.
- Session-close `./init.sh` stops only at the known external Hermes/desktop global `pip check` before MPS pytest; the relevant complete MPS suites passed separately. The shared Python environment was not modified.

## Deferred / unresolved work

- Email remains blocked by external Unisender/HostKey networking. The visible login path remains Telegram-only; do not re-enable email UI until transport is deliberately restored and verified.
- F38 remainder: admin UI for Иришка settings is discussed but not started. Duplicate-run protection is no longer part of the remainder because F45 closed it.
- Forum N+1 queries remain a low-priority deferred optimization.
- Whole-site search is a separate backlog task: discussed, not scoped or started.
- `npm audit` continues to report five known dependency advisories across multiple sessions. Do not apply breaking dependency upgrades opportunistically.
- `.codex/skills/verification-before-completion/SKILL.md` and `.codex/skills/tdd-fix-workflow/SKILL.md` have been physically absent from the checkout for several sessions. Their prompt-supplied rules are applied textually, but restoring the files is recommended for process reliability.

## Agreed backlog order and boundaries

1. F38 remaining admin UI for Иришка settings.
2. Forum N+1 optimization.
3. Drafts / reviews / subscription / about.
4. Web design last.

Whole-site search, email transport, npm remediation and skill-file restoration remain separate scopes requiring their own plan and approval. This checkpoint changes only the three tracker files; the owner explicitly authorized its commit and push, with no production deployment.
