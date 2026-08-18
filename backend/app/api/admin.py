from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db, require_role
from app.models.comment import Comment
from app.models.post import Post
from app.models.question import Question, QuestionStatus
from app.models.review import ModerationStatus, Review
from app.models.setting import Setting
from app.models.subscription import Subscription
from app.models.user import Role, User
from app.schemas.admin import SettingsUpdate, UserBanUpdate


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def stats(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(Role.ADMIN)),
) -> dict:
    now = datetime.now(UTC)

    async def count(statement):
        return await session.scalar(statement) or 0

    top_posts = (await session.scalars(
        select(Post).order_by(Post.views.desc(), Post.id.desc()).limit(5)
    )).all()
    return {
        "users_total": await count(select(func.count(User.id))),
        "users_active_30d": await count(select(func.count(User.id)).where(User.last_seen_at >= now - timedelta(days=30))),
        "users_new_7d": await count(select(func.count(User.id)).where(User.created_at >= now - timedelta(days=7))),
        "users_new_30d": await count(select(func.count(User.id)).where(User.created_at >= now - timedelta(days=30))),
        "subscribers_confirmed": await count(select(func.count(Subscription.id)).where(Subscription.confirmed.is_(True))),
        "questions_open": await count(select(func.count(Question.id)).where(Question.status == QuestionStatus.OPEN)),
        "questions_answered": await count(select(func.count(Question.id)).where(Question.status == QuestionStatus.ANSWERED)),
        "reviews_pending": await count(select(func.count(Review.id)).where(Review.status == ModerationStatus.PENDING)),
        "top_posts": [{"id": post.id, "title": post.title, "slug": post.slug, "views": post.views} for post in top_posts],
    }


@router.get("/moderation/queue")
async def moderation_queue(
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(Role.ADMIN)),
) -> dict:
    reviews = (await session.scalars(
        select(Review).where(Review.status == ModerationStatus.PENDING)
    )).all()
    comments = (await session.scalars(
        select(Comment).where(Comment.status == ModerationStatus.PENDING)
    )).all()
    items = [
        {
            "kind": "review",
            "id": review.id,
            "user_id": review.user_id,
            "author_name": review.author_name,
            "body": review.body,
            "created_at": review.created_at,
        }
        for review in reviews
    ] + [
        {
            "kind": "comment",
            "id": comment.id,
            "user_id": comment.user_id,
            "author_name": None,
            "body": comment.body,
            "created_at": comment.created_at,
        }
        for comment in comments
    ]
    items.sort(key=lambda item: item["created_at"], reverse=True)
    return {"items": items}


@router.get("/users")
async def users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(Role.ADMIN)),
) -> dict:
    total = await session.scalar(select(func.count(User.id))) or 0
    values = (await session.scalars(
        select(User).order_by(User.id.desc()).offset((page - 1) * page_size).limit(page_size)
    )).all()
    return {
        "items": [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "role": user.role.value,
                "is_banned": user.is_banned,
                "created_at": user.created_at,
            }
            for user in values
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/users/{user_id}")
async def update_user(
    user_id: int,
    payload: UserBanUpdate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(Role.ADMIN)),
) -> dict:
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_banned = payload.is_banned
    await session.commit()
    return {"id": user.id, "is_banned": user.is_banned}


@router.patch("/settings")
async def update_settings(
    payload: SettingsUpdate,
    session: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(Role.ADMIN)),
) -> dict[str, str]:
    values = payload.model_dump(exclude_unset=True, mode="json")
    for key, value in values.items():
        setting = await session.get(Setting, key)
        serialized = str(value).lower() if isinstance(value, bool) else str(value)
        if setting is None:
            session.add(Setting(key=key, value=serialized))
        else:
            setting.value = serialized
    await session.commit()
    return {key: str(value).lower() if isinstance(value, bool) else str(value) for key, value in values.items()}
