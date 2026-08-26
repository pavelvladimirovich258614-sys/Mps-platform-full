import asyncio
from datetime import UTC, datetime, timedelta
import logging

import httpx
from sqlalchemy import select, update

from app.models.forum import ForumMessage, ForumTopic
from app.models.question import Question, QuestionTarget
from app.models.setting import Setting
from app.models.user import User
from app.services import tg_relay


logger = logging.getLogger(__name__)


PROMPT = (
    "Ты Иришка, дружелюбный помощник турагентства. Отвечай кратко и полезно. "
    "Не называй цены и не давай юридических гарантий."
)
TRIGGERS = ("цен", "стоим", "виз", "документ")
MINIMAX_TIMEOUT_SECONDS = 30.0
MINIMAX_MAX_ATTEMPTS = 3


async def generate_minimax_answer(settings, title: str) -> str | None:
    """Запрашивает ответ MiniMax с ограниченными retry для временных сбоев."""
    async with httpx.AsyncClient(timeout=httpx.Timeout(MINIMAX_TIMEOUT_SECONDS)) as client:
        for attempt in range(MINIMAX_MAX_ATTEMPTS):
            try:
                response = await client.post(
                    f"{settings.minimax_base_url.rstrip('/')}/chat/completions",
                    headers={"Authorization": f"Bearer {settings.minimax_api_key}"},
                    json={
                        "model": settings.minimax_model,
                        "messages": [
                            {"role": "system", "content": PROMPT},
                            {"role": "user", "content": title},
                        ],
                        "max_completion_tokens": 500,
                    },
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as error:
                if error.response.status_code < 500:
                    logger.error("MiniMax отклонил запрос для темы %r: HTTP %s", title, error.response.status_code)
                    return None
                last_error = error
            except (httpx.TimeoutException, httpx.NetworkError) as error:
                last_error = error

            if attempt + 1 < MINIMAX_MAX_ATTEMPTS:
                delay = 0.5 * (2 ** attempt)
                logger.warning("Временный сбой MiniMax для темы %r, повтор через %.1f с", title, delay)
                await asyncio.sleep(delay)

    logger.error("MiniMax не ответил для темы %r после %s попыток: %s", title, MINIMAX_MAX_ATTEMPTS, last_error)
    return None


async def run(session_factory, settings) -> int:
    """Публикует по одному ИИ-ответу для подходящих старых тем.

    Принимает фабрику async SQLAlchemy-сессий и runtime-настройки MiniMax.
    Возвращает число созданных сообщений. Читает настройки Иришки из БД,
    создаёт ForumMessage и обновляет счётчики тем; ценовые и юридические темы
    вместо вызова MiniMax создают Question для менеджера.
    """
    async with session_factory() as session:
        values = {setting.key: setting.value for setting in (await session.scalars(select(Setting))).all()}
        if values.get("irishka_enabled", "true").lower() != "true":
            return 0

        delay = int(values.get("irishka_delay_min", "30"))
        cutoff = datetime.now(UTC) - timedelta(minutes=delay)
        assistant = await session.scalar(select(User).where(User.email == "irishka@system.local"))
        topics = (await session.scalars(
            select(ForumTopic).where(ForumTopic.created_at <= cutoff)
        )).all()
        made = 0

        for topic in topics:
            messages = (await session.scalars(
                select(ForumMessage).where(ForumMessage.topic_id == topic.id)
            )).all()
            if messages or not assistant:
                continue

            lower_title = topic.title.casefold()
            if any(trigger in lower_title for trigger in TRIGGERS):
                text = "Уточню у менеджера и вернусь с ответом."
                question = Question(
                    user_id=topic.author_id,
                    target=QuestionTarget.MANAGER,
                    body=topic.title,
                )
                session.add(question)
                await session.flush()
                try:
                    question.tg_message_id = await tg_relay.send(settings, question)
                except Exception:
                    logger.exception("Не удалось отправить менеджеру вопрос Иришки id=%s", question.id)
            else:
                text = await generate_minimax_answer(settings, topic.title)
                if text is None:
                    continue

            session.add(
                ForumMessage(topic_id=topic.id, author_id=assistant.id, body=text, is_ai=True)
            )
            await session.flush()
            await session.execute(
                update(ForumTopic)
                .where(ForumTopic.id == topic.id)
                .values(
                    messages_count=ForumTopic.messages_count + 1,
                    last_message_at=datetime.now(UTC),
                )
            )
            made += 1

        await session.commit()
        return made
