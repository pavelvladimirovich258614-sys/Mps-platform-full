import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, literal_column, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db
from app.models.comment import Comment
from app.models.forum import ForumTopic
from app.models.post import Post, PostStatus, PostType
from app.models.review import ModerationStatus
from app.models.user import User, UserFollow
from app.schemas.discovery import DiscoverySearchResponse, RecommendedAuthorsResponse


router = APIRouter(prefix="/discovery", tags=["discovery"])
ACTIVITY_WINDOW_DAYS = 30


def eligible_author_conditions(viewer_id: int):
    cutoff = datetime.now(UTC) - timedelta(days=ACTIVITY_WINDOW_DAYS)
    has_published_post = select(Post.id).where(
        Post.author_id == User.id,
        Post.status == PostStatus.PUBLISHED,
    ).exists()
    has_approved_comment = select(Comment.id).where(
        Comment.user_id == User.id,
        Comment.status == ModerationStatus.APPROVED,
    ).exists()
    is_followed = select(UserFollow.following_id).where(
        UserFollow.follower_id == viewer_id,
        UserFollow.following_id == User.id,
    ).exists()
    return (
        User.id != viewer_id,
        User.last_seen_at >= cutoff,
        User.is_anonymous.is_(False),
        User.is_banned.is_(False),
        or_(has_published_post, has_approved_comment),
        ~is_followed,
    )


def author_item(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "avatar_url": user.avatar_url,
        "bio": user.bio,
    }


@router.get("/search", response_model=DiscoverySearchResponse)
async def discovery_search(
    q: str = Query(min_length=2, max_length=100),
    limit: int = Query(default=5, ge=1, le=10),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Search published articles, public authors, and forum topics."""

    term = q.strip()
    russian = literal_column("'russian'::regconfig")
    empty_text = literal_column("''")
    separator = literal_column("' '")
    article_document = func.to_tsvector(
        russian,
        func.coalesce(Post.title, empty_text)
        + separator
        + func.coalesce(Post.body, empty_text),
    )
    article_query = func.websearch_to_tsquery(russian, term)

    articles = list((await session.scalars(
        select(Post)
        .where(
            Post.type == PostType.ARTICLE,
            Post.status == PostStatus.PUBLISHED,
            article_document.op("@@")(article_query),
        )
        .order_by(func.ts_rank_cd(article_document, article_query).desc(), Post.id.desc())
        .limit(limit)
    )).all())
    authors = list((await session.scalars(
        select(User)
        .where(
            User.is_anonymous.is_(False),
            User.is_banned.is_(False),
            User.name.ilike(f"%{term}%"),
        )
        .order_by(func.similarity(User.name, term).desc(), User.id.desc())
        .limit(limit)
    )).all())
    forum_topics = list((await session.scalars(
        select(ForumTopic)
        .where(ForumTopic.title.ilike(f"%{term}%"))
        .order_by(func.similarity(ForumTopic.title, term).desc(), ForumTopic.id.desc())
        .limit(limit)
    )).all())

    return {
        "articles": [
            {"id": article.id, "title": article.title, "slug": article.slug}
            for article in articles
        ],
        "authors": [author_item(author) for author in authors],
        "forum_topics": [
            {"id": topic.id, "title": topic.title, "country_id": topic.country_id}
            for topic in forum_topics
        ],
    }


@router.get("/recommended-authors", response_model=RecommendedAuthorsResponse)
async def recommended_authors(
    limit: int = Query(default=4, ge=3, le=4),
    exclude_ids: list[int] = Query(default=[], max_length=50),
    viewer: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Return a small discovery sample without sorting the full user table randomly."""

    max_user_id = await session.scalar(select(func.max(User.id))) or 0
    if max_user_id == 0:
        return {"items": [], "activity_window_days": ACTIVITY_WINDOW_DAYS}

    pivot = secrets.randbelow(max_user_id) + 1
    conditions = eligible_author_conditions(viewer.id)
    if exclude_ids:
        conditions = (*conditions, User.id.not_in(exclude_ids))
    selected = list((await session.scalars(
        select(User)
        .where(*conditions, User.id >= pivot)
        .order_by(User.id)
        .limit(limit)
    )).all())

    if len(selected) < limit:
        selected.extend((await session.scalars(
            select(User)
            .where(*conditions, User.id < pivot)
            .order_by(User.id)
            .limit(limit - len(selected))
        )).all())

    return {
        "items": [author_item(user) for user in selected],
        "activity_window_days": ACTIVITY_WINDOW_DAYS,
    }
