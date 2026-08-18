# P09 — Сессия Codex: пересадка фронтенда на API (фича F09)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F09**. Прочитай docs/FRONTEND_AUDIT.md (раздел «Технические замечания») и AGENTS.md правило про frontend/: дизайн и разметку Claude Design НЕ менять.

Сделай:
1. frontend/src/api/client.ts: базовый fetch-клиент (VITE_API_URL), JWT в памяти + refresh через httpOnly cookie, интерсептор 401 → refresh → повтор.
2. Hooks по разделам: useAuth, usePosts, useReviews, useComments, useSubscribe, useQA, useForum, useNotifications, useOnline. Существующие компоненты подключай к хукам, заменяя чтение/запись localStorage. localStorage остаётся только для темы и cookie-баннера.
3. Вход: реальная кнопка Telegram Login Widget (bot username из env) + email-код; роль в шапке — из GET /me; dev-переключатель ролей спрятать за import.meta.env.DEV.
4. Состояния загрузки — использовать скелетоны из блока Е прототипа; ошибки — тост по-русски.
5. Прогони сквозной сценарий: критерии приёмки 1–6 из docs/TZ.md §7 на локальном стенде (backend :8000, frontend :5173), шаги и результаты запиши в evidence.
6. `npm run build` без ошибок; grep-проверка localStorage из verification F09.

Заверши по AGENTS.md.
