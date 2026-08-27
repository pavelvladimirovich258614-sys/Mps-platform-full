from datetime import UTC, datetime, timedelta
import logging

from sqlalchemy import func, select, update
from sqlalchemy.exc import SQLAlchemyError

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
ADVISORY_LOCK_NAMESPACE = 0x49524953


async def generate_minimax_answer(settings, title: str) -> str | None:
    """Запрашивает прежний форумный ответ через общий MiniMax transport."""
    return await generate_completion(
        settings,
        system_prompt=PROMPT,
        user_prompt=title,
        context_label=f"темы {title!r}",
        logger=logger,
    )


async def _try_topic_lock(session, topic_id: int) -> bool:
    """Берёт transaction-scoped lock темы во всех PostgreSQL runner."""
    bind = session.get_bind()
    if bind.dialect.name != "postgresql":
        return True
    acquired = await session.scalar(
        select(func.pg_try_advisory_xact_lock(ADVISORY_LOCK_NAMESPACE, topic_id))
    )
    return bool(acquired)


async def _topic_has_messages(session, topic_id: int) -> bool:
    message_id = await session.scalar(
        select(ForumMessage.id).where(ForumMessage.topic_id == topic_id).limit(1)
    )
    return message_id is not None


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
        assistant_id = await session.scalar(
            select(User.id).where(User.email == "irishka@system.local")
        )
        topic_ids = (await session.scalars(
            select(ForumTopic.id).where(ForumTopic.created_at <= cutoff)
        )).all()

    if assistant_id is None:
        return 0

    made = 0
    for topic_id in topic_ids:
        async with session_factory() as session:
            try:
                if not await _try_topic_lock(session, topic_id):
                    continue

                topic = await session.get(ForumTopic, topic_id)
                if topic is None or await _topic_has_messages(session, topic_id):
                    continue

                manager_trigger = any(trigger in topic.title.casefold() for trigger in TRIGGERS)
                if manager_trigger:
                    text = "Уточню у менеджера и вернусь с ответом."
                else:
                    text = await generate_minimax_answer(settings, topic.title)
                    if text is None:
                        continue

                topic = await session.scalar(
                    select(ForumTopic)
                    .where(ForumTopic.id == topic_id)
                    .with_for_update()
                )
                if topic is None or await _topic_has_messages(session, topic_id):
                    continue

                if manager_trigger:
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

                session.add(
                    ForumMessage(topic_id=topic.id, author_id=assistant_id, body=text, is_ai=True)
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
                await session.commit()
                made += 1
            except SQLAlchemyError:
                await session.rollback()
                logger.exception("Не удалось сохранить ответ Иришки для темы id=%s", topic_id)

    return made
