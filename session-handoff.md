# Session handoff — МПС

## Current verified state — 2026-08-26

- F15–F36 are passing and production-deployed. F37 remains `in_progress`: Sessions A (`4f86725`) and B (`df36dc2`) are deployed; Sessions C/D are untouched.
- F38 remains `in_progress`: Packages 1 (`9d18156`), 2 (`a97327c`) and 3 (`21e55ac`) are production-deployed. Do not start the separately deferred duplicate-run protection or Иришка admin settings UI without a new plan and approval.
- F39 is locally verified and marked `passing`; it is uncommitted and production deployment is unapproved. The default public feed excludes fishka, `/fishki` requests `type=fishka`, and author-profile queries retain all published post types.

## F39 evidence

- RED backend: default `GET /posts` returned fishka ID 3. RED frontend: ordinary Feed rendered fishka and `/fishki` omitted `type=fishka`.
- GREEN target: backend 1 passed; frontend 2 files / 35 passed.
- Full backend: 105 passed / 3 expected PostgreSQL-only skips across complete Windows-safe groups. Full frontend: 19 files / 124 passed. Build: 116 modules, normal Vite chunk-size warning only.
- Final `./init.sh` stopped only at the known external Hermes/desktop global `pip check` before MPS pytest; no environment repair was attempted.

## Next action and boundaries

Await explicit approval to commit F39 locally, then separate approval for push and production deployment. Do not touch F37 C/D, F38 deferred work, Unisender/HostKey/email, MiniMax credentials or production state before that approval.
