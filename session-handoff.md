# Session handoff — МПС

## Next session first — P0 post-media Stage 4 approval gate

1. Read `AGENTS.md`; run `./init.sh`; read `claude-progress.md`, `feature_list.json` and this handoff. Git Bash Win32 Error 5/global pip-check issues remain known external blockers; rerun only MPS checks directly outside sandbox when necessary.
2. `P0-POST-MEDIA` Stages 1–3 are the latest local-only commits. The feature remains `in_progress`. Do not start Stage 4 until the owner explicitly confirms it in a separate message.
3. Stage 4 is the point migration of the already published `poezdka-v-tailand-2026`: use the approved SSH key, inspect the exact production DB/media paths read-only, create verified rollback copies of every original file and affected DB values, generate four optimized files under new names, then atomically update `cover_url` and body HTML links. Do not delete or overwrite originals.
4. After Stage 4 verification, update all three trackers, create one local `[in_progress]` commit and stop. Do not start throttled Stage 5, push or deploy without the next confirmation.
5. WIDG-4 remains locally verified `passing` but publication is paused until all five media stages close and the owner approves the combined rollout.

## P0-POST-MEDIA Stage 3 — committed frontend checkpoint

### Completed package

- `frontend/app/src/components/ResponsivePostImage.tsx` centralizes `(max-width: 900px) 100vw, 760px` and derives 320/960/1600 WebP+AVIF sets from the backend large-variant URL while retaining the large WebP fallback.
- `ArticleComments`, `Feed`, `PublicProfile`, `PostComposer` and TipTap image previews use the shared responsive renderer. Article/feed hero and active carousel frames are eager; below-fold inline and liked-post images are lazy; every rendered post image decodes asynchronously.
- `RichTextContent` allows only the approved `loading`, `decoding`, `srcset` and `sizes` image attributes in addition to the previous strict allowlist. Inline images are enhanced after DOMPurify; generated AVIF `<source>` markup is created only from the already-sanitized URL.
- `ImageCarousel` renders only the active image and its responsive sources. No inactive slide URL appears in the DOM before arrow/dot interaction.
- Minimal scoped CSS makes `<picture>` preserve the existing cover/carousel/editor layout; no theme token or visual design was changed.

### RED→GREEN and verification

- Fresh accepted RED: `ImageCarousel.test.tsx` — 1 failed / 1 passed because the active image still had `srcset=null`; the inactive-slide guard was already green.
- Expanded RED: six related files — 7 expected failures / 44 passed for missing responsive attributes, AVIF source, inline lazy loading and sanitizer allowance.
- Target GREEN: six files / 51 tests passed.
- Fresh full frontend: `npm test` — 29 files / 190 tests passed.
- Production build: `npm run build` — 123 modules transformed; output JS 705.15 kB (gzip 228.02 kB). Build succeeded with only the existing CJS/chunk-size warnings.
- Browser matrix: light/dark at 375/768/1024/1440 passed. Cover, inline and active carousel images fit every viewport with no horizontal overflow; all exposed AVIF source + WebP 320/960/1600 `srcset`, `sizes` and async decoding. Inline was lazy; hero/active slide eager. The second slide was absent before action and became the only rendered frame after click in all 8 combinations.
- Accessibility/browser evidence: focus-visible was present on the carousel arrow, CSSOM parsed the reduced-motion 0.01ms fallback, console errors were empty, and text/card contrast was 16.04:1 light / 14.43:1 dark.
- `git diff --check` passed with only informational Windows line-ending notices.

### Boundary

- No backend, dependency, migration, database, existing media, VPS, push or deployment was changed in Stage 3.
- The localhost browser mock and Vite processes were stopped and the temporary browser tab was closed; no harness artifact was added to the repository.
- `P0-POST-MEDIA` correctly remains `in_progress` until Stages 4–5 finish.

## Earlier P0 checkpoints

- Stage 2 backend: `POST /media` accepts the existing up-to-10-MiB input, applies EXIF transpose and RGB/RGBA normalization, creates 320/960/1600 WebP+AVIF pairs under one UUID, never writes the original JPEG/PNG, and returns backward-compatible large WebP `url` plus `variants`.
- Each medium encoding is capped at 350 KiB. Test artifacts measured two medium WebP files at 542684 bytes total and two medium AVIF files at 434952 bytes total, both below 700 KiB.
- Stage 2 verification: new target 2/2, full `test_media.py` 13/13, full backend 130 passed / 10 known PostgreSQL-only skipped without `MPS_TEST_POSTGRES_URL`.
- Stage 1 retains the explicit initial-page budget and active-only carousel RED contracts.

## Publication and operational boundary

1. No P0 media commit has been pushed or deployed. Production media and DB were not mutated.
2. The WIDG-4 stage-3 completion commit is also local-only; its stages 1–2 are already in `origin/main`.
3. The combined rollout remains owner-gated. Before any future push/deploy, rerun HEAD/origin/VPS SHA, clean-state, BatchMode SSH, rollback, migration/head, production Vite/no-localhost/served-bundle, backend health/smoke and production browser checks.
4. Historical production application checkpoint before these local commits was `7ba81997f6dd165350395967f89789283c245918`; treat it as historical until live-revalidated.

## Known risks / boundaries

- The original Thailand post files must remain recoverable during Stage 4; use new filenames and atomically update only verified references.
- The existing build chunk-size warning remains unresolved and is outside Stage 3 scope.
- Global `init.sh` may stop on unrelated shared-environment errors; do not modify the shared environment to hide them.
- SSH key availability changed once historically. Every production session must begin with a read-only BatchMode key preflight; never guess credentials or print secrets.
- F47 and F48c were independently already marked `in_progress`; do not change their statuses during this owner-prioritized P0 exception.
