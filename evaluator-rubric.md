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
