# Session handoff — МПС

## Current checkpoint — 2026-09-01, SEC-HEIF-STOPGAP locally verified, NOT deployed

1. Owner explicitly requested and authorized a separate temporary stopgap for vulnerable libheif: POST /api/v1/media rejects HEIC/HEIF with HTTP 422 and `Формат HEIC/HEIF временно недоступен, используйте JPEG/PNG/WebP`. Local commit is authorized; **push/deploy are NOT authorized in this step** and await the next confirmation.
2. Scope: backend/app/api/media.py, backend/tests/test_media.py, feature_list.json, claude-progress.md, session-handoff.md. No dependencies/frontend/migrations/production changes. Application HEIF opener registration is removed; Image.open has an explicit JPEG/PNG/WebP/AVIF decoder allowlist, so renaming HEIC or spoofing its MIME cannot reach libheif. Container-brand detection affects only the error message after safe decoding fails; valid AVIF/mif1 remains supported.
3. Fresh evidence: RED 10 failed / 4 passed / 6 deselected before handler changes; GREEN full media **20 passed in 9.16s**. Full backend on disposable PostgreSQL 16 prepared by existing Alembic migrations to 20260830_0020: **158 passed in 64.14s, 0 skipped**, command `python -m pytest tests -q -rs --tb=short -p no:cacheprovider --basetemp D:/mps-platform-full/.pytest-heif-full-0901` with process-scoped MPS_TEST_POSTGRES_URL. Two changed Python files passed `python -m flake8 ... --select E4,E7,E9,F --jobs=1`. Known init.sh Win32 Error 5 happened before pip installation; not a GREEN init result.
4. Base local HEAD/origin/main is 07566c8. The Vite/Vitest upgrade was already released before this stopgap: the preceding audit on 2026-08-31 observed production 07566c8 and health OK. **Do not repeat the historical pending Vite release instructions below.** This stopgap task did not connect to production; local passing does not mean live protection.
5. Native libheif remains installed at its existing version. This is an explicit temporary mitigation, not the permanent Critical fix. Re-enable HEIC only after separately upgrading and verifying actually loaded libheif >=1.23.2, then restoring acceptance with tests. Other audit findings, F47/F48c and known .codex/skills/*.md text-rule gap remain untouched.
6. Next action: report the new local commit SHA and wait for the owner's separate approval for immediate standalone push/deploy. Deployment will require a controlled backend restart to activate the new decoder policy; no dependency installation or frontend rebuild is required by this patch. Preserve rollback and run health/smoke after that separately authorized deployment. Do not run pytest against production: PostgreSQL test fixtures drop/recreate tables.

## Historical checkpoint — 2026-08-31, before the completed Vite/Vitest release

1. Local HEAD `06dd1b8b0b2d691fbdb5105ac1331e082c2744ec` is the only existing upgrade commit, changing frontend manifest/lockfile to Vite `^6.4.3` / Vitest `^3.2.6`; plugin-react remains 4.7.0. The local origin/main reference remains `38c6e07`. This upgrade has not been pushed or deployed.
2. Owner accepted Stages 1–3: npm audit 5 findings -> 0; first frontend run 32 files / 200 tests passed without fixes; production build with Vite 6.4.3 succeeded (121 modules, JS 731.91 kB / gzip 232.01 kB, only the chunk warning); dev/HMR updated a module without reload or state loss.
3. Accepted real-dist browser matrix: light/dark x 375/768/1024/1440, 8/8 passed. Theme switch, modal focus/Escape and /about passed; overflow, JavaScript errors and broken visible images were zero; Svyazio loaded. Public production API/media GETs were bridged read-only to overcome localhost CORS and preview's absent nginx /media mapping. No production writes or authenticated-account checks were made. Served `index-Cx13uxnX.js` matched dist SHA-256 `10aab2d75ed5501f94431932ad0f72fc01eb5d29134971d15ae3e18288501009`, with production API/bot markers and no localhost fallback. Evidence and eight screenshots are outside git in `C:/Users/vin-m/.codex/visualizations/2026/08/31/01a057ec-8c49-78c0-9ff1-976f3a32506e/` (`stage3-results.json`). These are accepted prior-stage results, not Stage 4 reruns.
4. Fresh Stage 4 audit: `npm audit --registry=https://registry.npmjs.org` -> `found 0 vulnerabilities`, exit 0. Fresh backend: initially 141 passed / 10 PostgreSQL skips; first empty-PostgreSQL run 149 passed / 2 failed for missing pg_trgm `similarity()`. Diagnosis found that discovery fixture creates tables without migrations. Existing `python -m alembic upgrade head` on the disposable PostgreSQL 16 DB installed the extension and reached `20260830_0020`; unchanged discovery tests passed 6/6.
5. Final backend command from backend with process-scoped `MPS_TEST_POSTGRES_URL`: `python -m pytest tests -q -rs -p no:cacheprovider --basetemp D:/mps-platform-full/.pytest-vite-stage4-pg-final-0831` -> **151 passed in 55.26s, 0 skipped, exit 0**. No source/tests/backend changes. Temporary container `mps-vite-stage4-pg-0831` was stopped with automatic removal; Docker Desktop was started only for this verification and returned to its initial stopped state. Do not use production for pytest: these fixtures drop/create tables.
6. Owner accepted Stage 4 and now authorizes a separate commit of exactly `feature_list.json`, `claude-progress.md`, `session-handoff.md` above `06dd1b8`, then push/deploy both commits together. TOOLING-VITE6 is locally `passing`; do not amend/squash the dependency commit. At preparation of this tracker commit, production deployment is still pending, so local validation must not be reported as live deployment evidence.

## Next action and other session outcomes

1. Execute the authorized tracker commit, verify clean state and push both commits. Before frontend deployment, preserve existing dist and record rollback path/SHA-256. Fast-forward production, install the committed lockfile, rebuild with the same production VITE values, verify served JS and `deploy/smoke.sh`, and confirm backend health/PID without restart. No backend install or production DB migration is part of this scope. Record actual deployment evidence separately after observing it; do not prefill success. Do not change F47/F48c, runtime dependencies or the known text-rule gap.
2. Sergey admin task was completed earlier in this session using the existing management command: initial lookup found no matching row; post-command verification found exactly one matching user, role admin, not banned. Do not repeat creation or expose identifying fields in trackers.
3. Q&A F40/F41 diagnosis: manager replies are authorized by the configured managers group chat, without a separate user/username whitelist. Pavel adds the four managers to the existing Telegram group manually; no site admin/editor roles were requested or assigned.
4. Svyazio diagnosis remains incomplete at the SaaS panel boundary. The earlier authorized live-widget test obtained message-creation API 201; this does not prove visibility in «Чаты» or agent notification delivery. Panel authentication was unavailable. Next panel checks: find the test conversation, inspect personal agent Telegram notification binding and agent/channel/department assignment. Do not claim a precise SaaS configuration cause until checked; no new widget code is justified by current evidence.

## Historical checkpoint — WIDG-1 + WIDG-2 production complete

The records below preserve the previous rollout/rollback evidence. Stage 4 did not reconnect to the VPS or refresh production health. Initial session preflight recorded local/origin/VPS `38c6e07` before the local upgrade.

1. WIDG-1 and WIDG-2 are both production-deployed `passing`. The completed application rollout is `9586cafe0885941cfcfbd6c4f3bd634751e69680`, confirmed on local `main`, `origin/main` and the VPS checkout before this documentation-only closeout.
2. WIDG-1 commits `6711b0f` and `dc2e89e` are live. Alembic reached `20260830_0020`; `mps-backend` is active/healthy. The public tour-request form, consent gate, persistence and existing Telegram relay path are deployed.
3. WIDG-2 commit `9586caf` is live. `Layout` mounts one idempotent Svyazio integration; the mobile-only launcher/teaser offset is applied through the open Shadow DOM, while desktop and fullscreen vendor behavior remain unchanged.
4. The WIDG-2 production frontend build contains the production API/bot values and no localhost fallback. The served bundle matched the built asset, `deploy/smoke.sh` passed, and backend PID remained unchanged because this rollout was frontend-only.
5. Live iPhone 14 verification at 390x664 confirmed both launchers simultaneously visible after the normal cookie-consent step: WIDG-1 on the left, WIDG-2 on the right, no mutual or mobile-nav overlap, `bottom: 74px`, zero horizontal overflow, clickable Svyazio launcher and fullscreen 390x664 chat with no page errors or Svyazio request failures.
6. Known vendor boundary: the current third-party launcher exposes no accessible name inside its Shadow DOM. This remains a separate vendor/accessibility decision rather than an unverified local override.

## Completed production checkpoint — WIDG-4 + P0-POST-MEDIA

1. WIDG-4 and all five P0 post-media stages are production-deployed and verified `passing`. Application code was deployed at `0b33784d18736b82526b9dd35cc6def245ae239c`; the final scoped nginx-test/template/tracker commit is the next commit in `origin/main` after this handoff.
2. PostgreSQL is at Alembic `20260830_0019 (head)` with `pg_trgm` and the three discovery indexes. `mps-backend` is active/healthy. Production serves `index-Y8_k3Iw_.js` with the production API/bot markers and no localhost fallback.
3. The production post `poezdka-v-tailand-2026` now references four UUID media sets with 24 physical WebP/AVIF variants. The guarded transaction updated one row, originals were not deleted, and every public variant matched the saved SHA manifest.
4. The scoped `/media/` nginx mapping serves AVIF as `image/avif` and WebP as `image/webp`, retains `try_files`, inherited `nosniff`, and 30-day cache headers. `nginx -t`, reload and post-change smoke passed without restarting backend.
5. Start the next owner-selected task from the normal HEAD/origin/VPS/clean/init preflight. Do not reopen this cycle because of the known frontend chunk warning, guest 401s, F47 or F48c; those are separate scopes.

## Verified rollback inventory

- PostgreSQL: `/var/backups/mps/mps-2026-08-30-084759.dump.gz`, SHA-256 `3912ffd2bc3d21da7f74ff93b781591391890f015fe77b64067cbff98e36689f`; `pg_restore --list` passed.
- Combined media rollback directory: `/root/backups/p0-post-media-20260830T124758Z`.
- Frontend archive SHA-256: `afdb9b4cbde9c2aac10ca7367e82df204c469c7fc575491f5118045336f37f91`.
- Original post-row SHA-256: `5586f418021864831eb47630258bfdb9d37d170c8cfb5bde08d88c54fc102c6c`.
- Four-original PNG manifest SHA-256: `a68dd7201f9902eea5b5bd35104b5b1be568499e95a4165548531becae77bf33`.
- 24-variant manifest SHA-256: `ccbd75139039f4a3c233a33a8e47ac5335204b4fc0dd89425287da2b7548da6f`; mapping SHA-256 `df28ac2c47413aedcc62ef9b2e81e4eb8fbfc3127725fa388de3573711d11587`.
- Nginx `sites-available` backup: `/root/backups/mps-nginx-avif-20260830T130411Z.conf`, SHA-256 `ced963e07a1da93ab8244f60702f9cea24b387164777f949f8b1056b8a179dcc`.
- Nginx active `sites-enabled` backup: `/root/backups/mps-nginx-enabled-avif-20260830T130857Z.conf`, SHA-256 `6fb3004d3fc419a019b09ec56206fdc057bbaff3b8ad65054bf7c28c0287bee7`.

## Final verification evidence

- MIME RED: deploy-bootstrap target `1 failed / 3 passed` because scoped types/cache were absent. After preserving production `try_files`, GREEN target passed `4/4`.
- Public media: 24/24 SHA matches; AVIF=`image/avif`, WebP=`image/webp`, `X-Content-Type-Options=nosniff`, `Cache-Control=max-age=2592000`, Expires present.
- Throttled Playwright at 400 Kbit/s, 400ms latency, CPU×4: iPhone 14 load/network-idle `7.945/21.434s`; Pixel 7 `7.490/20.851s`, versus original `97–112s`. Initial media `418316` bytes; no inactive slide requests, request failures or page errors.
- Full backend: `131 passed, 10 skipped` (the known PostgreSQL-only environment skips). Full frontend: 29 files / 190 tests. Production-configured build: 123 modules, JS 705.15 kB / gzip 228.02 kB, expected CJS/chunk warning only.
- `deploy/smoke.sh` passed after code deployment and again after the nginx MIME reload. Backend PID remained `1034912` across the nginx-only change.

## Known boundaries

- `./init.sh` still stops at the known Git Bash Win32 Error 5/global shared-environment `pip check`; direct complete MPS suites are the completion evidence. Do not repair the shared environment in this project.
- The known text-rule `.codex/skills/*.md` gap remains unchanged. The existing `verification-before-completion/SKILL.md` and `tdd-fix-workflow/SKILL.md` were read and applied; no replacement rule files were added.
- Three guest `401` console messages are exactly `/api/v1/me`, `/api/v1/notifications`, and `/api/v1/auth/refresh`; none is a failed/hanging request.
- The historical 705.15 kB production chunk and the local Stage 3 Vite 6 chunk of 731.91 kB remain above the 500 kB warning threshold; optimization is a separate scope.
- `/etc/nginx/sites-enabled/mps-platform` is a regular file rather than a symlink to `sites-available`; both exact media blocks were backed up and updated. Do not silently change that topology in a future task.
- F47 and F48c remain their pre-existing independent `in_progress` tracker items and were not changed by this cycle.
