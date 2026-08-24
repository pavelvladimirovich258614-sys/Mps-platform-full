# Session handoff — МПС

## Verified final state — 2026-08-24

F01–F23 passing локально. Production frontend F22 находится на `1a680db`; F23 ожидает отдельного approval на push/deploy.

- F23: Bold/Italic/Strike не наследуются при вводе ровно справа от форматированного фрагмента (`inclusive: false`); ввод внутри mark остаётся форматированным. F22 toolbar reactivity и Ctrl+B/Ctrl+I сохранены тестами.
- F23 RED→GREEN: targeted RichTextEditor — 18 passed; full frontend — 15 files / 82 passed; build — 114 modules success; full backend — 65 passed.
- `init.sh` исправлен отдельным `e6e9012`: installation использует `python -m pip`. После установки он упирается только в глобальный внешний Hermes/desktop `pip check`; MPS suite отдельно зелёный. Не менять внешние зависимости без отдельного решения.
- F15 edit/prefill/PATCH/delete, composer/cарусель, likes/comments/profile остаются покрытыми ранее; F23 не меняет backend, API, dependencies, database или stored HTML.

## Known unresolved boundary

Email по-прежнему заблокирован внешней сетью к Unisender/HostKey. Не менять email transport, credentials, firewall или VPS networking без отдельного решения Павла.

## Next step

Дождаться отдельного approval Павла для push и frontend-only deployment F23. После него: authenticated composer smoke для B/I/S на правой границе и внутри mark; backend не перезапускать.
