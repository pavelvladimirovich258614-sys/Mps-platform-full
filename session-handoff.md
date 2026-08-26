# Session handoff — МПС

## Current verified state — 2026-08-26

- F15–F36 are passing and production-deployed. F37 remains `in_progress`: Sessions A (`4f86725`) and B (`df36dc2`) are deployed; Sessions C/D are untouched.
- F38 remains `in_progress`: Packages 1 (`9d18156`), 2 (`a97327c`) and 3 (`21e55ac`) are production-deployed. Do not start the separately deferred duplicate-run protection or Иришка admin settings UI without a new plan and approval.
- F39 is passing and production-deployed at `e688773`. The default public feed excludes fishka, `/fishki` requests `type=fishka`, and author-profile queries retain all published post types.
- F40 is passing and production-deployed at `4f868ef`: its frontend bundle was rebuilt with production VITE values, `localhost` absent, and smoke passed; mps-backend stayed active without restart.
- F41 is locally `passing` as code. `POST /api/v1/internal/telegram-webhook` fail-closes on the Telegram secret header, accepts reply updates only from the configured manager chat or lawyer account, and reuses the Question/Notification transition. Outbound relay errors now have token-free logs and exceptions. Runtime activation awaits a new BotFather token, server secret and explicit setWebhook approval; the four queued Telegram updates are intentionally preserved.
- F42 is `passing` and production-deployed at `3d6ac1c`: the shared MiniMax transport strips a complete leading `<think>…</think>` block before direct Q&A or forum autoreply returns the answer. Backend restart health and smoke passed; frontend was unchanged.

## F41 local implementation evidence

- RED `D:\Python312\python.exe -m pytest tests/test_qa.py -k "telegram_webhook or telegram_relay_error" -q --color=no --basetemp D:\AI\tmp\mps-f41-red-contract` — 5 expected failures: missing route returned 404 and raw HTTPStatusError included the test token URL.
- GREEN same target — 5 passed: absent/wrong secret → 401 without persistence; manager and lawyer replies both answer their Question; the emitted ERROR and raised exception omit the token.
- Full `test_qa.py` — 14 passed. Full backend groups — 26 passed; 46 passed/3 skipped; 29 passed; 12 passed — 113 passed/3 skipped total; collect-only 116.
- Activation command is prepared but not executed: `curl --fail-with-body --silent --show-error --data-urlencode 'url=https://mir.pod-solncem.ru/api/v1/internal/telegram-webhook' --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}" --data-urlencode 'allowed_updates=["message"]' "https://api.telegram.org/bot${RELAY_BOT_TOKEN}/setWebhook"`. It intentionally omits `drop_pending_updates` to retain pending replies.

## F42 evidence

- RED `D:\Python312\python.exe -m pytest tests/test_qa.py -k reasoning -q --color=no --basetemp D:\AI\tmp\mps-f42-red-outside` — 1 expected failure / 2 passed: `/qa/irishka` returned the raw `<think>` prefix.
- GREEN same target — 3 passed: closed leading reasoning is removed, normal text is unchanged, and unclosed `<think>` remains unchanged to avoid data loss.
- Full backend: 26 passed; 46 passed/3 skipped; 24 passed; 12 passed — 108 passed/3 skipped total. `npm run build` — success, 116 modules, standard Vite chunk-size warning. `./init.sh` stopped only at the external Hermes/desktop global `pip check`. `3d6ac1c` was subsequently deployed backend-only with a fresh PostgreSQL backup, healthy restart and smoke pass.

## F41 evidence

- `getWebhookInfo` of the verified current relay bot: `url=""`, `pending_update_count=4`, without a reported Telegram delivery error. This is neither an active webhook nor evidence of polling.
- `/opt/mps-platform/bot_bridge/aiogram_router.py` is only a reusable router. No MPS unit/process loads it. Backend/system logs have no `/api/v1/internal/qa-answer` or bridge event today; nginx has only unrelated `/webhook/max` traffic.
- The router's normal manager-group reply mapping is correct in principle: it filters `F.reply_to_message` and the manager chat, then reads `#Q{id}` from the original bot message. Aiogram documents `reply_to_message` for same-chat replies. Router currently excludes lawyer chat by design.
- Read-only database check: #Q4 has outgoing Telegram message ID but status OPEN and no answer.
- `./init.sh` stopped only at the known external Hermes/desktop global `pip check` before MPS tests; no environment repair was attempted.

## Next action and boundaries

Create the authorised local F41 commit, then wait for separate push/deploy approval. Do not register the webhook, generate or write TELEGRAM_WEBHOOK_SECRET, replace RELAY_BOT_TOKEN, restart production backend or consume queued updates until the owner supplies the new token and explicitly authorizes activation. Do not touch F37 C/D, F38 deferred work, Unisender/HostKey/email or MiniMax credentials.
