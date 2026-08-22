from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db, get_optional_current_user
from app.models.notification import Notification
from app.api.posts import dto as post_dto
from app.models.post import Country, Post, PostStatus, post_likes
from app.models.user import User, UserFollow
from app.schemas.admin import NotificationsReadUpdate
from app.schemas.user import PublicProfileResponse, UserResponse, UserUpdate

router = APIRouter(tags=["profile"])


async def get_public_profile_user(session: AsyncSession, user_id: int) -> User:
    user = await session.scalar(
        select(User).where(
            User.id == user_id,
            User.is_anonymous.is_(False),
            User.is_banned.is_(False),
        )
    )
    if user is None:
        raise HTTPException(404, "Профиль не найден")
    return user


async def followers_count(session: AsyncSession, user_id: int) -> int:
    return await session.scalar(
        select(func.count()).select_from(UserFollow).where(UserFollow.following_id == user_id)
    ) or 0


def published_countries_query(user_id: int):
    """Return unique, display-ordered countries used in an author's publications."""
    return (
        select(Country.id, Country.name, Country.flag_emoji, Country.sort_order)
        .join(Post, Post.country_id == Country.id)
        .where(
            Post.author_id == user_id,
            Post.status == PostStatus.PUBLISHED,
            Country.is_active.is_(True),
        )
        .distinct()
        .order_by(Country.sort_order, Country.id)
    )


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserResponse)
async def update_me(payload: UserUpdate, session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await session.commit(); await session.refresh(user)
    return user


@router.get("/users/{user_id}/profile", response_model=PublicProfileResponse)
async def public_profile(
    user_id: int,
    session: AsyncSession = Depends(get_db),
    viewer: User | None = Depends(get_optional_current_user),
) -> dict:
    user = await get_public_profile_user(session, user_id)
    posts_count = await session.scalar(
        select(func.count(Post.id)).where(
            Post.author_id == user.id,
            Post.status == PostStatus.PUBLISHED,
        )
    ) or 0
    country_rows = (await session.execute(published_countries_query(user.id))).mappings().all()
    profile_followers_count = await followers_count(session, user.id)
    profile_following_count = await session.scalar(
        select(func.count()).select_from(UserFollow).where(UserFollow.follower_id == user.id)
    ) or 0
    is_following = bool(
        viewer is not None
        and await session.scalar(
            select(UserFollow.follower_id).where(
                UserFollow.follower_id == viewer.id,
                UserFollow.following_id == user.id,
            )
        )
    )
    countries = [
        {"id": row["id"], "name": row["name"], "flag_emoji": row["flag_emoji"]}
        for row in country_rows
    ]
    return {
        "id": user.id,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
        "posts_count": posts_count,
        "followers_count": profile_followers_count,
        "following_count": profile_following_count,
        "is_following": is_following,
        "countries": countries,
    }


@router.get("/users/{user_id}/likes")
async def public_profile_likes(user_id: int, session: AsyncSession = Depends(get_db)) -> list[dict]:
    await get_public_profile_user(session, user_id)
    posts = (await session.execute(
        select(Post, User)
        .join(post_likes, post_likes.c.post_id == Post.id)
        .join(User, User.id == Post.author_id)
        .where(
            post_likes.c.user_id == user_id,
            Post.status == PostStatus.PUBLISHED,
        )
        .order_by(post_likes.c.created_at.desc(), Post.id.desc())
    )).all()
    return [post_dto(post, author) for post, author in posts]


@router.post("/users/{user_id}/follow", status_code=201)
async def follow_user(
    user_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    if user.id == user_id:
        raise HTTPException(422, "Нельзя подписаться на собственный профиль")
    await get_public_profile_user(session, user_id)
    exists = await session.scalar(
        select(UserFollow.follower_id).where(
            UserFollow.follower_id == user.id,
            UserFollow.following_id == user_id,
        )
    )
    if exists is not None:
        raise HTTPException(409, "Вы уже подписаны на этого пользователя")
    session.add(UserFollow(follower_id=user.id, following_id=user_id))
    await session.commit()
    return {"followers_count": await followers_count(session, user_id), "is_following": True}


@router.delete("/users/{user_id}/follow")
async def unfollow_user(
    user_id: int,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    await get_public_profile_user(session, user_id)
    await session.execute(
        delete(UserFollow).where(
            UserFollow.follower_id == user.id,
            UserFollow.following_id == user_id,
        )
    )
    await session.commit()
    return {"followers_count": await followers_count(session, user_id), "is_following": False}


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
