# claude-progress.md — журнал прогресса МПС

## Current Verified State
- Repository root directory: mps-platform/
- Standard startup path: ./init.sh, затем `uvicorn app.main:app --reload --port 8000 --app-dir backend`
- Standard verification path: `python -m pytest backend/tests -q`
- Feature state: F01–F12 passing; все три этапа F09 (`F09a1`, `F09a2`, `F09b`) passing; публичный профиль пользователя, части А и Б и вход в собственный public profile задеплоены. `./init.sh` остаётся заблокирован внешним Hermes `pip check`, но это не MPS feature gate.
- Deploy state: платформа развёрнута и живая на `https://mir.pod-solncem.ru`. MPS использует отдельные PostgreSQL DB/role, Redis DB 2 и backend на `127.0.0.1:8001`; nginx, certbot, HSTS, systemd timers и PostgreSQL backup проверены на VPS.
- Audit boundary: C-05 остаётся отдельно согласованной security-задачей и не менялся; I-01, I-06a, I-13, I-15, I-16, I-18 и I-20 закрыты 2026-08-20. I-21 отложен до pre-launch юридической проверки. I-06b (единая sanitization policy) остаётся открытым и требует продуктового решения о допустимом содержимом полей.
- Auth/UI state: production build использует `https://mir.pod-solncem.ru/api/v1` и `Reg_Under_the_sun_bot`; закрыты найденные UI-проблемы login/profile (logout, avatar upload, золотой online-индикатор, toast поверх modal, email input). Telegram Login Widget и callback работают; role storage устойчиво читает legacy `ADMIN` и текущие строчные значения, что подтверждено live callback 200.
- Email state: UnisenderGo transport использует официальный default `goapi.unisender.ru` (с возможностью override на go1/go2) и `X-API-KEY`; payload `message/recipients/body/subject/from_email` проверен mock-тестами. Production delivery сейчас заблокирована внешним TCP timeout до сети Unisender `31.184.200.*:443`: goapi и go1 недоступны, при этом ya.ru/google.com доступны, а local UFW/iptables outgoing не блокируют. Email-код и digest не работают до восстановления маршрута или смены транспорта/provider.
- Next best action: выбрать отдельный следующий пакет: мелкая косметика счётчиков подписок, полноценный список подписчиков, устранение сетевой блокировки Unisender или наполнение платформы реальным контентом.

## Session Record

### Session 32 — 2026-08-22 (Pavel, final production confirmation)
- Goal: зафиксировать пользовательское подтверждение завершённых production F11 и F12.
- Completed: Павел подтвердил вживую единый rollout F11 «Публичный профиль, часть Б»: UserFollow и follow API, реальные счётчики, вкладка «Лайки» и ссылки на профили авторов. F12 «Вход в публичный профиль и UI шапки» также задеплоена и подтверждена скриншотом: клик на avatar/name открывает собственный public profile, как задумано.
- Verification run: для F11 ранее пройдены миграция `20260822_0009`, safe live follow/unfollow smoke и `deploy/smoke.sh`; для F12 — frontend production deploy и `deploy/smoke.sh`. Подтверждённый Павлом F12 flow: header avatar/name → `/users/{own id}`, «Редактировать профиль» открывает существующую modal, меню `...` выполняет copy-link.
- Evidence recorded: delivery records F11 `394df80` и F12 `3d660a0`; подтверждение Павла добавлено в session record и handoff.
- Commits: F11 code `ed9025d`, `dedc865`, `6c09ae4`, `994c072`; F12 code `bdd8962`; deployment records `394df80`, `3d660a0`.
- Known risks: строка «Посмотреть подписчиков · N» и счётчики `N подписчиков · N подписок` пока дублируют информацию; функциональный список подписчиков намеренно не добавлялся. Unisender TCP blocker остаётся внешней инфраструктурной проблемой.
- Next best action: выбрать один отдельный scope — косметически убрать дублирование счётчиков, сделать follower list, решить Unisender routing или наполнить платформу реальным контентом.

### Session 31 — 2026-08-22 (Codex, F12 production deploy)
- Goal: frontend-only deploy входа в собственный public profile и profile-header UI.
- Completed: перед deploy создан backup `/root/backups/mps-f12-20260822T124402Z`; VPS fast-forwarded to `bdd8962`. Backend diff verified empty, поэтому `mps-backend` не перезапускался и всё время оставался active. Frontend rebuilt after positive checks of production `VITE_API_URL` and `VITE_TELEGRAM_BOT_USERNAME`; generated bundle contains both values and no localhost API URL.
- Verification run: `deploy/smoke.sh` against `https://mir.pod-solncem.ru` — `[OK]`. Live `GET /users/1` returned SPA 200; served JS asset verified owner edit, actions menu and copy-link strings. Literal authenticated browser clicks were not run: no user Telegram session is available and no access token or new public smoke account was exposed/created.
- Evidence recorded: feature_list.json → F12 production evidence.
- Commits: code `bdd8962`; deployment record commit will follow.
- Known risks: `navigator.clipboard`/`navigator.share` physical browser permissions require manual user-device smoke; no backend restart or migration was required.
- Next best action: separate plan for followers list or username-handle, if prioritised.

### Session 30 — 2026-08-22 (Codex, F12 profile entry and header UI)
- Goal: перевести вход из шапки на существующий public profile, переиспользовать настройки владельца и довести шапку по Substack-референсу без backend-расширений.
- Completed: name/avatar в desktop-шапке и «Мой профиль» в mobile sheet ведут авторизованного пользователя на `/users/{id}`; гостю по-прежнему открывается login modal. Owner получает «Редактировать профиль», открывающее прежний `Profile` modal, где остаётся logout. Public profile получил компактную композицию name/счётчики/actions/avatar, неактивный текст «Посмотреть подписчиков», owner/visitor actions и доступное меню `...`: clipboard copy, Web Share с copy fallback, Escape/outside close и toast. Username и follower-list намеренно не добавлены.
- Verification run: RED — 2 F12 tests failed before implementation. GREEN targeted — 13 passed; frontend `npm test` — 38 passed; `npm run build` — 49 modules, success; backend full pytest — 58 passed in 17.00s. Final `./init.sh` вне sandbox остановился только на чужом Hermes pre-flight: missing `charset-normalizer` у `pdfminer-six`, `reportlab`, `requests`.
- Visual review: встроенный просмотр подтвердил референсную композицию; agent-browser skill прочитан, но executable отсутствует, поэтому реальный browser screenshot не выполнялся. CSS/DOM сохраняет компактную верхнюю зону, отдельную строку подписчиков, ряд action buttons и underline tabs; mobile перестраивает avatar/actions без горизонтального overflow.
- Evidence recorded: feature_list.json → F12 passing.
- Commits: будет создан `feat: навигация к публичному профилю через шапку + доводка UI`.
- Known risks: production не менялся; для настоящей ссылки «Посмотреть подписчиков» нужны новый API endpoint и view. Username требует отдельного DB field/unique policy/migration.
- Next best action: получить подтверждение Павла на единый F12 production deploy.

### Session 29 — 2026-08-22 (Codex, F11 production deploy)
- Goal: единым rollout задеплоить соцграф, подписки, «Лайки» и ссылки на профили авторов.
- Completed: origin/main и VPS обновлены до `30d65de`; перед изменением создан server-side backup `/root/backups/mps-f11-20260822T115405Z`. PostgreSQL Alembic upgraded `20260820_0008 -> 20260822_0009`; `mps-backend` restarted and readiness passed. Frontend rebuilt with production VITE API/bot variables verified inside generated assets; localhost API URL excluded from bundle; permissions on `dist` refreshed.
- Verification run: `deploy/smoke.sh` against `https://mir.pod-solncem.ru` — `[OK]`; final VPS state: SHA `30d65de`, service active, Alembic `20260822_0009 (head)`, SPA `/users/1` — 200. Safe API smoke completed follow 201 with counter increment, duplicate 409, self-follow 422, unfollow 200 with decrement; both synthetic non-personal accounts were returned to anonymous state.
- Production-data boundary: database currently has `0` published posts and `0` approved comments. Consequently no pre-existing live card can demonstrate the Likes tab or an author click from feed/comment; no production content or approved comments were created solely for smoke. Local F11 frontend/API tests remain the verification for those rendered interactions.
- Known risk: manual Alembic invocation must load `/etc/mps-platform/backend.env`; without it it uses no production DATABASE_URL and fails authentication. The deployment command now used the systemd environment successfully. `./init.sh` external Hermes blocker is unchanged.
- Next best action: seed/approve real editorial content through the normal product workflow, then perform a browser click smoke for Likes/feed/comments when fixtures exist.

### Session 28 — 2026-08-22 (Codex, public profile part B)
- Goal: реализовать соцграф публичного профиля, реальную вкладку «Лайки» и переходы на автора, не выполняя production deploy.
- Completed: UserFollow с составным PK, self-follow CHECK, FK CASCADE и индексом; Alembic `20260822_0009`; POST/DELETE follow с auth, 422 self-follow, 409 duplicate, 404 для anonymous/banned. Public profile отдаёт реальные followers/following counts и viewer-specific `is_following`. UI показывает счётчики и follow/unfollow только для чужого профиля. «Лайки» выводят только published posts пользователя. API post DTO содержит минимальный public author; автор кликабелен в Feed и comments.
- Verification run: RED follow — 2 failed; GREEN profile package — 7 passed. SQLite clean Alembic upgrade до `20260822_0009`; PostgreSQL DDL compile проверяет PK/CHECK/CASCADE. Likes RED — 1 failed, GREEN — 8 profile tests. Author RED KeyError, GREEN posts+profile — 10 passed. Final frontend `npm test` — 36 passed; `npm run build` — 49 modules, success. После обновления local `backend/.env` до official goapi final backend без override — 58 passed in 11.41s.
- Commits: `ed9025d` feat: UserFollow модель и API; `dedc865` feat: UI подписки и счетчиков; `6c09ae4` feat: вкладка Лайки публичного профиля; `994c072` feat: ссылки на профили авторов.
- Known risks: `./init.sh` reached pre-flight and stopped on external Hermes packages missing `charset-normalizer` (`pdfminer-six`, `reportlab`, `requests`). Per approved boundary this is not an F11 blocker. Production is intentionally untouched.
- Next best action: after Pavel’s approval, deploy F11 as one unit with normal backup/smoke workflow.

### Session 27 — 2026-08-22 (Codex, public profile production regressions)
- Goal: завершить часть А публичного профиля и последовательно устранить найденные на production регрессии без ручных правок данных PostgreSQL и без раскрытия secrets.
- Completed: публичный профиль (header + вкладка «Публикации») задеплоен. Исправлены: nginx `/media/` (конфликт alias/try_files, regex precedence и права каталога), PostgreSQL `SELECT DISTINCT + ORDER BY` для стран профиля, а также два варианта несовместимого historical `User.role`.
- Completed: первоначальный `values_callable` устранил production `LookupError` для lower-case `editor`, затем выявил legacy `ADMIN`. Финальный `RoleStorage` TypeDecorator читает оба регистра из существующего VARCHAR и записывает новые роли канонически как lower-case; данные и схема PostgreSQL не менялись. SQL-level role filters не найдены: все проверки прав работают с уже загруженным Python `Role`.
- Completed: ранее закрытые production UI/auth fixes подтверждены в составе состояния: правильные build-time API URL и Telegram bot username, logout, avatar upload, имя вместо technical role, золотой online indicator, toast above modal и email input type. `PostStatus` проверен как internally consistent name-based SQLAlchemy convention (`PUBLISHED`), изменения ему не потребовались.
- Verification run: RED legacy raw `ADMIN` -> ORM `LookupError`; GREEN targeted role tests — 2 passed; full backend pytest — 54 passed. Предыдущий full backend pytest для DISTINCT/profile — 53 passed. `./init.sh` воспроизводимо блокируется до project tests внешним Hermes `pip check` из-за отсутствующего `charset-normalizer` у `pdfminer-six`/`reportlab`/`requests`; MPS source/dependencies не менялись.
- Production: backend commits `5114aaf`, `1942262`, `7e8eb07` pushed and deployed. После каждого relevant deploy `mps-backend` restarted/healthy and `deploy/smoke.sh` passed. `GET /api/v1/users/1/profile` returned 200 with public-only fields. Safe server-side Telegram callback for the legacy ADMIN returned 200; no token, Telegram ID or secret was output.
- Commits: `17c7be2` public profile part A; `276a2b3`, `f9f4c97`, `887583d` media/nginx fixes; `5114aaf` lower-case role fix; `1942262` PostgreSQL DISTINCT/order and PostStatus guard; `7e8eb07` mixed-case role resilience.
- Known risks: Unisender TCP route remains externally blocked; email-code and digest are unavailable despite correct code/configuration. VPS Python remains `3.11.0rc1`. Audit I-06b, I-19a/I-19b, C-05 remain open; I-21 stays deferred to pre-launch.
- Next best action: handle the Unisender egress blocker separately or select a different delivery transport/provider; do not change production firewall without a separate approved diagnosis.

### Session 26 — 2026-08-21 (Codex, production login/profile hardening)
- Goal: диагностировать и точечно устранить production-проблемы авторизации и Profile после первого deploy, сохранив secrets вне чата и Git.
- Completed: production frontend получил build-time `VITE_TELEGRAM_BOT_USERNAME=Reg_Under_the_sun_bot` и `VITE_API_URL=https://mir.pod-solncem.ru/api/v1`; это устранило запросы browser к localhost:8000. Profile получил logout с server-side `POST /auth/logout`, upload avatar через existing media endpoint и PATCH `/me`, отображение user name вместо technical role и золотой online indicator. Toast поднят над modal backdrop, email input стал `type=email`; функциональный RTL-тест покрывает error toast при открытом Profile (визуальный stacking вручную подтверждается live-проверкой).
- Completed: UnisenderGo default переключён с go1 на официальный routing-host goapi с documented override на go1/go2; mailer исправлен с `Authorization: Bearer` на `X-API-KEY`. RED respx mock не принял прежний go1/Bearer request; GREEN и full suite проверяют goapi + exact header и обязательный `from_email` без изменения payload format.
- Production: commits `4804202`, `89a9a6a`, `61f82a0`, `6a40a7d`, `4ef4a07` pushed and applied. Static assets updated; backend at `4ef4a07` restarted, health returned `status: ok`, `mps-backend.service` active and `deploy/smoke.sh` passed. Backup copies of the previous static dist and backend app were created server-side before each deploy.
- Verification run: frontend — 29 tests passed and `npm run build` successful. Backend — targeted RED then GREEN, full `python -m pytest backend/tests -q --basetemp ...` — 48 passed. `./init.sh` ran but its global `pip check` was blocked by the external Hermes Python environment missing `charset-normalizer` for unrelated packages; no project dependency or source workaround was made.
- Security and infrastructure finding: a previously pasted Unisender API key is treated as compromised and must not be used. No secret was read, written or logged. Pavel rotated the key and updated the runtime host, but transport still cannot open TCP to `31.184.200.*:443`: both goapi/go1 timed out before HTTP. UFW allows outgoing traffic, iptables OUTPUT has no blocking rule, and ya.ru/google.com succeeded; this is a selective external route/filtering issue, not an application failure. Email-code and digest remain unavailable pending a HostKey/Unisender routing resolution, SMTP fallback or provider change.
- Next best action: public profile page only after a separate plan/approval; email infrastructure is a separate external follow-up and does not block other platform work.

### Session 25 — 2026-08-20 (Codex, финальная production control point)
- Goal: зафиксировать завершённые audit-доработки, legal-тексты и реальный первый VPS deploy без раскрытия production secrets.
- Completed: I-18, I-20 закрыты; I-21 явно отложен до pre-launch юридической проверки. В Legal опубликованы тексты Политики обработки персональных данных и Пользовательского соглашения (152-ФЗ); реквизиты оператора остаются динамическими public settings. На VPS `https://mir.pod-solncem.ru` развёрнут MPS: изолированные PostgreSQL DB/role и Redis DB 2, backend на `127.0.0.1:8001`, production nginx, certbot, HSTS, systemd backend/digest/backup units, PostgreSQL/Redis автозапуск, ежедневный backup и первый Telegram admin.
- Verification run: frontend tests — 24 passed; frontend build успешен; backend pytest — 47 passed; `./init.sh` — 47 passed. VPS: Alembic до `20260820_0008`; nginx config test успешен; TLS certificate выпущен; `certbot.timer` enabled/active и адресный `certbot renew --dry-run --cert-name mir.pod-solncem.ru` successful; backend active на 8001; первый `mps-backup.service` — `Result=success`, непустой читаемый dump; `deploy/smoke.sh` — `[OK] smoke passed: https://mir.pod-solncem.ru`.
- Evidence recorded: systemd `mps-backend.service`, `mps-digest.timer`, `mps-backup.timer`, `postgresql`, `redis-server` и `certbot.timer` enabled/active; HSTS header получен; один admin создан по server-side `ADMIN_TG_ID` без вывода ID.
- Commits: `3a723c2 fix: deploy MPS backend on port 8001`; `594652d fix: enable HSTS after MPS TLS verification`; `4a1d7aa fix: proxy MPS sitemap and robots`; `786aefb docs: тексты политики персональных данных и пользовательского соглашения (152-ФЗ)`.
- Known risks: на VPS используется уже установленный Python `3.11.0rc1`; это технический долг до планового перехода на поддерживаемый stable Python 3.11+. Relay/Unisender поля остаются незаполненными; I-06b, I-19a/I-19b и C-05 не закрывались этой сессией.
- Next best action: Павел заполняет незаполненные поля напрямую в `/etc/mps-platform/backend.env`, затем выполняет ручную сквозную проверку `docs/TZ.md` §7; не передавать секреты в чат.

### Session 24 — 2026-08-20 (Codex, I-20 legal-compliance)
- Goal: дополнить публичные реквизиты ОГРН, воспроизводимо заполнить чистую БД и проверить ограниченную UI-часть 152-ФЗ.
- Completed: Alembic `20260820_0008` добавляет официальные public settings; Legal показывает оператора (наименование и адрес), формы требуют явного UI-согласия и дают ссылку на policy. I-21 открыт для server-side consent evidence и cookie gating.
- Verification run: RED public settings — 1 failed из-за отсутствия `legal_ogrn`; targeted backend — 3 passed; frontend tests — 23 passed; build successful; full backend — 47 passed; final `./init.sh` — `pip check` без конфликтов, 47 passed.
- Next best action: I-21 только по отдельному продуктовому решению.

### Session 23 — 2026-08-20 (Codex, audit I-20)
- Goal: убрать фиктивные юридические и контактные данные из production UI без внесения реальных данных в репозиторий.
- Completed: `legal_name`, `legal_inn`, `contact_email`, `contact_phone`, `contact_address` записываются через существующий защищённый `PATCH /admin/settings`. Публичный `GET /settings/public` выдаёт только эти пять ключей. Footer и About получают settings по API, показывают настроенные значения и скрывают блоки при пустой конфигурации.
- Verification run: baseline `./init.sh` — 46 passed; RED backend `python -m pytest tests/test_admin.py -q --basetemp .pytest-i20-red` — 1 failed: `GET /settings/public` вернул 404; RED frontend — фиктивный `ИП Иванова И.И.` присутствовал в DOM; targeted backend — 3 passed; targeted frontend — 2 passed; full frontend — 6 files, 23 passed, build successful; full backend — 47 passed; final `./init.sh` — `pip check` без конфликтов, 47 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-20; backend test доказывает whitelist без `cta_bot_url`, frontend test — отсутствие placeholders и отображение настроенных значений.
- Commits: будет создан `fix: audit I-20 — публичные настраиваемые реквизиты`.
- Known risks: полноценного admin UI пока нет; до его реализации реквизиты задаются защищённым backend admin API. Валидация формата email/URL относится к согласованной следующей подзадаче I-19a/I-19b.
- Next best action: ручной VPS deploy либо отдельный план I-19a; не подставлять реальные данные в исходники.

### Session 22 — 2026-08-20 (Codex, audit I-18)
- Goal: сделать первый nginx/certbot bootstrap воспроизводимым и дать digest service production environment до VPS deploy.
- Completed: добавлен HTTP-only `deploy/nginx.pre-cert.conf` с ACME challenge и `YOUR_DOMAIN`; `DEPLOY.md` задаёт порядок bootstrap → `certbot certonly --webroot` → HTTPS config. `mps-digest.service` запускается как `mps:mps` и читает `/etc/mps-platform/backend.env`.
- Verification run: baseline `./init.sh` вне sandbox — `pip check` без конфликтов, 44 passed; RED `python -m pytest tests/test_deploy_bootstrap.py -q --basetemp .pytest-i18-red` — 2 failed: отсутствовал pre-cert template, digest не содержал User/Group/EnvironmentFile; targeted `--basetemp .pytest-i18-target-final` — 2 passed; final `python -m pytest tests -q --basetemp .pytest-i18-full-final` — 46 passed; final `./init.sh` вне sandbox — `pip check` без конфликтов, 46 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-18; тест фиксирует HTTP-only template без SSL/certificate paths и production service account/environment для digest.
- Commits: будет создан `fix: audit I-18 — deploy bootstrap (nginx pre-cert, digest unit)`.
- Known risks: реальный `nginx -t`, certbot и запуск digest требуют VPS и credentials; они намеренно не выполнялись локально.
- Next best action: отдельный план I-20; не начинать его без нового подтверждения.

### Session 21 — 2026-08-20 (Codex, audit I-13)
- Goal: синхронизировать локальный state Profile с существующим пользователем после login без перезаписи draft на том же user ID.
- Completed: `Profile` сбрасывает name, bio и anonymous только при изменении `user.id`. Email и Telegram login уже reload `/me`; после перехода anonymous → user форма сразу показывает сохранённые поля и больше не может отправить пустые defaults.
- Verification run: RED `npm run test:quiet -- src/components/Profile.test.tsx` — 1 failed: после rerender name остался пустым вместо «Павел»; frontend `npm run test:quiet` — 5 files, 21 passed; `npm run build` — 48 modules, успешно; full `python -m pytest tests -q --basetemp .pytest-i13-full` — 44 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 44 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-13; `Profile.test.tsx` проверяет rerender без unmount и существующие name/bio/anonymous.
- Commits: будет создан `fix: audit I-13 — синхронизация Profile state после login`.
- Known risks: state намеренно синхронизируется по ID, не по каждому обновлению user object; это сохраняет незавершённый draft пользователя.
- Next best action: VPS deploy по `DEPLOY.md` либо отдельная оценка следующего audit-пункта.

### Session 20 — 2026-08-20 (Codex, audit I-06a)
- Goal: устранить возможность закрыть JSON-LD script через данные Article, не расширяя scope до общей sanitization policy.
- Completed: `json_ld()` сериализует Article через `json.dumps()` и кодирует `<`, `>` и `&` Unicode escapes перед HTML embedding. I-06b оставлен открытым: post.title/excerpt, forum title/body, QA question/answer, profile name/bio и review author name требуют продуктового решения о допустимом содержимом.
- Verification run: RED `python -m pytest tests/test_seo.py -q --basetemp .pytest-i06a-red` — 1 failed: raw `</script><script>window.__injected…</script>` присутствовал в HTML; targeted `python -m pytest tests/test_seo.py -q --basetemp .pytest-i06a-target` — 3 passed; full `python -m pytest tests -q --basetemp .pytest-i06a-full` — 44 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 44 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-06a; `test_json_ld_escapes_html_significant_characters` проверяет отсутствие raw injection, escaped `<`/`>`/`&` и корректный JSON parsing с исходными значениями.
- Commits: будет создан `fix: audit I-06a — безопасное экранирование JSON-LD`.
- Known risks: I-06b не реализован намеренно; этот фикс защищает JSON-LD, но не вводит единую policy sanitization для остальных boundary.
- Next best action: VPS deploy по `DEPLOY.md` либо отдельное согласование I-06b.

### Session 19 — 2026-08-20 (Codex, audit I-16)
- Goal: сделать повторную moderation и internal QA-answer идемпотентными до VPS deploy.
- Completed: повторное одинаковое moderation решение возвращает `200` без нового notification; противоположное решение после final state возвращает `409`. QA retry возвращает `200` только при точном равенстве `answer` и `answered_by_name`; любой отличающийся payload возвращает `409` и сохраняет первый ответ/автора.
- Verification run: RED `python -m pytest tests/test_comments.py tests/test_reviews.py tests/test_qa.py -q --basetemp .pytest-i16-red` — 3 failed: все conflicting retries возвращали `200`; targeted `python -m pytest tests/test_comments.py tests/test_reviews.py tests/test_qa.py -q --basetemp .pytest-i16-target-final` — 9 passed; full `python -m pytest tests -q --basetemp .pytest-i16-full` — 43 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 43 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-16; tests фиксируют отсутствие duplicate notifications, `409` для противоречащей moderation/QA и строгое сравнение QA answer/author.
- Commits: будет создан `fix: audit I-16 — идемпотентность moderation и qa-answer`.
- Known risks: `409` — намеренное breaking change для клиентов, которые раньше перезаписывали уже принятые решения или ответы; приблизительное сравнение QA payload не применяется.
- Next best action: VPS deploy по `DEPLOY.md` либо отдельная оценка следующего audit-пункта.

### Session 18 — 2026-08-20 (Codex, audit I-15)
- Goal: применить forum lock и сохранять ID нового сообщения в notification.
- Completed: закрытая тема отклоняет `POST /topics/{id}/messages` с `423` до записи; открытая тема делает `flush()` и сохраняет фактический ID forum message в notification payload.
- Verification run: RED `python -m pytest tests/test_forum.py -q --basetemp .pytest-i15-red` — 2 failed: locked topic вернул `201`, notification содержал `message_id: null`; targeted `python -m pytest tests/test_forum.py -q --basetemp .pytest-i15-target` — 3 passed; full `python -m pytest tests -q --basetemp .pytest-i15-full` — 40 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, 40 passed.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-15; `test_forum_rejects_messages_in_locked_topic` проверяет `423` и отсутствие записи/notification, success-path проверяет payload с фактическим message ID.
- Commits: будет создан `fix: audit I-15 — forum lock и message id`.
- Known risks: `423` намеренно меняет прежнее неявное разрешение на точный API-отказ для закрытых тем; миграция не нужна.
- Next best action: I-16 — идемпотентность повторной moderation/answer.

### Session 17 — 2026-08-20 (Codex, audit I-01)
- Goal: устранить ложный success подписки при отказе Unisender до VPS deploy.
- Completed: `POST /api/v1/subscribe` возвращает контролируемый `502` с русским сообщением, если `send_confirm()` не принял письмо. Неподтверждённая подписка и её confirm-token сохраняются; повторный запрос использует тот же токен.
- Verification run: RED `python -m pytest tests/test_subscribe.py -q --basetemp .pytest-i01-red` — 1 failed, endpoint вернул ложный `201` при Unisender `503`; targeted `python -m pytest tests/test_subscribe.py -q --basetemp .pytest-i01-target` — 3 passed; full `python -m pytest tests -q --basetemp .pytest-i01-full` — 39 passed; `./init.sh` вне sandbox — `pip check` без конфликтов, pytest exit 0.
- Evidence recorded: `docs/AUDIT_REPORT.md` I-01; `test_subscription_reports_unisender_delivery_failure_without_losing_token` фиксирует Unisender `503` → API `502`, persisted unconfirmed subscription и неизменный token при retry.
- Commits: будет создан `fix: audit I-01 — честный отказ подписки`.
- Known risks: delivery state/outbox и отложенный retry не добавлялись; пользователь выполняет retry вручную, а существующая запись остаётся unconfirmed.
- Next best action: I-15 — применить forum lock и записывать ID сообщения в notification.

### Session 0 — 2026-08-18 (Claude, подготовка)
- Goal: собрать обвязку проекта по методике Harness Engineering.
- Completed: AGENTS.md, init.sh, feature_list.json (F01–F10), документы docs/ (ТЗ, спека, роадмап, решения встречи, аудит фронта), промпты P00–P10.
- Verification run: json-валидация feature_list.json — OK; кода ещё нет.
- Evidence recorded: —
- Commits: первый коммит делает Павел после копирования в репо.
- Known risks: подписка Codex до конца месяца — M2 в приоритете; Telegram-релей зависит от доступа к боту «Под солнцем».
- Next best action: сессия P01 в Codex (фича F01) — фронтенд уже в репо, шаг 2 README выполнен.

<!-- Каждая следующая сессия добавляет запись НИЖЕ по этому же шаблону -->

### Session 1 — 2026-08-18 (Codex, F01)
- Goal: реализовать каркас async FastAPI-бекенда и проверяемый health endpoint.
- Completed: созданы app factory, Settings через pydantic-settings, async SQLAlchemy engine/session/Base, async Alembic и начальная пустая миграция, `GET /api/v1/health`, test app на aiosqlite, `.env.example`, `.gitignore` и requirements. `init.sh` скорректирован, чтобы штатно запускать pytest из `backend/`.
- Verification run: `python -m pip install -r backend/requirements.txt` — успешно; `DATABASE_URL=sqlite+aiosqlite:///:memory: python -m alembic upgrade head` — upgrade до `20260818_0001`; `python -m pytest backend/tests -q` — `1 passed in 0.27s`; локальный Uvicorn + GET `/api/v1/health` — `{"status":"ok","version":"0.1.0"}`; `./init.sh` — `[OK] Верификация прошла`, `1 passed in 0.26s`.
- Evidence recorded: feature_list.json → F01.evidence.
- Commits: будет создан локальный коммит `F01: каркас бекенда [passing]`.
- Known risks: миграция подтверждена на SQLite in-memory; подключение к реальному PostgreSQL остаётся задачей среды деплоя.
- Next best action: F02 — реализовать авторизацию Telegram/email с JWT и ролями.

### Session 2 — 2026-08-18 (Codex, F02)
- Goal: реализовать пользователей, Telegram/email авторизацию, JWT и роли.
- Completed: модель users и миграция с CHECK identity, проверка Telegram Login HMAC и auth_date, JWT access/refresh с httpOnly cookie, Redis email-коды, `/me`, профиль, роли, presence middleware и auth rate limit.
- Verification run: SQLite Alembic upgrade до `20260818_0002`; `python -m pytest backend/tests -q` — `5 passed in 0.37s`; `./init.sh` — `[OK]`, `5 passed in 0.55s`.
- Evidence recorded: feature_list.json → F02.evidence.
- Commits: будет создан локальный коммит `F02: авторизация и роли [passing]`.
- Known risks: fakeredis выбран для тестов, так как redis-server отсутствует; production использует Redis URL из .env. Mailer намеренно логирует отправку до F05.
- Next best action: F03 — публикации и лайки.

### Session 3 — 2026-08-18 (Codex, F03)
- Goal: завершить публикации, видеообзоры, лайки и загрузку изображений.
- Completed: добавлены countries/posts/post_likes и Alembic revision `20260818_0003`; CRUD публикаций для editor, публичная лента и просмотр, toggle-like, slug с транслитерацией/коллизией, обязательный `shot_at` для video_review, Pillow upload JPEG/PNG/WebP с лимитом 10 МБ. PATCH теперь принимает частичный payload и сохраняет инвариант видеообзора. `MEDIA_DIR` поступает из Settings и изолирован в тестах.
- Verification run: `python -m pytest tests/test_posts.py tests/test_media.py -q --basetemp .pytest-tmp` — 7 passed; `DATABASE_URL=sqlite+aiosqlite:///:memory: alembic upgrade head` — upgrade до `20260818_0003`; `python -m pytest tests -q --basetemp .pytest-tmp-full` — 12 passed; `./init.sh` через Git Bash — `[OK]`, 12 passed.
- Evidence recorded: feature_list.json → F03.evidence (коды reader/editor CRUD, video validation, likes/views, partial PATCH, slug и media).
- Commits: локальный `F03: публикации [passing]`.
- Known risks: в production media должны отдаваться nginx, а видео v1 остаются URL без транскодинга; это не проверялось локально.
- Next best action: F04 — отзывы, комментарии, премодерация и реакции.

### Session 4 — 2026-08-18 (Codex, F04)
- Goal: реализовать отзывы, комментарии, модерацию, реакции и выдачу bot review-token.
- Completed: добавлены reviews/comments/comment_reactions/review_tokens/notifications и миграция `20260818_0004`; public approved-only списки, создание pending, editor moderation с pending_count, notifications автору при approve, реакции с заменой emoji, ответы только одного уровня. `/internal/review-tokens` защищён `BOT_BRIDGE_SECRET`; token одноразовый и действует 7 дней.
- Verification run: `python -m pytest tests/test_reviews.py tests/test_comments.py -q --basetemp .pytest-f04-target` — 4 passed; `DATABASE_URL=sqlite+aiosqlite:///:memory: alembic upgrade head` — upgrade до `20260818_0004`; `python -m pytest tests -q --basetemp .pytest-f04-full` — 16 passed; `./init.sh` через Git Bash — `[OK]`, 16 passed.
- Evidence recorded: feature_list.json → F04.evidence (pending visibility, roles, approve/reject, nested reply, reactions, token 201/404/410 и notifications).
- Commits: локальный `F04: модерация [passing]`.
- Known risks: review token пока возвращается внутреннему bot bridge без deep-link сборки; её доставка клиенту — интеграционный поток F05. Уведомления сохраняются, API чтения будет F08.
- Next best action: F05 — email double opt-in, дайджест и Telegram-релей вопросов.

### Session 5 — 2026-08-18 (Codex, F05)
- Goal: подписки, дайджест и вопросы Telegram.
- Completed: subscriptions/questions, Alembic 0005, Unisender Go client, digest job/timer, Q&A relay, bot bridge router.
- Verification run: target 4 passed; Alembic 0005; full pytest 20 passed; init.sh 20 passed.
- Evidence recorded: feature_list.json F05.
- Commits: F05: подписки и вопросы [passing].
- Known risks: systemd units не установлены на VPS; aiogram router должен быть подключён Павлом в существующем боте.
- Next best action: F06.

### Session 6 — 2026-08-18 (Codex, F06)
- Goal: форум по странам, темы, сообщения и лимиты.
- Completed: forum_topics/forum_messages, migration 0006, countries/topics/messages API, reader/premium limit 3, editor/admin unlimited, notification автору темы.
- Verification run: fresh Alembic -> 0006; F06 test 1 passed; full pytest 21 passed; init.sh 21 passed.
- Evidence recorded: feature_list.json F06.
- Commits: F06: форум [passing].
- Known risks: prefix search is MVP only; replace with PostgreSQL full-text at scale.
- Next best action: F07.

### Session 7 — 2026-08-18 (Codex, F07)
- Goal: добавить один автоматический ИИ-ответ Иришки в старые темы форума без ответа.
- Completed: Alembic `20260818_0007` создаёт settings и служебного editor-пользователя «Иришка · ИИ-помощник». `services/irishka.py` читает `irishka_enabled` и `irishka_delay_min` из БД, вызывает OpenAI-совместимый MiniMax `/chat/completions`, создаёт `is_ai` сообщение только в теме без сообщений; ценовые/визовые темы переадресует менеджеру и создаёт Question. AsyncIOScheduler запускает задачу каждые 5 минут в FastAPI lifespan.
- Verification run: fresh SQLite Alembic upgrade до `20260818_0007`; `python -m pytest tests/test_irishka.py -q --basetemp .pytest-f07-check` — 5 passed in 0.92s; `python -m pytest tests -q --basetemp .pytest-f07-full-check` — 26 passed in 5.26s; `./init.sh` вне sandbox — `[OK]`, 26 passed in 5.35s.
- Evidence recorded: feature_list.json → F07.evidence.
- Commits: будет создан `F07: Иришка [passing]`.
- Known risks: production requires a non-empty `MINIMAX_API_KEY`; otherwise httpx rejects the empty Bearer header. Scheduler runs in API process, so deployment must keep one scheduler instance.
- Next best action: F08 — admin settings endpoint can expose `irishka_enabled` without redeploy.

### Session 8 — 2026-08-18 (Codex, F08)
- Goal: реализовать админскую статистику, модерацию, бан пользователей, настройки, online-панель и API уведомлений.
- Completed: добавлены admin-only `GET /admin/stats`, единая очередь pending отзывов/комментариев, пагинированный `GET /admin/users`, бан через `PATCH /admin/users/{id}` и `PATCH /admin/settings` для CTA и `irishka_*`. Добавлены `/online` (120 секунд, без анонимов, max 12), пагинация уведомлений и пометка всех/выбранных собственных уведомлений прочитанными. Premium не получил отдельной логики.
- Verification run: `python -m pytest tests/test_admin.py tests/test_presence.py -q --basetemp .pytest-f08-target` — 4 passed; `python -m pytest tests -q --basetemp .pytest-f08-full` — 30 passed; `./init.sh` — 30 passed, `[OK]`.
- Evidence recorded: feature_list.json → F08.evidence (403 reader, полный набор метрик, top-5 по views, online, notifications ownership).
- Commits: будет создан `F08: админка и статистика [passing]`.
- Known risks: top_posts учитывает все публикации по текущей спецификации, включая draft; если продукту нужна только опубликованная выборка, это отдельное уточнение.
- Next best action: F09 — подключить утверждённый frontend к готовому API, не меняя Claude Design-разметку.

### Session 9 — 2026-08-18 (Codex, M3 review hardening)
- Goal: устранить замечание M3 Maintainability и добавить pre-flight dependency/network guardrails перед M4.
- Completed: F06 forum endpoints и F07 `irishka.run()` отформатированы и снабжены контрактными docstrings без изменения поведения. `init.sh` теперь запускает `python -m pip check` перед pytest. Глобальный strict `respx` fixture блокирует незамоканный HTTPX до сетевого соединения; отдельный тест фиксирует этот контракт, а F07 MiniMax mocks остаются рабочими.
- Verification run: `python -m pytest tests/test_network_guard.py tests/test_forum.py tests/test_irishka.py -q --basetemp .pytest-m3-guard-target` — 7 passed; `python -m pytest tests -q --basetemp .pytest-m3-review-full` — 31 passed; `./init.sh` — `No broken requirements found`, 31 passed.
- Evidence recorded: evaluator-rubric.md → M3 Maintainability re-evaluation.
- Commits: будет создан `fix: M3 review — maintainability + dependency/network guardrails`.
- Known risks: strict respx fixture защищает HTTPX-клиенты; при добавлении другого HTTP-клиента ему потребуется собственный no-network guard.
- Next best action: F09 — подключить утверждённый frontend к готовому API, не меняя Claude Design-разметку.

### Session 10 — 2026-08-18 (Codex, F09a1)
- Goal: перенести в Vite+React каркас Claude Design, основной журнал, форум и article/comments до API/auth-этапа.
- Completed: создан frontend/app (Vite + React + TypeScript) с компонентами Layout, Feed, Forum и ArticleComments. Сохранены dark/light themes, анимации, desktop sidebar/presence, mobile sheet/nav, feed cards для article/tip/video, страны/тема и Иришка. Комментарии используют F04 API-contract `author`, aggregate `reactions`, `my_reaction` и POST toggle.
- Verification run: `cd frontend/app && npm install && npm run build` — Vite production build (36 modules) зелёный вне sandbox; визуальная сверка с dc-референсом Layout/Feed/Forum/article-comments в обеих темах и на 375px; `python -m pytest backend/tests/test_comments.py -q --basetemp .pytest-f09a1-comments` — 2 passed; полный `python -m pytest backend/tests -q --basetemp .pytest-f09a1-full` — 31 passed; `./init.sh` вне sandbox — pip check и 31 passed.
- Evidence recorded: feature_list.json → F09a1.evidence.
- Commits: будет создан `F09a1: каркас и журнал [passing]`; в push также войдёт уже готовый `75090d8 fix: F04 comment reactions contract for frontend`.
- Known risks: email/Telegram login, общий API client/hooks, реальные данные Reviews/Subscribe/QA/Profile/Notifications/About и сквозной сценарий перенесены в F09a2/F09b по утверждённой разбивке. В F09a1 login button — элемент дизайна, не auth-flow.
- Next best action: представить план F09a2 и ждать подтверждения пользователя.

### Session 11 — 2026-08-18 (Codex, F09a2)
- Goal: перенести оставшиеся Claude Design разделы и расширить навигацию, не заходя в API/auth F09b.
- Completed: добавлены Reviews, Subscribe, QA, Profile, Notifications, About, Legal и CookieBanner; Layout получил полный desktop/mobile navigation, notifications popover, profile/Q&A modal, юридический footer и QR-announce. Добавлена hash-навигация для воспроизводимой проверки экранов. В storage остаются только `mps-theme2` и `mps-cookie-consent`; reviews/subscribe/QA/profile/notifications используют только локальный presentation-state до F09b.
- Verification run: `cd frontend/app && npm run build` — 44 Vite modules, 928ms; визуальная сверка новых разделов и F09a1 regression на Vite :5173 в обеих темах и 375px; `rg -n localStorage frontend/app/src` — только theme/cookie keys; `python -m pytest backend/tests -q --basetemp .pytest-f09a2-full` — 31 passed in 6.77s; `./init.sh` вне sandbox — pip check и 31 passed.
- Evidence recorded: feature_list.json → F09a2.evidence.
- Commits: будет создан `F09a2: остальные разделы дизайна [passing]`.
- Known risks: реальные profile/notifications/reviews/subscribe/QA данные, email/Telegram login, JWT refresh и общие hooks не реализованы намеренно — это отдельная F09b.
- Next best action: представить план F09b и ждать подтверждения пользователя.

### Session 12 — 2026-08-18 (Codex, F09b)
- Goal: подключить перенесённый React-дизайн к REST API и email-авторизации.
- Completed: добавлены memory-only JWT client с refresh/retry 401, hooks auth/posts/reviews/comments/subscribe/QA/forum/notifications/online; реальные API подключены к компонентам. Email-код — рабочий UI-flow, Telegram-кнопка использует VITE_TELEGRAM_BOT_USERNAME, роль приходит из `/me`, dev role switch ограничен `import.meta.env.DEV`. Флаги стран берутся из фиксированного frontend-справочника. Отдельный commit `143e813` исправил F06 messages response: author и is_ai.
- Verification run: `python -m pytest tests/test_f09b_api_flow.py -q --basetemp .pytest-f09b-flow-final` — 1 passed: SQLite+fakeredis ASGI flow covers TZ §7.1–6, email code/JWT/refresh, reader `/me`, posts/reviews/comments/QA/forum, with explicit Unisender/Telegram respx mocks. Full `python -m pytest tests -q --basetemp .pytest-f09b-full-final` — 33 passed in 9.64s; `npm run dev -- --host 127.0.0.1` — Vite ready at :5173; `npm run build` — 46 modules, 1.11s; `./init.sh` — pip check, 33 passed.
- Evidence recorded: feature_list.json → F09b.evidence.
- Commits: `143e813 fix: F06 forum messages contract for frontend`; далее будет `F09b: подключение API и авторизации [passing]`.
- Known risks: финальная браузерная проверка с живым Postgres/Redis остаётся ручным smoke Павла на локальной машине или при F10; принятая эквивалентная ASGI SQLite+fakeredis API-верификация полностью пройдена. Внешние Telegram/Unisender/MiniMax намеренно не вызываются, их transport contracts замоканы.
- Next best action: F10 — деплой и production/manual browser smoke.

### Session 13 — 2026-08-18 (Codex, F10)
- Goal: подготовить production deploy, SEO и backup для финальной фичи.
- Completed: добавлены nginx HTTPS/static/API/media template, backend systemd unit, daily pg_dump backup timer, smoke script и DEPLOY.md. SEO endpoints `/sitemap.xml`, `/robots.txt`, bot-specific `/posts/{slug}` OG/meta+Article JSON-LD; обычный browser получает собранный index.html. Добавлена `python -m app.management.create_admin` с email/TG identity и интерактивным вводом без default credentials. Иришка остаётся в FastAPI lifespan, scheduler unit не нужен.
- Verification run: F10 target tests — 4 passed; localhost staging-double `deploy/smoke.sh` — [OK]; shell syntax OK; full pytest — 37 passed; Vite build — 46 modules; `./init.sh` — pip check + 37 passed.
- Evidence recorded: feature_list.json → F10.evidence.
- Commits: будет создан `F10: деплой и SEO [passing]`.
- Known risks: реальные DNS/certbot/HSTS/systemd/pg_dump/production curl и ручная регистрация webmaster выполняются Павлом на VPS по DEPLOY.md. HSTS намеренно закомментирован до первого корректного HTTPS.
- Next best action: Павел выполняет DEPLOY.md и production smoke, затем вручную проходит browser login/click smoke.

### Session 14 — 2026-08-18 (Codex, audit remediation)
- Goal: закрыть три launch blocker из `docs/AUDIT_REPORT.md` до production deploy.
- Completed: F02 email-код теперь реально отправляется через Unisender с атомарной очисткой Redis при отказе; F09b использует официальный Telegram Login Widget и `/auth/telegram`; F10 frontend переведён с hash на pathname/history routing с прямыми статьями и странами, отдельными 404/API-error состояниями.
- Verification run: frontend `npm test` — 4 files, 20 passed; `npm run build` — 48 modules; backend full pytest — 38 passed; storage grep — только theme/cookie-consent.
- Commits: `522a00d` email delivery; `937a6a5` Telegram Widget; текущий `fix: launch blocker — client-side routing по pathname вместо hash`.
- Result: audit-remediation launch blockers завершены; оставшиеся пункты «Важно»/«Желательно» остаются для отдельной приоритизации перед или после реального VPS deploy.

### Session 15 — 2026-08-18 (Codex, C-04/C-06 remediation)
- Goal: исправить confirm URL подписки и сделать PostgreSQL backup unit готовым к первому VPS-запуску без затрагивания C-05 и остальных audit-задач.
- Completed: confirm-письмо ведёт на `BASE_URL/api/v1/subscribe/confirm/{token}`; тест переходит по ссылке из реального HTML payload. Backup использует отдельный `PG_DUMP_URL`, проверяет pg_dump/права/непустой результат, атомарно публикует архив и удаляет файлы старше 14 дней. Systemd пишет понятные `mps-backup: ERROR/OK` в journal и запускает script через `/usr/bin/bash`.
- Verification run: targeted subscribe — 2 passed; `bash -n deploy/backup.sh` — OK; missing-env smoke — явный exit 1; functional backup smoke — непустой файл и rotation OK; full backend pytest — 38 passed; финальный `./init.sh` вне sandbox — pip check + 38 passed.
- Evidence recorded: feature_list.json → F05 C-04 и F10 C-06 audit remediation; DEPLOY.md содержит обязательные VPS `PG_DUMP_URL`, каталог, journal и реальный pg_dump/pg_restore steps.
- Known risks: реальный PostgreSQL/pg_dump/systemd отсутствует в локальной Windows-среде и проверяется Павлом на VPS; C-05 не изменялся.
- Next best action: выполнить DEPLOY.md на VPS и не включать backup timer в доверенный operational state до первого `mps-backup: OK` и успешного `pg_restore --list`.

### Session 16 — 2026-08-18 (Codex, финальная контрольная точка)
- Goal: зафиксировать итоговое состояние проекта перед VPS deploy без изменения логики.
- Completed: F01–F10 и F09a1/F09a2/F09b подтверждены как passing; launch blocker'ы email-кода, Telegram Widget, pathname routing, C-04 и C-06 закрыты; handoff и clean-state checklist приведены к финальному состоянию.
- Commits за день:
  - `784a8d6` F01: каркас бекенда [passing]
  - `840321f` F02: авторизация и роли [passing]
  - `01df04f` F03: публикации [passing]
  - `f108a43` F04: модерация [passing]
  - `1217779` F05: подписки и вопросы [passing]
  - `627cca8` fix: M2 review — bot_bridge deps, docstrings, handoff
  - `bcbbf53` F06: форум [passing]
  - `2f682bd` F07: Иришка [passing]
  - `4d5d8c6` F08: админка и статистика [passing]
  - `ace749f` fix: M3 review — maintainability + dependency/network guardrails
  - `75090d8` fix: F04 comment reactions contract for frontend
  - `d0d8f84` F09a1: каркас и журнал [passing]
  - `0ce03ad` F09a2: остальные разделы дизайна [passing]
  - `143e813` fix: F06 forum messages contract for frontend
  - `12786f3` F09b: подключение API и авторизации [in_progress]
  - `cca76bd` F09b: подключение API и авторизации [passing]
  - `eaa8d4f` F10: деплой и SEO [passing]
  - `3aac1fa`, `ad69967` docs: аудит проекта после F01-F10
  - `522a00d` fix: launch blocker — email-код реально отправляется через Unisender
  - `937a6a5` fix: launch blocker — реальная интеграция Telegram Login Widget
  - `d1fcd5d` fix: launch blocker — client-side routing по pathname вместо hash
  - `a981a5a` fix: launch blockers C-04, C-06 — subscribe link и pg backup
- Verification run: `python -m pytest --basetemp .pytest-final-outside` — 38 passed in 12.23s; `./init.sh` вне sandbox — `No broken requirements found`, 38 passed in 11.90s, `[OK] Верификация прошла`; `feature_list.json` — 12 passing, 0 in_progress.
- Known boundary: C-05 остаётся отдельной security-задачей по ранее утверждённому scope; реальные DNS/certbot/systemd/PostgreSQL backup проверяются при deploy по `DEPLOY.md`.
- Next best action: VPS deploy по `DEPLOY.md` либо выбранная Павлом доработка пунктов «Важно»/«Желательно» и C-05 из `docs/AUDIT_REPORT.md`.
