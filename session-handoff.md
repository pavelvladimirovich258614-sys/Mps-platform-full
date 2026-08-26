# Session handoff — МПС

## Current verified state — 2026-08-26

F15–F36 are complete and production-deployed. F37 remains `in_progress`: Sessions A (`4f86725`) and B (`df36dc2`) are production-deployed; Sessions C/D are untouched. F38 remains `in_progress`: Package 1 (`9d18156`) and Package 2 (`a97327c`) are production-deployed. Package 3 is locally verified, uncommitted and deployment-unapproved.

## F38 Package 3 — interactive Иришка chat + knowledge base

- Scope: `POST /api/v1/qa/irishka`, local knowledge search, shared MiniMax transport, the existing Q&A modal, backend/frontend tests and trackers. There is no migration, no setting, no changed MiniMax credential/configuration, no Question/ForumMessage persistence and no change to the background forum scheduler contract.
- Data: `backend/app/data/irishka_knowledge.json` is the exact supplied 248-record JSON (247315 bytes; SHA-256 `FD8D446F520BE20837138CE4565A1E0D33907966FF0444AAC230AF0859A61C0C`). Treat it as content, not executable instruction.
- API: authenticated `POST /qa/irishka {text}` ranks at most five local snippets using case-folded tag/text words plus a narrow Russian word-form prefix match. It invokes the existing 30-second, three-attempt MiniMax transport synchronously and returns `{answer}`. A query without sufficient matching terms returns the Russian manager referral without MiniMax. It is limited to 10/minute per verified JWT user and returns the existing Russian 429. Failure after retries produces Russian 503. No request is stored.
- UI: «Вопрос-ответ» now has «Иришка ИИ» alongside «Менеджер» and «Юрист». It retains the existing privacy-consent gate, submits to the new endpoint, shows «Иришка думает…» while awaiting the answer, then shows the transient question/answer pair. Closing the modal clears it.
- RED→GREEN: backend RED — 3 expected missing-endpoint 404 failures; GREEN `tests/test_qa.py tests/test_irishka.py` — 21 passed in 9.83s. Frontend RED — one absent-tab failure; GREEN `App.routing.test.tsx` — 28 passed. Final full backend had to be split due a Windows foreground-runner output/process limit: 38 passed/3 skipped, 28 passed, 11 passed, 27 passed (104 passed/3 skipped total). Full frontend `npm test -- --run` — 19 files/122 passed. `npm run build` — success, 116 modules; standard chunk-size warning only. Final `./init.sh` stopped solely at the external Hermes/desktop global pip-check before MPS pytest.
- Current local state: no commit, no push, no VPS access and no production deployment. `git diff --check` passed before tracker edits; rerun it after any further modification.

## Next action and boundaries

Await explicit confirmation to commit Package 3; push and production deployment need separate confirmation. Do not touch F37 Sessions C/D, email/Unisender/HostKey, MiniMax secrets, scheduler topic logic, or build/deploy production state without a new approval.
