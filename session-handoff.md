# Session handoff — МПС

## Coordination checkpoint — 2026-08-28

- This was a diagnostic-only relay: sub-agent A → inspector → B → inspector → V with individual inspectors for F48a/F48b/F48c. No application code, tests, database, production configuration, deployment or VPS files were changed.
- Tracker state is now 48 historical `passing` records plus five inspected `in_progress` records: F46, F47, F48a, F48b and F48c. None of the five is `passing`.
- Startup: `./init.sh` was run outside the Windows sandbox and stopped at the known external Hermes/desktop global `pip check` before MPS pytest. The external issue remains separate.
- Git: local worktree was clean before this tracker update, with local `main` `0376679` one tracker-only commit ahead of `origin/main` `01c505d`. VPS tracked tree is `01c505d` and `mps-backend` is active, but pre-existing untracked deployment artefacts remain untouched. Push is not authorized.

## Accepted diagnostics

1. **F46 — Иришка admin UI.** `irishka_enabled` and `irishka_delay_min` are DB-backed if rows exist, with runtime fallbacks true/30; they affect forum autoanswers only. Scheduler cadence, prompt/triggers, MiniMax configuration and shared timeout/retry/token policy remain code/env contracts. Minimal future UI: admin-only compact block on `/countries` with forum-autoanswer toggle, delay 1–10080 and explicit Q&A boundary. First report was corrected because fallbacks are not proof of stored DB defaults.
2. **F47 — forum N+1.** Instrumented 50-row profiling found one SELECT for countries, topics and messages. Do not replace the aggregate/scalar/explicit-join shapes with eager loading. Optional future test-only guard covers all three endpoints. Cursor validation/scoping and query-cost/index questions are separate findings, not F47 implementation authorization.
3. **F48a — Drafts.** Confirmed: staff can delete another author’s draft by ID; a list-load error looks empty; failed deletion closes confirmation. Future scope: draft-only owner 404 guard preserving staff deletion of published posts, alert/retry, and retained failure dialog/card.
4. **F48b — Reviews.** Real pending/approved/moderation backend, not a placeholder. Confirmed frontend gaps: duplicate submit, no list error/empty state, no moderation consumer. Moderation UI needs a product role decision (editor versus admin). Photo/guest-login behaviour is a separate scope.
5. **F48c — Subscription.** Real double opt-in and digest job, but no usable delivered unsubscribe link, no canonical email validation or persisted consent, misleading repeated-confirmed UX, ignored digest delivery failures, unescaped digest title/excerpt and undefined order. The Unisender TCP outage is historical tracker evidence only. Before implementation choose temporary truthful suspension of email collection (recommended) or approve consent/retention/outbox/retry architecture.

## Next action

Pavel selects one isolated feature/package and explicitly approves its implementation plan. F48c requires the wording/retention decision first. Web design remains last.
