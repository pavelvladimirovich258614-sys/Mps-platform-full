from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy import select

from app.models.forum import ForumMessage, ForumTopic
from app.models.question import Question, QuestionTarget
from app.models.setting import Setting
from app.models.user import User


PROMPT = (
    "Ты Иришка, дружелюбный помощник турагентства. Отвечай кратко и полезно. "
    "Не называй цены и не давай юридических гарантий."
)
TRIGGERS = ("цен", "стоим", "виз", "документ")


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
                session.add(
                    Question(
                        user_id=topic.author_id,
                        target=QuestionTarget.MANAGER,
                        body=topic.title,
                    )
                )
            else:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{settings.minimax_base_url.rstrip('/')}/chat/completions",
                        headers={"Authorization": f"Bearer {settings.minimax_api_key}"},
                        json={
                            "model": settings.minimax_model,
                            "messages": [
                                {"role": "system", "content": PROMPT},
                                {"role": "user", "content": topic.title},
                            ],
                            "max_completion_tokens": 500,
                        },
                    )
                    response.raise_for_status()
                    text = response.json()["choices"][0]["message"]["content"]

            session.add(
                ForumMessage(topic_id=topic.id, author_id=assistant.id, body=text, is_ai=True)
            )
            topic.messages_count += 1
            topic.last_message_at = datetime.now(UTC)
            made += 1

        await session.commit()
        return made
