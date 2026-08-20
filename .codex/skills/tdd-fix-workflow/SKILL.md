---
name: tdd-fix-workflow
description: Apply the project audit-fix workflow with a proven RED test, minimal fix, complete verification, and honest scope splitting.
---

# TDD fix workflow

Use this workflow for a scoped bug fix from an audit finding.

1. Write a RED test that reproduces the reported defect and run it against the current code. Do not call it RED unless it fails for the expected reason.
2. Make the smallest fix that satisfies the failing contract, then run the targeted test until it is green.
3. Before commit, run the targeted verification and the full relevant suite. Record observed results.
4. Assess scope explicitly. Complete a small isolated fix; if a finding needs a product decision, architectural change, or several independent contracts, propose a split plan instead of force-closing it in one session.
