# Session handoff — МПС

## Current verified state — 2026-08-26

- F15–F36 are passing and production-deployed. F37 remains `in_progress`: Sessions A (`4f86725`) and B (`df36dc2`) are deployed; Sessions C/D are untouched.
- F38 remains `in_progress`: Packages 1 (`9d18156`), 2 (`a97327c`) and 3 (`21e55ac`) are production-deployed. Do not start the separately deferred duplicate-run protection or Иришка admin settings UI without a new plan and approval.
- F39 is passing and production-deployed at `e688773`. The default public feed excludes fishka, `/fishki` requests `type=fishka`, and author-profile queries retain all published post types.
- F40 is passing and production-deployed at `4f868ef`: its frontend bundle was rebuilt with production VITE values, `localhost` absent, and smoke passed; mps-backend stayed active without restart.
- F41 is fully `passing`, deployed and production-activated at `1782b5a`. `POST /api/v1/internal/telegram-webhook` fail-closes on the Telegram secret header, accepts reply updates only from the configured manager chat or lawyer account, and reuses the Question/Notification transition. setWebhook is registered at the production HTTPS endpoint; live manager and lawyer replies are persisted end-to-end. Outbound relay errors have token-free logs and exceptions.
- F42 is `passing` and production-deployed at `3d6ac1c`: the shared MiniMax transport strips a complete leading `<think>…</think>` block before direct Q&A or forum autoreply returns the answer. Backend restart health and smoke passed; frontend was unchanged.
- F43 is `passing` locally and not deployed: qa_answered notifications display the linked Question's manager/lawyer source, open the correct Q&A tab and focus the exact thread. An open modal polls every 30 seconds only while an unanswered Question exists and stops after answer or unmount.

## F43 evidence

- RED `npm test -- --run src/App.routing.test.tsx src/hooks/useQA.test.tsx` — 3 expected failures / 30 passed: notification rows were not actionable and `useQA` did not perform the timed refetch.
- GREEN same target — 33 passed. It covers manager/lawyer labels, exact-thread deep-link, selective read, loading of question/answer, one-time scroll and conditional polling cleanup.
- Full frontend suite — 21 files / 129 tests passed. `npm run build` — success, 116 modules, standard Vite chunk-size warning only.
- Final `./init.sh` stopped only at the known external Hermes/desktop global `pip check` before MPS tests. No backend, API, schema, migration, credential or production state changed.

## F41 complete evidence

- RED `D:\Python312\python.exe -m pytest tests/test_qa.py -k "telegram_webhook or telegram_relay_error" -q --color=no --basetemp D:\AI\tmp\mps-f41-red-contract` — 5 expected failures: missing route returned 404 and raw HTTPStatusError included the test token URL.
- GREEN same target — 5 passed: absent/wrong secret → 401 without persistence; manager and lawyer replies both answer their Question; the emitted ERROR and raised exception omit the token.
- Full `test_qa.py` — 14 passed. Full backend groups — 26 passed; 46 passed/3 skipped; 29 passed; 12 passed — 113 passed/3 skipped total; collect-only 116.
- `1782b5a` was deployed backend-only. A freshly generated webhook secret and verified replacement bot token were written only to the protected production environment after config backup `/root/backups/mps-f41-webhook-backend.env-20260826T052139Z` (SHA-256 `d8d9cd7a1046ecbedcbdc0510427ebac9b0e44c5c6a22bceca4f6fee662339fe`). setWebhook returned `ok:true` for `https://mir.pod-solncem.ru/api/v1/internal/telegram-webhook` without dropping queued updates.
- Fresh closeout: getWebhookInfo reports the exact endpoint, `allowed_updates=[message]`, queue 0 and no last error; mps-backend is active and healthy. #Q4 manager and #Q5/#Q6 lawyer are `answered` with answer, responder, answered_at and outgoing message ID saved. Nginx recorded HTTP 200 for the corresponding incoming Telegram webhook requests.

## F42 evidence

- RED `D:\Python312\python.exe -m pytest tests/test_qa.py -k reasoning -q --color=no --basetemp D:\AI\tmp\mps-f42-red-outside` — 1 expected failure / 2 passed: `/qa/irishka` returned the raw `<think>` prefix.
- GREEN same target — 3 passed: closed leading reasoning is removed, normal text is unchanged, and unclosed `<think>` remains unchanged to avoid data loss.
- Full backend: 26 passed; 46 passed/3 skipped; 24 passed; 12 passed — 108 passed/3 skipped total. `npm run build` — success, 116 modules, standard Vite chunk-size warning. `./init.sh` stopped only at the external Hermes/desktop global `pip check`. `3d6ac1c` was subsequently deployed backend-only with a fresh PostgreSQL backup, healthy restart and smoke pass.

## F41 original diagnosis evidence

- `getWebhookInfo` of the verified current relay bot: `url=""`, `pending_update_count=4`, without a reported Telegram delivery error. This is neither an active webhook nor evidence of polling.
- `/opt/mps-platform/bot_bridge/aiogram_router.py` is only a reusable router. No MPS unit/process loads it. Backend/system logs have no `/api/v1/internal/qa-answer` or bridge event today; nginx has only unrelated `/webhook/max` traffic.
- The router's normal manager-group reply mapping is correct in principle: it filters `F.reply_to_message` and the manager chat, then reads `#Q{id}` from the original bot message. Aiogram documents `reply_to_message` for same-chat replies. Router currently excludes lawyer chat by design.
- Read-only database check: #Q4 has outgoing Telegram message ID but status OPEN and no answer.
- `./init.sh` stopped only at the known external Hermes/desktop global `pip check` before MPS tests; no environment repair was attempted.

## Next action and boundaries

Commit the approved F43 frontend/tests/trackers locally, then wait for separate push/deploy approval. Do not touch F37 C/D, F38 deferred work, Unisender/HostKey/email or MiniMax credentials.
