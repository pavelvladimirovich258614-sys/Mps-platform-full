import re
from collections.abc import Mapping
from typing import Any

from app.schemas.f05 import AnswerIn


QUESTION_MARKER = re.compile(r"#Q(\d+)")


def parse_qa_reply(
    update: Mapping[str, Any], *, managers_chat_id: str, lawyer_tg_id: str
) -> AnswerIn | None:
    """Return an answer only for a reply from a configured Q&A Telegram chat."""

    message = update.get("message")
    if not isinstance(message, Mapping):
        return None

    chat = message.get("chat")
    reply_to_message = message.get("reply_to_message")
    if not isinstance(chat, Mapping) or not isinstance(reply_to_message, Mapping):
        return None

    allowed_chat_ids = {value for value in (managers_chat_id, lawyer_tg_id) if value}
    if str(chat.get("id")) not in allowed_chat_ids:
        return None

    question_text = reply_to_message.get("text")
    answer = message.get("text")
    if not isinstance(question_text, str) or not isinstance(answer, str) or not answer.strip():
        return None
    match = QUESTION_MARKER.search(question_text)
    if match is None:
        return None

    sender = message.get("from")
    if not isinstance(sender, Mapping):
        return None
    name = " ".join(
        value.strip()
        for value in (sender.get("first_name"), sender.get("last_name"))
        if isinstance(value, str) and value.strip()
    )
    return AnswerIn(
        question_id=int(match.group(1)),
        answer=answer.strip(),
        answered_by_name=name or "Telegram",
    )
