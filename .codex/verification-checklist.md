# Verification checklist

Перед тем как писать `passing`, проверь:

- [ ] Перед production frontend build заданы `VITE_API_URL=https://<domain>/api/v1` (через nginx, не localhost/порт backend) и `VITE_TELEGRAM_BOT_USERNAME`; после build оба значения подтверждены в `dist`.
- [ ] Команда верификации реально запущена в этом сообщении.
- [ ] Прочитаны полный вывод и exit code команды, а не сделано предположение по частичному логу.
- [ ] Если хотя бы одна обязательная проверка не запускалась, статус остаётся `in_progress` или `blocked`, а не `passing`.
