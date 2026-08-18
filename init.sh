#!/usr/bin/env bash
# init.sh — старт сессии проекта МПС. Агент запускает это ПЕРВЫМ.
set -e

INSTALL_CMD="pip install -r backend/requirements.txt -q"
VERIFY_CMD="python -m pytest tests -q"
START_CMD="uvicorn app.main:app --reload --port 8000 --app-dir backend"

echo "== МПС: init =="
echo "Текущая директория: $(pwd)"

if [ ! -f "backend/requirements.txt" ]; then
  echo "[i] backend ещё не создан (это нормально для сессии P01). Верификация пропущена."
  echo "[i] Команда запуска после создания: $START_CMD"
  exit 0
fi

echo "== Установка зависимостей =="
$INSTALL_CMD

echo "== Pre-flight зависимостей =="
if (cd backend && python -m pip check); then
  echo "[OK] Зависимости согласованы."
else
  echo "[FAIL] Обнаружены отсутствующие или несовместимые зависимости."
  exit 1
fi

echo "== Верификация =="
if (cd backend && $VERIFY_CMD); then
  echo "[OK] Верификация прошла."
else
  echo "[FAIL] Верификация упала. СТОП: сначала почини базу, потом фичи."
  exit 1
fi

echo "== Команда запуска dev-сервера =="
echo "$START_CMD"
if [ "${RUN_START_COMMAND:-0}" = "1" ]; then
  $START_CMD
fi
