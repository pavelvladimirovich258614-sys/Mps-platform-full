# Session handoff — 2026-08-22 F12 profile entry and header UI

## Текущее состояние F12
- Локально готова F12 «Вход в публичный профиль и UI шапки»; production не менялся и ждёт отдельного подтверждения Павла. Авторизованный клик по avatar/name в desktop header и «Мой профиль» в mobile sheet ведёт на `/users/{own id}`. У гостя сохранён вход через существующую modal.
- На собственной public profile есть «Редактировать профиль»: он переиспользует `Profile` modal без дублирования формы; logout остаётся там. У других пользователей прежняя follow/unfollow-кнопка. Добавлено `...` menu: copy canonical `/users/{id}` via `navigator.clipboard`, `navigator.share` с copy fallback, toast и Escape/outside close.
- Визуально: компактная зона name/счётчики/actions/avatar, отдельная неинтерактивная строка «Посмотреть подписчиков · N», подчёркнутые tabs. Username и follower list не реализованы намеренно: public username отсутствует в схеме, а backend API отдаёт лишь counts.

## F12 верификация
- RED: 2 теста упали до реализации (header navigation и owner menu/actions). GREEN targeted: 13 passed. Final frontend: 38 passed; `npm run build` — 49 modules. Final backend: 58 passed in 17.00s.
- `./init.sh` вне sandbox повторно блокируется только внешним Hermes `pip check` (missing charset-normalizer for pdfminer-six/reportlab/requests); не менять Hermes в MPS scope.
- Agent-browser skill прочитан для visual review, но binary не установлен; browser screenshot не выполнен. CSS/DOM композиция вручную сопоставлена с приложенными Substack screenshots.

## Предстоящий шаг
- После одобрения: один F12 production deploy с build-time `VITE_API_URL`/`VITE_TELEGRAM_BOT_USERNAME`, `npm run build`, restart не нужен (frontend-only), `deploy/smoke.sh` и browser/manual smoke. Список подписчиков и username — отдельные планируемые пакеты.

# Предыдущий контекст — 2026-08-22 public profile, part B

## Реализовано и задеплоено
- F11 «Публичный профиль, часть Б» готова в четырёх коммитах: `ed9025d` (UserFollow/API), `dedc865` (UI счётчиков/подписки), `6c09ae4` (вкладка «Лайки»), `994c072` (ссылки на авторов).
- Миграция `20260822_0009` создаёт `user_follows`: composite PK `follower_id/following_id`, CHECK против self-follow, FK CASCADE и индекс по `following_id`.
- `GET /api/v1/users/{id}/profile` отдаёт real `followers_count`, `following_count`, `is_following`; POST/DELETE follow требуют JWT. Anonymous/banned profiles не раскрываются; duplicate follow = 409, self-follow = 422.
- Public profile скрывает follow button на собственном профиле, выводит реальные счётчики и показывает published posts во вкладке «Лайки» через `GET /users/{id}/likes`.
- Post DTO теперь содержит минимальный `author {id,name,avatar_url}`; имена в Feed и comments ведут на `/users/{id}`.

## Верификация
- Follow RED -> GREEN: 7 профильных тестов; likes RED -> GREEN: 8; author API RED -> GREEN: 10 (posts+profile).
- Fresh SQLite Alembic прошёл до `20260822_0009`; UserFollow DDL отдельно скомпилирован PostgreSQL dialect.
- Рабочий `backend/.env` выровнен с official goapi default. Final backend без override: `58 passed in 11.41s`; frontend `36 passed`; `npm run build` успешен (49 modules).

## Внешняя заметка о harness
- `./init.sh` вне sandbox реально запущен, но остановился на внешнем Hermes `pip check`: отсутствует `charset-normalizer` для `pdfminer-six`, `reportlab`, `requests`. Не чинить Hermes-зависимости в MPS-задаче.
- Это не блокирует F11: `feature_list.json` переведён в `passing` после чистого полного pytest.

## Production
- `https://mir.pod-solncem.ru` задеплоен единым rollout на `30d65de`. Backup перед deploy: `/root/backups/mps-f11-20260822T115405Z`. PostgreSQL миграция `20260822_0009 (head)` применена, `mps-backend` active/ready; frontend пересобран с проверенными production VITE values, без localhost API URL в assets; `deploy/smoke.sh` — `[OK]`.
- Safe live API smoke: follow -> 201 и +1 счётчик; repeat -> 409; self-follow -> 422 (контракт F11, не 404/403); unfollow -> 200 и исходный счётчик. Два синтетических неперсональных профиля после проверки скрыты (`is_anonymous=true`).
- В production сейчас 0 published posts и 0 approved comments. Поэтому live Likes/feed/comments карточки и буквальный click smoke автора не имеют fixture; контент искусственно не создавался. SPA route `/users/1` отвечает 200, а реальные rendered interactions покрыты локальными F11 frontend/API tests.
- Unisender production TCP blocker сохраняется: не менять firewall или provider в рамках F11.
