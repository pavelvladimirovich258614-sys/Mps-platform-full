# session-handoff.md — передача между сессиями

## Currently verified
- F01–F04 passing. Alembic применяет `20260818_0004` с reviews, comments, comment_reactions, review_tokens и notifications.
- `python -m pytest tests -q --basetemp .pytest-f04-full` — `16 passed in 3.24s`; `./init.sh` через Git Bash — `[OK]`, `16 passed in 3.27s`.

## Changes this session
- Отзывы и комментарии получают статус pending; публичные списки показывают только approved.
- Editor approve/reject возвращает pending_count; approve сохраняет notification автору.
- Reaction по `(comment_id, user_id)` заменяет прежний emoji. Ответы на ответы отклоняются с 422.
- `/internal/review-tokens` под `X-Bot-Bridge-Secret` выпускает одноразовый token на 7 дней; by-token создаёт bot review без авторизации, expired -> 410.

## Still broken or unverified
- Production PostgreSQL/Redis/nginx не проверялись. Доставка review-token пользователю Telegram-ботом будет в F05; чтение notifications API — F08.

## Next best action
- Выполнить F05: email double opt-in, дайджест и Telegram-релей вопросов. Не менять frontend до F09.

## Commands
- Старт: `& 'C:\Program Files\Git\bin\bash.exe' ./init.sh`
- Верификация: `cd backend && python -m pytest tests -q`
- Dev-сервер: `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Миграции: `cd backend && alembic upgrade head`
