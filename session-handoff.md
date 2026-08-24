# Session handoff — МПС

## Verified local state — 2026-08-24

F01–F25 are recorded as passing locally. F25 adds phone/modern image formats; production remains at the previously deployed F24 revision until Pavel gives a separate rollout approval.

- The reported upload failure was not a PNG/JPEG regression. Current composer chain remains `onChange → apiForm(POST /media) → insertImageAtDocumentStart`; existing PNG baseline passed.
- The actual cause for iPhone photos was HEIC/HEIF being excluded by both the native file picker `accept` list and the backend MIME allowlist. The UI now accepts JPEG, PNG, WebP, HEIC, HEIF and AVIF.
- Backend now depends on `pillow-heif==1.5.0`. It registers the HEIF decoder and converts HEIC/HEIF to WebP before storage; AVIF is accepted and preserved as AVIF. An unsupported file receives `422 «Допустимы JPEG, PNG, WebP, HEIC, HEIF или AVIF»`.
- Fresh verification: F25 RED frontend 1 failed / 18 passed; RED backend after dependency 4 failed / 7 passed. GREEN media 11 passed and RichTextEditor 19 passed. Full backend 70 passed; full frontend 15 files / 85 passed; `npm run build` passed (115 modules, standard chunk-size warning).
- `./init.sh` installed MPS requirements, then stopped only at the external global Hermes/desktop `pip check`; that environment is not part of MPS and was not modified.

## Production boundary

Do not deploy F25 without Pavel's explicit approval. The rollout changes backend dependency/runtime and frontend picker MIME list, so build both layers and run authenticated HEIC, HEIF and AVIF upload smoke with cleanup. There was no authenticated live browser session in the local F25 verification.

## Known unresolved boundary

Email remains blocked by the external Unisender/HostKey network path. Do not change email transport, credentials, firewall or VPS networking without Pavel's separate decision.
