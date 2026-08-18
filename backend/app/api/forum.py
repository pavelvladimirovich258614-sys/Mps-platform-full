from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.forum import ForumMessage, ForumTopic
from app.models.notification import Notification
from app.models.post import Country
from app.models.user import Role, User


router = APIRouter(tags=["forum"])


class TopicIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class MessageIn(BaseModel):
    body: str = Field(min_length=1)


@router.get("/countries")
async def countries(session: AsyncSession = Depends(get_db)):
    """Возвращает активные страны и число тем в каждой без побочных эффектов."""
    rows = (await session.scalars(
        select(Country).where(Country.is_active.is_(True)).order_by(Country.sort_order)
    )).all()
    return [
        {
            "id": country.id,
            "name": country.name,
            "topics_count": await session.scalar(
                select(func.count()).select_from(ForumTopic).where(ForumTopic.country_id == country.id)
            ),
        }
        for country in rows
    ]


@router.get("/countries/{country_id}/topics")
async def topics(
    country_id: int,
    search: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    """Возвращает темы страны; поиск casefold-совместим с кириллицей и не меняет БД."""
    query = select(ForumTopic).where(ForumTopic.country_id == country_id)
    rows = (await session.scalars(query)).all()
    if search:
        term = search.casefold()
        stem = term[:-1] if len(term) > 3 else term
        rows = [topic for topic in rows if term in topic.title.casefold() or stem in topic.title.casefold()]
    return [
        {"id": topic.id, "title": topic.title, "messages_count": topic.messages_count}
        for topic in rows
    ]


@router.post("/countries/{country_id}/topics", status_code=201)
async def create_topic(
    country_id: int,
    payload: TopicIn,
    request: Request,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Создаёт тему; reader/premium ограничены настройкой, editor/admin — без лимита."""
    if await session.get(Country, country_id) is None:
        raise HTTPException(404, "Страна не найдена")
    if user.role not in (Role.EDITOR, Role.ADMIN):
        count = await session.scalar(
            select(func.count()).select_from(ForumTopic).where(ForumTopic.author_id == user.id)
        )
        if count >= request.app.state.settings.forum_topic_limit:
            raise HTTPException(403, "Достигнут лимит тем форума")
    topic = ForumTopic(country_id=country_id, author_id=user.id, title=payload.title)
    session.add(topic)
    await session.commit()
    await session.refresh(topic)
    return {"id": topic.id, "title": topic.title}


@router.get("/topics/{topic_id}/messages")
async def messages(topic_id: int, session: AsyncSession = Depends(get_db)):
    """Возвращает сообщения темы в хронологическом порядке без побочных эффектов."""
    rows = (await session.scalars(
        select(ForumMessage).where(ForumMessage.topic_id == topic_id).order_by(ForumMessage.id)
    )).all()
    return [{"id": message.id, "body": message.body} for message in rows]


@router.post("/topics/{topic_id}/messages", status_code=201)
async def message(
    topic_id: int,
    payload: MessageIn,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Добавляет сообщение, обновляет счётчики темы и уведомляет другого автора темы."""
    topic = await session.get(ForumTopic, topic_id)
    if topic is None:
        raise HTTPException(404, "Тема не найдена")
    forum_message = ForumMessage(topic_id=topic_id, author_id=user.id, body=payload.body)
    session.add(forum_message)
    topic.messages_count += 1
    topic.last_message_at = datetime.now(UTC)
    if topic.author_id != user.id:
        session.add(
            Notification(
                user_id=topic.author_id,
                type="forum_message",
                payload={"topic_id": topic.id, "message_id": None},
            )
        )
    await session.commit()
    await session.refresh(forum_message)
    return {"id": forum_message.id, "body": forum_message.body}
