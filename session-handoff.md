# Session handoff — после F05

## Verified state
- F01–F05 passing; Alembic head `20260818_0005`; full pytest and `./init.sh`: 20 passed. Next: F06; frontend не менять до F09.

## F05 contracts
- `POST /subscribe {email}` creates/reuses a pending subscription and sends confirmation. `GET /subscribe/confirm/{token}` confirms; `GET /subscribe/unsub/{token}` deletes. Unisender errors log only and never change confirm/unsub state.
- `POST /qa {target: manager|lawyer, body}` requires JWT, creates open question, sends Telegram `#Q{id}`, and stores `tg_message_id`. `GET /qa/my` returns caller questions and answers.
- `POST /internal/qa-answer` takes `{question_id, answer, answered_by_name}` plus `X-Bot-Bridge-Secret`; 401 bad secret, 404 unknown question, success marks answered and creates `qa_answered` notification.
- `tg_relay.send()` routes manager to `MANAGERS_CHAT_ID`, lawyer to `LAWYER_TG_ID`; secrets stay in env. `python -m app.jobs.send_digest` emails confirmed subscriptions with a 7-day published-post digest.
- Deploy timer: copy `deploy/mps-digest.service` and `.timer`, then run `systemctl daemon-reload && systemctl enable --now mps-digest.timer` on VPS.
- Optional bot integration: install `bot_bridge/requirements.txt`, call `build_router(backend_url, BOT_BRIDGE_SECRET, managers_chat_id)`, then `dp.include_router(router)` in the existing bot.

## Commands
- Start/verify: `& 'C:\Program Files\Git\bin\bash.exe' ./init.sh`
- Tests: `cd backend && python -m pytest tests -q`; migrations: `cd backend && alembic upgrade head`
