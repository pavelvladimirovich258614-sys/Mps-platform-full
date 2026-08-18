# session-handoff.md — передача между сессиями

## Currently verified
- F01–F03 passing. Alembic применяет `20260818_0003` с countries, posts и post_likes.
- `python -m pytest tests -q --basetemp .pytest-tmp-full` — `12 passed in 1.37s`; `./init.sh` через Git Bash — `[OK]`, `12 passed in 1.44s`.

## Changes this session
- Публикации: editor CRUD, публичный список/просмотр, slug с транслитерацией, toggle-like, инкремент views и валидация shot_at для video_review.
- Media: JPEG/PNG/WebP через Pillow, предел 10 МБ и сконфигурированный `MEDIA_DIR`.
- PATCH теперь частичный: сохраняет неуказанные поля и не позволяет сделать video_review без shot_at.

## Still broken or unverified
- Production PostgreSQL/Redis/nginx не проверялись. Nginx-раздача media и видео без транскодинга остаются задачами деплоя/F10.

## Next best action
- Выполнить F04: отзывы и комментарии с премодерацией, реакции и тесты. Не менять frontend до F09.

## Commands
- Старт: `& 'C:\Program Files\Git\bin\bash.exe' ./init.sh`
- Верификация: `cd backend && python -m pytest tests -q`
- Dev-сервер: `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Миграции: `cd backend && alembic upgrade head`
