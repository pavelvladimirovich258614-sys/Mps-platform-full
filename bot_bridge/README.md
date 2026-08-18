# Мост ответов Telegram

Этот модуль подключается к существующему боту «Под солнцем»: он ловит reply менеджера на сообщение с `#Q{id}` и вызывает backend `POST /api/v1/internal/qa-answer`.

Установка в окружении существующего бота:

```bash
pip install -r bot_bridge/requirements.txt
```

Подключение: импортируйте `build_router` из `bot_bridge.aiogram_router`, передайте URL backend, `BOT_BRIDGE_SECRET` и ID чата менеджеров, затем вызовите `dp.include_router(router)`. Секрет и chat ID должны поступать из конфигурации бота, а не из кода.
