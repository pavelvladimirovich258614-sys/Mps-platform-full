# Session handoff — МПС

## Current verified state — 2026-08-26

- F15–F36 are passing and production-deployed. F37 remains `in_progress`: Sessions A (`4f86725`) and B (`df36dc2`) are deployed; Sessions C/D are untouched.
- F38 remains `in_progress`: Packages 1 (`9d18156`), 2 (`a97327c`) and 3 (`21e55ac`) are production-deployed. Do not start the separately deferred duplicate-run protection or Иришка admin settings UI without a new plan and approval.
- F39 is passing and production-deployed at `e688773`. The default public feed excludes fishka, `/fishki` requests `type=fishka`, and author-profile queries retain all published post types.
- F40 is locally passing. Its first part is already live: the intended relay bot and both manager/lawyer destinations were verified by synthetic `POST /qa` submissions; #Q2 (lawyer) and #Q3 (manager) each persisted real Telegram `message_id=5` in their respective chats. Its second part is a local frontend fix: a responsive Q&A composer footer with a normal textarea in all three tabs. No F40 CSS code has been pushed or deployed.

## F40 evidence

- Diagnosis: the shared `.qa-modal>footer` flex row put textarea, consent label and both buttons together; the textarea had no protected width, while the broad footer-button rule styled the inline policy button as a full-size action.
- RED: `npm test -- --run src/components/QA.test.tsx` failed as expected because the dedicated composer footer contract did not exist.
- GREEN target: same command — 1 passed. The test imports the real stylesheet (Vitest `css: true`) and checks 100% textarea width, 96px minimum height, consent checkbox, policy control and submit control in Manager, Lawyer and Иришка ИИ tabs.
- Full frontend: `npm test -- --run` — 20 files / 125 passed. Build: `npm run build` — success, 116 modules; only the standard Vite chunk-size warning.
- Final `./init.sh` outside sandbox stopped only at the known external Hermes/desktop global `pip check` before MPS pytest; no environment repair was attempted.

## Next action and boundaries

Create the authorised local F40 commit, then wait for separate approval to push and perform a frontend-only production deployment with smoke and live Q&A modal verification. Do not touch F37 C/D, F38 deferred work, Unisender/HostKey/email, MiniMax credentials or production state before that approval.
