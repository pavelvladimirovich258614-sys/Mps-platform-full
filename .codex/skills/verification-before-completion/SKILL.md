---
name: verification-before-completion
description: Require fresh, observed verification evidence before claiming a task or feature is passing or complete.
---

# Verification before completion

Before writing any completion or `passing` claim, run the required verification command in the current response and read its complete output and exit code.

- Do not infer a result from an earlier run, a partial log, or expected behavior.
- If any required check did not run in this session, keep the status `in_progress` or `blocked`; do not claim `passing`.
- Do not use «должно быть», «вероятно» or «кажется» next to a `passing` or completion claim.
