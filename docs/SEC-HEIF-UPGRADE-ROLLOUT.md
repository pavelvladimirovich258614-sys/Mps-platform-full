# SEC-HEIF-UPGRADE production rollout plan

Status: preparation only. No production mutation is authorized by this document.

## Fixed inputs and gates

- Application commit: `d8baea6` (`SEC-HEIF-UPGRADE: restore guarded HEIF uploads [in_progress]`).
- Package: `pillow-heif==1.5.0+libheif1.23.2`.
- Wheel: `pillow_heif-1.5.0+libheif1.23.2-cp311-cp311-manylinux_2_27_x86_64.manylinux_2_28_x86_64.whl`.
- SHA-256: `2588563fcf48184a1523e549d741345d43613c35b94e934eba01e8136dc62b3d`.
- Release tag: `sec-heif-upgrade-1.5.0-libheif1.23.2`.
- Direct source: the hash-pinned GitHub release URL in `backend/requirements-heif.lock`.

The release asset was published on 2026-09-01 under the previously unused tag above in the controlled `pavelvladimirovich258614-sys/Mps-platform-full` repository. A fresh cache-bypassed `curl` download returned HTTP 200 and 5,610,340 bytes; SHA-256 matched exactly, and the filename plus internal wheel metadata contained `cp311-cp311-manylinux_2_27_x86_64` and `cp311-cp311-manylinux_2_28_x86_64`. The target application SHA must be read after the preparation commit and push; it must not be guessed in advance.

## Ordered rollout

1. **Publication and read-only preflight.** Publication and the independent local asset check are complete. After separate approval, push the local commits, then connect with `mps_deploy_key` using `BatchMode=yes`, `IdentitiesOnly=yes`, and strict host-key checking. Confirm local `HEAD`, `origin/main`, and the intended VPS target revision. Record current VPS tracked/index state, preserve the known untracked artifacts, record `mps-backend` active state, PID, `NRestarts`, health, service user, Python path, package version, `libheif_info()`, extension RPATH and `ldd` output. Any unexpected drift stops the rollout.

2. **Paired rollback backup before checkout/install.** Create a timestamped directory under `/root/backups/` with `umask 077` scoped only to the backup subshell. Back up and hash the current tracked backend files that will change, including `media.py`, `test_media.py`, `requirements.txt`, and `requirements-heif.lock` when present. Record the current Git SHA, `pip freeze`, `pip show -f pillow-heif`, Python/ABI metadata, current native-info/RPATH/`ldd`, service state/PID and file ownership/modes. Download or otherwise preserve the exact currently installed `pillow-heif==1.5.0` wheel and verify that its isolated native payload is libheif 1.23.1 before accepting it as the paired rollback wheel. Backups and secrets remain mode 600/root-only.

3. **Stage and verify only the new wheel.** Transfer the already hash-verified wheel to a new root-owned staging directory without placing it in the checkout. Recompute SHA-256 on the VPS and compare the exact expected value. Verify wheel filename/tags and archive contents. Make only the staged wheel readable by `mps`; do not relax `.env`, key, venv metadata, or backup permissions.

4. **Fast-forward application code.** Fetch and fast-forward the VPS checkout to the exact approved target SHA. Do not run the general `pip install -r`, frontend build, migration, or any unrelated dependency update. Confirm the checkout SHA and tracked/index state after the fast-forward.

5. **Install only the accepted distribution.** As the service user `mps`, run the venv interpreter with `python -m pip install --no-deps --force-reinstall <staged-wheel>`. Do not invoke dependency resolution and do not change any other installed package. Compare `pip freeze` before/after: the only allowed package difference is `pillow-heif 1.5.0 -> 1.5.0+libheif1.23.2`. Run `pip check` and imports.

6. **Native verification as `mps`, before restart.** Using `/opt/mps-platform/venv/bin/python` under `runuser -u mps`, require `pillow-heif==1.5.0+libheif1.23.2`; `libheif_info()` libheif >=1.23.2; libde265 decoder 1.1.1; x265 encoder 4.2 and ABI `.so.216`. Locate `_pillow_heif*.so`; require RPATH `$ORIGIN/pillow_heif.libs`; require `ldd` to resolve bundled `libheif*.so.1.23.2`, bundled libde265 and bundled x265 `.so.216`; reject any 1.23.1 resolution or missing library. Perform the same isolated RGBA HEIC encode/decode round-trip used locally and clean its temporary output.

7. **Permissions/readability gate before restart.** Ensure the backup's `umask 077` has not leaked into the checkout. Record `stat` for every changed tracked file. Require normal tracked source/config files to be non-secret and readable by `mps` (expected 644 files/755 directories), then explicitly run `runuser -u mps -- test -r` for `backend/app/api/media.py`, `backend/requirements.txt`, `backend/requirements-heif.lock`, and all imported application files changed by the release. Verify the venv extension and bundled libraries are readable/executable by `mps`. Do not chmod secrets, backups, SSH keys, or `.env` to 644. Any unreadable application file stops rollout before restart.

8. **Exactly one planned restart.** Capture PID, `NRestarts`, and health immediately before the change. Invoke `systemctl restart mps-backend` once. Wait for `active/running` and `/api/v1/health`; record the new PID and verify there was no crash-loop or unplanned second restart. Run `deploy/smoke.sh` and retain complete exit codes/output. Do not restart frontend/nginx or run migrations.

9. **Live production media verification.** Use the established temporary-reader procedure without exposing credentials or identifiers. Upload a real HEIC/HEIF and a JPEG to the real production endpoint. Require HTTP 200 for both. For each response require thumbnail/medium/large metadata and all six WebP/AVIF files; GET every public variant, verify MIME, decode, dimensions, alpha/orientation fixture where applicable, and medium byte budget. Also verify an HEIF MIME/filename disguise follows the safe decoder path and malformed/truncated HEIF returns a predictable 422 rather than 500.

10. **Cleanup and closeout.** Delete only the exact test media files and temporary test principal created by step 9, then prove the recorded identifiers/files have remaining count zero. Re-run health and smoke, confirm stable PID/service state, exact Git SHA, package/native versions, tracked/index cleanliness, and preservation of the known VPS untracked artifacts. Only then may SEC-HEIF-UPGRADE be changed from `in_progress` to `passing` with live evidence.

## Mandatory paired rollback

Rollback is atomic at the application/wheel boundary. Never restore just one component.

- **Forbidden state A:** guarded HEIF-enabled application code with the old vulnerable libheif 1.23.1 wheel.
- **Forbidden state B:** stopgap application code with the new custom wheel; it is safe but is still an unapproved, inconsistent rollback state.
- **Required rollback:** stop the backend, restore the previous stopgap Git revision/backend files and reinstall the preserved old `pillow-heif==1.5.0` wheel with `--no-deps` as one rollback unit. Before starting, prove the source is the stopgap allowlist and native runtime is the backed-up 1.23.1 package; repeat the application-file readability gate. Start once, require HEIC/HEIF 422, JPEG 200 with six variants, health and smoke, and record the paired rollback evidence.

Rollback begins immediately on wheel hash/tag mismatch, unexpected dependency drift, native version/RPATH/`ldd` failure, unreadable application files, import/`pip check` failure, service readiness failure, crash-loop, smoke failure, HEIC/JPEG contract failure, unexpected 500, or incomplete cleanup.
