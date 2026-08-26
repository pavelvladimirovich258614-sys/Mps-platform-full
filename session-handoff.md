# Session handoff — МПС

## Current verified state — 2026-08-26

- F15–F36 are passing and production-deployed. F37 remains `in_progress`: Sessions A (`4f86725`) and B (`df36dc2`) are deployed; Sessions C/D are untouched.
- F38 remains `in_progress`: Packages 1 (`9d18156`), 2 (`a97327c`) and 3 (`21e55ac`) are production-deployed. Do not start the separately deferred duplicate-run protection or Иришка admin settings UI without a new plan and approval.
- F39 is passing and production-deployed at `e688773`. The default public feed excludes fishka, `/fishki` requests `type=fishka`, and author-profile queries retain all published post types.
- F40 is passing and production-deployed at `4f868ef`: its frontend bundle was rebuilt with production VITE values, `localhost` absent, and smoke passed; mps-backend stayed active without restart.
- F41 is `in_progress` as read-only diagnosis. Outbound MPS Q&A relay works, but incoming Telegram replies cannot be received: the current relay bot has an empty webhook URL and 4 pending updates, while MPS has no long-polling worker. The only active polling service is a separate Pod Solncem bot (id 8911332115); it does not import MPS `bot_bridge`, while the relay bot is id 8982961972. #Q4 remains MANAGER/OPEN without answer.
- F42 is locally `passing`: the shared MiniMax transport strips only a complete leading `<think>…</think>` block, so both direct «Иришка ИИ» Q&A and forum autoreply expose only the final answer. No API, frontend or schema change occurred; push/deploy are unapproved.

## F42 evidence

- RED `D:\Python312\python.exe -m pytest tests/test_qa.py -k reasoning -q --color=no --basetemp D:\AI\tmp\mps-f42-red-outside` — 1 expected failure / 2 passed: `/qa/irishka` returned the raw `<think>` prefix.
- GREEN same target — 3 passed: closed leading reasoning is removed, normal text is unchanged, and unclosed `<think>` remains unchanged to avoid data loss.
- Full backend: 26 passed; 46 passed/3 skipped; 24 passed; 12 passed — 108 passed/3 skipped total. `npm run build` — success, 116 modules, standard Vite chunk-size warning. `./init.sh` stopped only at the external Hermes/desktop global `pip check`.

## F41 evidence

- `getWebhookInfo` of the verified current relay bot: `url=""`, `pending_update_count=4`, without a reported Telegram delivery error. This is neither an active webhook nor evidence of polling.
- `/opt/mps-platform/bot_bridge/aiogram_router.py` is only a reusable router. No MPS unit/process loads it. Backend/system logs have no `/api/v1/internal/qa-answer` or bridge event today; nginx has only unrelated `/webhook/max` traffic.
- The router's normal manager-group reply mapping is correct in principle: it filters `F.reply_to_message` and the manager chat, then reads `#Q{id}` from the original bot message. Aiogram documents `reply_to_message` for same-chat replies. Router currently excludes lawyer chat by design.
- Read-only database check: #Q4 has outgoing Telegram message ID but status OPEN and no answer.
- `./init.sh` stopped only at the known external Hermes/desktop global `pip check` before MPS tests; no environment repair was attempted.

## Next action and boundaries

Create the authorised local F42 commit, then wait for separate push/deploy approval. Await an explicit F41 plan/approval before registering a webhook, changing a bot service, consuming the queued updates, or modifying `bot_bridge`. The likely F41 implementation must select one inbound transport for the current relay bot and include manager plus lawyer routing. Do not touch F37 C/D, F38 deferred work, Unisender/HostKey/email or MiniMax credentials.
