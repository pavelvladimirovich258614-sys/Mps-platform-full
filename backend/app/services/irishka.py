from datetime import UTC, datetime, timedelta
import logging

from sqlalchemy import select, update

from app.models.forum import ForumMessage, ForumTopic
from app.models.question import Question, QuestionTarget
from app.models.setting import Setting
from app.models.user import User
from app.services.minimax import generate_completion
from app.services import tg_relay


logger = logging.getLogger(__name__)


PROMPT = (
    "Ты Иришка, дружелюбный помощник турагентства. Отвечай кратко и полезно. "
    "Не называй цены и не давай юридических гарантий."
)
TRIGGERS = ("цен", "стоим", "виз", "документ")
async def generate_minimax_answer(settings, title: str) -> str | None:
    """Запрашивает прежний форумный ответ через общий MiniMax transport."""
    return await generate_completion(
        settings,
        system_prompt=PROMPT,
        user_prompt=title,
        context_label=f"темы {title!r}",
        logger=logger,
    )


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
