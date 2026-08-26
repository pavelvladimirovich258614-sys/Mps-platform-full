# Мост ответов Telegram

Этот необязательный aiogram-адаптер пересылает reply из чата менеджеров или лички юриста в backend `POST /api/v1/internal/telegram-webhook`. Backend остаётся единственной точкой разбора `#Q{id}` и проверки источника ответа.

Подключение: импортируйте `build_router` из `bot_bridge.aiogram_router`, передайте URL backend, `TELEGRAM_WEBHOOK_SECRET`, `MANAGERS_CHAT_ID` и необязательный `LAWYER_TG_ID`, затем вызовите `dp.include_router(router)`. Все значения должны поступать из конфигурации, а не из кода.
