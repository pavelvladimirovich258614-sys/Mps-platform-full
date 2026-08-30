import logging

import httpx


logger = logging.getLogger(__name__)


class TelegramRelayError(RuntimeError):
    """A Telegram send failure whose text never carries the Bot API URL or token."""


async def send_message(settings, *, chat_id: str, text: str, context: str) -> int:
    """Send plain text through the configured relay bot without leaking its token."""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.telegram.org/bot{settings.relay_bot_token}/sendMessage",
                json={"chat_id": chat_id, "text": text},
            )
            response.raise_for_status()
            return response.json()["result"]["message_id"]
    except httpx.HTTPError as error:
        logger.error("Telegram relay failed for %s: %s", context, type(error).__name__)
        raise TelegramRelayError("Telegram relay delivery failed") from None


async def send(settings, question):
    """Preserve the established Q&A relay routing and #Q marker contract."""

    chat_id = (
        settings.managers_chat_id
        if question.target.value == "manager"
        else settings.lawyer_tg_id
    )
    return await send_message(
        settings,
        chat_id=chat_id,
        text=f"#Q{question.id}\n{question.body}",
        context=f"question id={question.id}",
    )
