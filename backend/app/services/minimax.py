import asyncio
import logging

import httpx


MINIMAX_TIMEOUT_SECONDS = 30.0
MINIMAX_MAX_ATTEMPTS = 3


async def generate_completion(
    settings,
    *,
    system_prompt: str,
    user_prompt: str,
    context_label: str,
    logger: logging.Logger,
) -> str | None:
    """Return one MiniMax completion, retrying only transient failures."""

    last_error: Exception | None = None
    async with httpx.AsyncClient(timeout=httpx.Timeout(MINIMAX_TIMEOUT_SECONDS)) as client:
        for attempt in range(MINIMAX_MAX_ATTEMPTS):
            try:
                response = await client.post(
                    f"{settings.minimax_base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.minimax_api_key}"},
                    json={
                        "model": settings.minimax_model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt},
                        ],
                        "max_completion_tokens": 500,
                    },
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as error:
                if error.response.status_code < 500:
                    logger.error("MiniMax отклонил запрос для %s: HTTP %s", context_label, error.response.status_code)
                    return None
                last_error = error
            except (httpx.TimeoutException, httpx.NetworkError) as error:
                last_error = error

            if attempt + 1 < MINIMAX_MAX_ATTEMPTS:
                delay = 0.5 * (2 ** attempt)
                logger.warning("Временный сбой MiniMax для %s, повтор через %.1f с", context_label, delay)
                await asyncio.sleep(delay)

    logger.error("MiniMax не ответил для %s после %s попыток: %s", context_label, MINIMAX_MAX_ATTEMPTS, last_error)
    return None
