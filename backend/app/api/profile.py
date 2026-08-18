from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.admin import NotificationsReadUpdate
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserResponse)
async def update_me(payload: UserUpdate, session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await session.commit(); await session.refresh(user)
    return user


@router.get("/online")
async def online(session: AsyncSession = Depends(get_db)) -> list[dict]:
    users = (await session.scalars(
        select(User)
        .where(User.last_seen_at >= datetime.now(UTC) - timedelta(seconds=120), User.is_anonymous.is_(False))
        .order_by(User.last_seen_at.desc(), User.id.desc())
        .limit(12)
    )).all()
    return [{"id": user.id, "name": user.name, "avatar_url": user.avatar_url} for user in users]


@router.get("/notifications")
async def notifications(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict:
    total = await session.scalar(
        select(func.count(Notification.id)).where(Notification.user_id == user.id)
    ) or 0
    values = (await session.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )).all()
    return {
        "items": [
            {
                "id": notification.id,
                "type": notification.type,
                "payload": notification.payload,
                "is_read": notification.is_read,
                "created_at": notification.created_at,
            }
            for notification in values
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/notifications/read")
async def read_notifications(
    payload: NotificationsReadUpdate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, int]:
    conditions = [Notification.user_id == user.id, Notification.is_read.is_(False)]
    if payload.ids is not None:
        conditions.append(Notification.id.in_(payload.ids))
    result = await session.execute(update(Notification).where(*conditions).values(is_read=True))
    await session.commit()
    return {"updated": result.rowcount}
