import base64
import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.forum import ForumMessage, ForumTopic
from app.models.notification import Notification
from app.models.post import Country
from app.models.user import Role, User
from app.rate_limit import forum_user_or_ip_key, limiter


router = APIRouter(tags=["forum"])


class TopicIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class MessageIn(BaseModel):
    body: str = Field(min_length=1)


def encode_forum_cursor(item_id: int) -> str:
    payload = json.dumps({"id": item_id}, separators=(",", ":"))
    return base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")


def decode_forum_cursor(cursor: str) -> int:
    try:
        padding = "=" * (-len(cursor) % 4)
        payload = json.loads(base64.urlsafe_b64decode(cursor + padding))
        item_id = int(payload["id"])
        if item_id < 1:
            raise ValueError
        return item_id
    except (KeyError, TypeError, ValueError, UnicodeDecodeError):
        raise HTTPException(422, "Некорректный курсор форума")


@router.get("/countries")
async def countries(session: AsyncSession = Depends(get_db)):
    """Возвращает активные страны и число тем в каждой одним агрегирующим запросом."""
    rows = (await session.execute(
        select(Country, func.count(ForumTopic.id).label("topics_count"))
        .outerjoin(ForumTopic, ForumTopic.country_id == Country.id)
        .where(Country.is_active.is_(True))
        .group_by(Country.id, Country.name, Country.flag_emoji, Country.sort_order, Country.is_active)
        .order_by(Country.sort_order, Country.id)
    )).all()
    return [
        {
            "id": country.id,
            "name": country.name,
            "topics_count": topics_count,
        }
        for country, topics_count in rows
    ]


@router.get("/countries/{country_id}/topics")
async def topics(
    country_id: int,
    search: str | None = None,
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    """Возвращает SQL-filtered keyset page тем страны."""
    conditions = [ForumTopic.country_id == country_id]
    if search:
        term = search.casefold()
        stem = term[:-1] if len(term) > 3 else term
        conditions.append(or_(ForumTopic.title.ilike(f"%{term}%"), ForumTopic.title.ilike(f"%{stem}%")))
    if cursor:
        conditions.append(ForumTopic.id < decode_forum_cursor(cursor))
    rows = list((await session.scalars(
        select(ForumTopic)
        .where(*conditions)
        .order_by(ForumTopic.id.desc())
        .limit(limit + 1)
    )).all())
    page = rows[:limit]
    return {
        "items": [{"id": topic.id, "title": topic.title, "author_id": topic.author_id, "messages_count": topic.messages_count} for topic in page],
        "next_cursor": encode_forum_cursor(page[-1].id) if len(rows) > limit else None,
    }


@router.post("/countries/{country_id}/topics", status_code=201)
@limiter.limit("5/minute", key_func=forum_user_or_ip_key)
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
        await session.execute(select(User.id).where(User.id == user.id).with_for_update())
        count = await session.scalar(
            select(func.count()).select_from(ForumTopic).where(ForumTopic.author_id == user.id)
        )
        if count >= request.app.state.settings.forum_topic_limit:
            raise HTTPException(403, "Достигнут лимит тем форума")
    topic = ForumTopic(country_id=country_id, author_id=user.id, title=payload.title)
    session.add(topic)
    await session.commit()
    await session.refresh(topic)
    return {"id": topic.id, "title": topic.title, "author_id": topic.author_id, "messages_count": topic.messages_count}


@router.get("/topics/{topic_id}/messages")
async def messages(
    topic_id: int,
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = None,
    session: AsyncSession = Depends(get_db),
):
    """Возвращает keyset page сообщений темы с автором и признаком ответа Иришки."""
    conditions = [ForumMessage.topic_id == topic_id]
    if cursor:
        conditions.append(ForumMessage.id < decode_forum_cursor(cursor))
    rows = (
        await session.execute(
            select(ForumMessage, User)
            .join(User, User.id == ForumMessage.author_id)
            .where(*conditions)
            .order_by(ForumMessage.id.desc())
            .limit(limit + 1)
        )
    ).all()
    page = rows[:limit]
    return {
        "items": [
        {
            "id": message.id,
            "body": message.body,
            "author": {
                "id": author.id,
                "name": author.name,
                "avatar_url": author.avatar_url,
            },
            "is_ai": message.is_ai,
        }
        for message, author in page
        ],
        "next_cursor": encode_forum_cursor(page[-1][0].id) if len(rows) > limit else None,
    }


@router.post("/topics/{topic_id}/messages", status_code=201)
@limiter.limit("10/minute", key_func=forum_user_or_ip_key)
async def message(
    topic_id: int,
    payload: MessageIn,
    request: Request,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Добавляет сообщение, обновляет счётчики темы и уведомляет другого автора темы."""
    topic = await session.get(ForumTopic, topic_id)
    if topic is None:
        raise HTTPException(404, "Тема не найдена")
    if topic.is_locked:
        raise HTTPException(423, "Тема закрыта")
    forum_message = ForumMessage(topic_id=topic_id, author_id=user.id, body=payload.body)
    session.add(forum_message)
    await session.flush()
    updated = await session.execute(
        update(ForumTopic)
        .where(ForumTopic.id == topic_id, ForumTopic.is_locked.is_(False))
        .values(
            messages_count=ForumTopic.messages_count + 1,
            last_message_at=datetime.now(UTC),
        )
    )
    if updated.rowcount != 1:
        await session.rollback()
        raise HTTPException(423, "Тема закрыта")
    if topic.author_id != user.id:
        session.add(
            Notification(
                user_id=topic.author_id,
                type="forum_message",
                payload={"topic_id": topic.id, "message_id": forum_message.id},
            )
        )
    await session.commit()
    await session.refresh(forum_message)
    return {"id": forum_message.id, "body": forum_message.body}


@router.delete("/topics/{topic_id}", status_code=204)
async def delete_topic(
    topic_id: int,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Удаляет свою тему или любую тему для администратора; сообщения каскадируются БД."""
    topic = await session.get(ForumTopic, topic_id)
    if topic is None:
        raise HTTPException(404, "Тема не найдена")
    if topic.author_id != user.id and user.role != Role.ADMIN:
        raise HTTPException(403, "Недостаточно прав")
    await session.delete(topic)
    await session.commit()


@router.delete("/messages/{message_id}", status_code=204)
async def delete_message(
    message_id: int,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Удаляет своё сообщение или любое сообщение для администратора и обновляет тему атомарно."""
    forum_message = await session.get(ForumMessage, message_id)
    if forum_message is None:
        raise HTTPException(404, "Сообщение не найдено")
    if forum_message.author_id != user.id and user.role != Role.ADMIN:
        raise HTTPException(403, "Недостаточно прав")

    topic_id = forum_message.topic_id
    await session.delete(forum_message)
    await session.flush()
    newest_remaining_message_at = (
        select(func.max(ForumMessage.created_at))
        .where(ForumMessage.topic_id == topic_id)
        .scalar_subquery()
    )
    await session.execute(
        update(ForumTopic)
        .where(ForumTopic.id == topic_id)
        .values(
            messages_count=case((ForumTopic.messages_count > 0, ForumTopic.messages_count - 1), else_=0),
            last_message_at=func.coalesce(newest_remaining_message_at, ForumTopic.created_at),
        )
    )
    await session.commit()
