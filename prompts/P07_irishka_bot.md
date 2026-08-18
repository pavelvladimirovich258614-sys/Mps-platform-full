# P07 — Сессия Codex: ИИ-помощник «Иришка» (фича F07)

---
Прочитай AGENTS.md, стартовый воркфлоу. Фича — **F07**. Прочитай BACKEND_SPEC §4 (irishka), TZ §3 F-F.

Сделай:
1. Служебный пользователь «Иришка · ИИ-помощник» (миграция данных, role editor, флаг в notes).
2. services/irishka.py: клиент MiniMax API (httpx, MINIMAX_API_KEY/MINIMAX_MODEL из env), системный промпт по спеке §4 (без цен, без юридических гарантий; ценовой/визовый триггер → короткая переадресация + создание question(target=manager) от автора темы).
3. Планировщик: apscheduler (AsyncIOScheduler в lifespan FastAPI) — задача каждые 5 минут: темы без ответа старше settings.irishka_delay_min (модель settings key-value создай, дефолты сидером: irishka_delay_min=30, irishka_enabled=true), не более одного ИИ-ответа на тему (проверка по is_ai).
4. Флаг irishka_enabled — выключатель без редеплоя (PATCH /admin/settings появится в F08; пока значение читается из БД).
5. Тесты: MiniMax замокан; все сценарии из verification F07.

Заверши по AGENTS.md.
