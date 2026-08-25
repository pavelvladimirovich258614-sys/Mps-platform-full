# Session handoff — МПС

## Current verified state — 2026-08-25

F01–F34 remain passing and deployed. F35 remains `in_progress`; Session 1 is complete locally and is not deployed. The active production frontend remains F34 revision `3451397`; do not treat the local F35 changes as live.

## F35 Session 1 — subscriptions and publications baseline

- Existing `GET /posts?author_id={id}` and the Publications tab are regression-covered; their behavior was not changed.
- `GET /users/{id}/followers` and `GET /users/{id}/following` now return public users only, ordered by `UserFollow.created_at desc`, with `id`, `name`, `avatar_url` and viewer-relative `is_following`.
- PublicProfile now has «Подписчики» / «Подписки» sub-tabs, cards with avatar and name, and immediate «Подписаться» / «Подписан» state through the existing follow toggle API.
- There is no migration, dependency change or production deployment.

## Verification evidence

- RED backend: missing list routes returned 404 — 1 expected failure / 8 passed; GREEN `test_public_profile.py` — 9 passed.
- RED frontend: subscriptions tab was still the placeholder — 1 expected failure / 6 passed; GREEN PublicProfile + routing — 28 passed.
- Full backend — 72 passed in 22.10s; full frontend — 18 files / 107 passed; Vite production build — success, 115 modules.
- Final `./init.sh` stopped only at the external Hermes/desktop global `pip check`, before MPS tests. This external blocker is unchanged.

## Next task — F35 Session 2

Implement the agreed «Ответы» semantic: the user's own comments. Empty state must be exactly: «Пока нет ответов. Ваши ответы появятся здесь.» Likes stay as the existing liked-posts list. Activity remains separate pending an explicit product decision.

## Known boundary

Email delivery remains blocked by the external Unisender/HostKey network path. Keep `EMAIL_LOGIN_ENABLED=false`; do not change email transport, credentials, firewall or VPS networking. Production deployment of F35 Session 1 requires separate Pavel approval.
