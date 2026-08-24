# Session handoff — МПС

## Verified local state — 2026-08-24

F01–F25 are recorded as passing and F25 is deployed at `e1a35f3`.

- The reported upload failure was not a PNG/JPEG regression. Current composer chain remains `onChange → apiForm(POST /media) → insertImageAtDocumentStart`; existing PNG baseline passed.
- The actual cause for iPhone photos was HEIC/HEIF being excluded by both the native file picker `accept` list and the backend MIME allowlist. The UI now accepts JPEG, PNG, WebP, HEIC, HEIF and AVIF.
- Backend now depends on `pillow-heif==1.5.0`. It registers the HEIF decoder and converts HEIC/HEIF to WebP before storage; AVIF is accepted and preserved as AVIF. An unsupported file receives `422 «Допустимы JPEG, PNG, WebP, HEIC, HEIF или AVIF»`.
- Fresh verification: F25 RED frontend 1 failed / 18 passed; RED backend after dependency 4 failed / 7 passed. GREEN media 11 passed and RichTextEditor 19 passed. Full backend 70 passed; full frontend 15 files / 85 passed; `npm run build` passed (115 modules, standard chunk-size warning).
- `./init.sh` installed MPS requirements, then stopped only at the external global Hermes/desktop `pip check`; that environment is not part of MPS and was not modified.

## Production evidence

Rollback backup: `/root/backups/mps-f25-20260824T131202Z` (previous revision and frontend dist). Production venv installed `pillow-heif==1.5.0`; `mps-backend` restarted active; frontend rebuilt with verified VITE markers; served asset returned 200 and `deploy/smoke.sh` passed. Authorized HTTPS smoke: synthetic HEIC returned 200 and was served as valid WebP; PNG/JPEG returned 200; a renamed text file returned the approved Russian 422; exactly three temporary media files were removed. No authenticated browser click was available, so that UI step remains covered by local frontend regression tests.

## Known unresolved boundary

Email remains blocked by the external Unisender/HostKey network path. Do not change email transport, credentials, firewall or VPS networking without Pavel's separate decision.
