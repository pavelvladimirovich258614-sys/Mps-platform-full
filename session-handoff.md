# Session handoff — после F07

## Verified state
- F01–F07 passing; Alembic head `20260818_0007`; full pytest and `./init.sh`: 26 passed. Next: F08; frontend не менять до F09.

## F07 contracts
- Migration `20260818_0007` creates `settings` key/value records `irishka_delay_min=30`, `irishka_enabled=true`, and the service user `irishka@system.local` / «Иришка · ИИ-помощник» with editor role.
- `services.irishka.run(session_factory, settings)` reads settings on each execution. Every five minutes `AsyncIOScheduler` invokes it from FastAPI lifespan. If disabled it makes no change; it only processes topics older than the configured delay and with no existing messages, so no second AI response is created.
- Non-trigger topics call `POST ${MINIMAX_BASE_URL}/chat/completions` with `Authorization: Bearer ${MINIMAX_API_KEY}`, model, system/user messages and `max_completion_tokens=500`; reply is `choices[0].message.content`. `MINIMAX_BASE_URL` defaults to `https://api.minimax.io/v1`.
- Titles containing price/visa/document markers do not call MiniMax: they receive a short manager handoff and create Question(target=manager) for the topic author. The prompt does not give prices or legal guarantees.
- Production needs a non-empty `MINIMAX_API_KEY`: an empty value produces httpx LocalProtocolError before request transmission. F08 should expose PATCH /admin/settings for `irishka_enabled` without redeploy; keep one API scheduler instance in deployment.

## F06 contracts
- `GET /countries`, `GET /countries/{id}/topics?search=`, `POST /countries/{id}/topics`, `GET/POST /topics/{id}/messages` are ready. Reader and premium share FORUM_TOPIC_LIMIT=3; only editor/admin unlimited.
- Search uses casefold plus short common prefix for MVP Cyrillic endings; not full morphology.
- New message increments messages_count, updates last_message_at and notifies topic author only when another user posts.

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
