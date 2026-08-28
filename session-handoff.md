# Session handoff — МПС

## Current verified checkpoint — 2026-08-28

- F46 is `passing` and production-deployed at application SHA `78890c873d896b2b97a477ef4e5107ddb813412b`.
- Current tracker count: 53 total records, 49 `passing`; exactly F47, F48a, F48b and F48c remain `in_progress` after inspected diagnosis.
- F01–F46, including F37 Sessions A–D, and F48d are completed and production-deployed.
- Fresh closeout check: backend active/healthy with PID 838131; served `/assets/index-Zpi2gptt.js` contains production VITE values and the F46 marker, contains no localhost API fallback, and `deploy/smoke.sh` passes.
- Full backend with temporary PostgreSQL 16 and `MPS_TEST_POSTGRES_URL` present passed 127 tests with 0 skipped. The earlier 120 passed/7 skipped run lacked PostgreSQL: 3 existing forum tests plus 4 F45 Irishka concurrency tests were skipped. This was environment variance, not an F46 regression.

## Backlog in agreed order

1. **F47 — forum performance.** Diagnosed and inspector-accepted. N+1 was not confirmed: countries, topics and messages each executed one SELECT in 50-row profiling. No runtime/production fix is needed. Optional test-only query-count guard is at implementer discretion; otherwise close with the recorded no-regression evidence.
2. **F48a — Drafts.** Diagnosed, not implemented. Confirmed defects: staff can delete another author's draft by ID; list-load failure is shown as a false empty state; a failed delete closes the confirmation dialog. Future work requires RED-first backend/frontend fixes for those three contracts.
3. **F48b — Reviews.** Diagnosed, not implemented. Pavel decided moderation belongs to role `editor`, not admin-only. Future scope: double-submit protection, list error/empty states and editor moderation UI.
4. **F48c — Subscription.** Diagnosed, not implemented. Pavel decided to honestly hide/disable the email subscription form while delivery is unavailable. Do not implement retention/outbox/retry or broader email infrastructure now. The independently relevant unescaped-HTML security defect still requires a RED-first fix.
5. **Web design.** Deferred until the functional backlog above is closed.

## Persistent blockers and boundaries

- Email delivery remains blocked by the external Unisender/HostKey network path. Do not change provider, firewall, credentials or email architecture without a separate approved scope.
- `npm audit` reports 5 advisories; no audit fix was authorized in F46.
- Historical tracker entries call `.codex/skills/*.md` a known physical gap. Current checkout verification found both `.codex/skills/verification-before-completion/SKILL.md` and `.codex/skills/tdd-fix-workflow/SKILL.md` present; they were read and applied in this closeout. Treat the older absence statement as stale history, not current filesystem state.
- F46 changed no schema. Backend restart was required only because the loaded Python admin endpoint changed; Alembic remains `20260828_0017 (head)`.
- Verified rollback artifacts: PostgreSQL `/var/backups/mps/mps-2026-08-27-212555.dump.gz` SHA-256 `d6832c5c53c266cf58b3791c707de062986f0ec252c2389665ad0c37ff297c71`; frontend `/root/backups/mps-frontend-f46-20260828T012555Z.tar.gz` SHA-256 `a8a4af143bbd9d4079ed2c7556e2a5d2dbba746d163942dec3e27dd7abd7bad1`.

## Continuation order

F47 optional guard/closeout → F48a → F48b → F48c → web design.
