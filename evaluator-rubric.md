# evaluator-rubric.md — оценка работы сессии/спринта (0–2 по каждому измерению)

Запускать: после M2 (P05) и M3 (P08), либо при подозрении на халтуру. Оценивает Claude или Павел, НЕ сам Codex сразу после своей сессии.

| # | Измерение | Вопрос | Оценка 0–2 |
|---|---|---|---|
| 1 | Correctness | Реализация соответствует user_visible_behavior и ТЗ? | 2 |
| 2 | Verification | Шаги verification реально запущены, evidence содержит команды и вывод? | 2 |
| 3 | Scope discipline | Агент не вылезал за рамки фичи, не трогал чужой код? | 2 |
| 4 | Reliability | Повторный прогон init.sh + pytest на чистом клоне зелёный? | 2 |
| 5 | Maintainability | Код и записи понятны следующей сессии без объяснений? | 2 |
| 6 | Handoff readiness | Новая сессия может продолжить только по артефактам репо? | 2 |

**Заключение:** Accept (≥10 и нет нулей) · Revise (есть 1 у критичных 1,2,4) · Block (любой 0 у измерений 1 или 2).

Правила калибровки: если оценка evaluator расходится с моим (Павла) впечатлением — конкретизирую критерий pass/fail в этой таблице и прогоняю заново. Историю правок веду ниже.

## История калибровок
- 2026-08-18, M2 self-evaluation (F01–F05), total 9/12 — **Revise**.
  - Correctness 1/2: backend flows covered by tests match the stated M2 behaviours. However, the committed `bot_bridge/aiogram_router.py` imports aiogram while the repository does not declare that dependency or an integration package; it is a handoff artifact, not a self-contained runnable integration. This must be made explicit or packaged before calling the sprint fully correct.
  - Verification 2/2: F01–F05 are all `passing`; each `feature_list.json.evidence` contains executable commands and concrete output/status evidence, rather than only a narrative. In particular, F01 records install/Alembic/pytest/health/init, F02–F04 record migration and targeted behavioural results, and F05 records target tests, migration, full pytest and init.
  - Scope discipline 2/2: commit history is cleanly partitioned as F01–F05. Shared changes to app factory, config, metadata, test fixture and requirements were direct enabling work for the current feature; no frontend or unrelated deployment changes were made.
  - Reliability 2/2: a fresh clone was created at `D:\mps-platform-full\mps-platform-eval-clean` with a newly created `.venv-eval`; after `pip install -r backend/requirements.txt`, full pytest passed `20 passed in 3.86s` and `./init.sh` passed `20 passed in 3.83s`.
  - Maintainability 1/2: migrations and tests give a clear execution path, but multiple F03–F05 modules use dense one-line formatting and lack interface-level docstrings. This makes changes to security-sensitive internal routes and external transports harder to audit than necessary.
  - Handoff readiness 1/2: `feature_list.json` and `claude-progress.md` identify F06 and record evidence, but `session-handoff.md` was not fully rewritten at F05 as required by AGENTS.md and does not describe F05 contracts, timer installation, or bot bridge integration in one current handoff.
- 2026-08-18, M2 remediation re-evaluation, total 12/12 — **Accept**.
  - Correctness 2/2: optional aiogram integration now declares `aiogram>=3,<4` in `bot_bridge/requirements.txt`; README documents installation and dispatcher wiring without adding aiogram to the API dependency set.
  - Maintainability 2/2: contract docstrings now describe input, result, error statuses, and external side effects for review-token issuance, QA answers, Telegram relay, and Unisender transport.
  - Handoff readiness 2/2: `session-handoff.md` is rewritten around F05 API contracts, deployment timer installation, digest command, environment boundaries, and exact bot bridge connection steps for F06.

- 2026-08-18, M3 self-evaluation (F06–F08), total 11/12 — **Accept**.
  - Correctness 2/2: F06 covers countries, topic limits, Cyrillic case-insensitive search and message counters; F07 creates one AI or manager-handoff response under its configured conditions; F08 enforces admin access, exposes all F-I metrics, moderation/user/settings APIs, online filtering and notification ownership. Premium receives no special privileges in this sprint.
  - Verification 2/2: F06, F07 and F08 are `passing`; every `feature_list.json.evidence` entry has an executable command and concrete output/result. F06 records target/full pytest and init plus 403/search/counter behaviour; F07 records respx-isolated MiniMax tests, migration, full pytest and init; F08 records target/full pytest and init plus 403, descending top-5 views, online filtering and notification ownership results.
  - Scope discipline 2/2: commits `bcbbf53`, `2f682bd` and `4d5d8c6` are feature-scoped. Shared app/config/dependency/test-fixture edits enable the active feature directly; no frontend redesign or unrelated deployment work was included.
  - Reliability 2/2: fresh clone `D:\mps-platform-full\mps-platform-eval-m3-clean`, new `.venv-eval`, `pip install -r backend/requirements.txt`, Alembic upgrade through `20260818_0007`, full pytest `30 passed in 8.82s`, and `./init.sh` in that venv `30 passed in 7.10s` all succeeded. The initial evaluator command `python -m alembic` was corrected to the package's supported `alembic.exe`; this was an evaluator-command error, not a repository failure.
  - Maintainability 1/2: F08 is reasonably structured, but F06/F07 routes, service and tests remain densely formatted one-liners with limited type/interface documentation. They are executable and covered, yet cost more to audit and safely extend than the project standard should allow.
  - Handoff readiness 2/2: `feature_list.json` contains per-feature evidence and risks, `claude-progress.md` records M3 state and next action, and `session-handoff.md` preserves F08 contracts and exact verification commands. A new session can locate the M3 contracts from repository artifacts.
  - Calibration note: finding and honestly recording the Cyrillic SQLite search issue, missing runtime `apscheduler`, empty MiniMax-key `LocalProtocolError`, and an unmocked respx MiniMax request before marking features passing is positive evidence of defect discovery and final verification; it supports 2/2 for Verification and Scope discipline rather than concealing regressions. It also exposes a process weakness: dependency declarations and external-client test isolation were not validated early enough. Add a pre-merge dependency/import smoke check and a no-network test guard before the next sprint.

- 2026-08-18, M3 Maintainability re-evaluation, total revised 12/12 — **Accept**.
  - Maintainability 2/2: F06 forum endpoints and F07 `irishka.run()` now use readable multi-line control flow and document inputs, return values and side effects. `init.sh` runs `python -m pip check` before pytest, while the global strict `respx` fixture blocks every unmocked HTTPX request before a network connection and permits explicit F07 mocks. Verification after the change: full pytest — `31 passed in 10.06s`; `./init.sh` — `pip check: No broken requirements found`, `31 passed in 7.65s`.
