# Session handoff — 2026-08-22 public profile, part B

## Реализовано локально, production не трогали
- F11 «Публичный профиль, часть Б» готова в четырёх коммитах: `ed9025d` (UserFollow/API), `dedc865` (UI счётчиков/подписки), `6c09ae4` (вкладка «Лайки»), `994c072` (ссылки на авторов).
- Миграция `20260822_0009` создаёт `user_follows`: composite PK `follower_id/following_id`, CHECK против self-follow, FK CASCADE и индекс по `following_id`.
- `GET /api/v1/users/{id}/profile` отдаёт real `followers_count`, `following_count`, `is_following`; POST/DELETE follow требуют JWT. Anonymous/banned profiles не раскрываются; duplicate follow = 409, self-follow = 422.
- Public profile скрывает follow button на собственном профиле, выводит реальные счётчики и показывает published posts во вкладке «Лайки» через `GET /users/{id}/likes`.
- Post DTO теперь содержит минимальный `author {id,name,avatar_url}`; имена в Feed и comments ведут на `/users/{id}`.

## Верификация
- Follow RED -> GREEN: 7 профильных тестов; likes RED -> GREEN: 8; author API RED -> GREEN: 10 (posts+profile).
- Fresh SQLite Alembic прошёл до `20260822_0009`; UserFollow DDL отдельно скомпилирован PostgreSQL dialect.
- Final test-only override `UNISENDER_GO_BASE_URL=goapi`: backend `58 passed in 11.31s`; frontend `36 passed`; `npm run build` успешен (49 modules).

## Формальный harness blocker
- Обычный локальный full pytest читает пользовательский `UNISENDER_GO_BASE_URL=go1`, а пять старых email/respx tests жёстко мокаются на `goapi`; это не регрессия F11. Не менять `.env` и тесты вне отдельного scope.
- `./init.sh` вне sandbox реально запущен, но остановился на внешнем Hermes `pip check`: отсутствует `charset-normalizer` для `pdfminer-six`, `reportlab`, `requests`. Не чинить Hermes-зависимости в MPS-задаче.
- Поэтому `feature_list.json` сохраняет F11 как `in_progress` до воспроизводимого общего harness, хотя функциональная работа и её целевые проверки завершены.

## Production
- `https://mir.pod-solncem.ru` остаётся на прежнем revision `7e8eb07`; deploy F11 не выполнялся. Нужны отдельные подтверждение Павла, backup, один deployment, migration, frontend build и smoke.
- Unisender production TCP blocker сохраняется: не менять firewall или provider в рамках F11.
