import logging

logger = logging.getLogger(__name__)


async def send_code(email: str, code: str) -> None:
    """Record the email delivery request; Unisender transport belongs to F05."""
    del code
    logger.info("Запрошена отправка кода подтверждения на %s", email)
