# Session handoff — МПС

## Current checkpoint — WIDG-2 locally complete, awaiting publication approval

1. WIDG-2 is implemented and locally verified `passing`. `Layout` mounts one global `SvyazioWidget`; it configures the exact approved org/server values and appends one async script with a unique ID, without duplicate loads across SPA navigation or repeated Layout mounts.
2. Current production and the nginx template have no CSP header/meta, so Svyazio script/connect traffic is not blocked. The live service renders through an open Shadow DOM rather than an iframe. HSTS, `X-Content-Type-Options: nosniff` and `X-Frame-Options: SAMEORIGIN` were not changed.
3. The only injected vendor override is scoped to `@media (max-width: 767px)`: launcher and teaser receive `bottom: calc(74px + env(safe-area-inset-bottom)) !important`. The fullscreen `.svyazio-window`, all widths from 768px, vendor color and chat behavior remain untouched. Document plus Shadow DOM observers restore the dedicated style after host replacement or internal redraw and are disconnected on React unmount.
4. RED failed 3/3 for the absent global script/config/mobile style. GREEN passed 3/3. Fresh full frontend passed 32 files / 200 tests; production-configured build passed 125 modules with only the established CJS/chunk-size warnings.
5. Real Svyazio browser-check passed light/dark 8/8 at 375/768/1024/1440: one exact async script, visible/clickable `#C08E37` launcher, zero horizontal overflow and no page/Svyazio request failures. At 375 the launcher is `y=678..738` and mobile-nav is `y=753..812`, so their overlap is now zero instead of the diagnosed 44px; WIDG-1 overlap is also zero. Mobile chat opens fullscreen 375x812. At 768/1024/1440 vendor positioning stays at bottom 24px and the open chat stays 400x600.
6. Known vendor boundary: the current third-party launcher exposes no accessible name inside its Shadow DOM. This was observed and recorded, but the approved positioning-only scope does not rewrite vendor semantics; use a separate accessibility/vendor decision if that behavior must be overridden.
7. WIDG-1 commits `6711b0f` and `dc2e89e` are already production-deployed with Alembic `20260830_0020`; the previous top-of-file handoff saying they were local-only was stale and is superseded here.
8. Next action: wait for explicit owner confirmation before pushing or deploying the new WIDG-2 commit. No VPS access, production mutation, push or deploy occurred in this checkpoint.

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
- Three guest `401` console messages are exactly `/api/v1/me`, `/api/v1/notifications`, and `/api/v1/auth/refresh`; none is a failed/hanging request.
- The existing 705.15 kB frontend chunk warning remains a separate optimization scope.
- `/etc/nginx/sites-enabled/mps-platform` is a regular file rather than a symlink to `sites-available`; both exact media blocks were backed up and updated. Do not silently change that topology in a future task.
- F47 and F48c remain their pre-existing independent `in_progress` tracker items and were not changed by this cycle.
