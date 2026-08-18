import hmac
import secrets
from datetime import UTC, datetime, timedelta

import nh3
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db, require_role
from app.models.notification import Notification
from app.models.review import ModerationStatus, Review, ReviewSource, ReviewToken
from app.models.user import Role, User
from app.schemas.moderation import (
    ModerateRequest,
    ModerationAction,
    ReviewCreate,
    ReviewTokenCreate,
    TokenReviewCreate,
)

router = APIRouter(tags=["reviews"])
reviews_router = APIRouter(prefix="/reviews", tags=["reviews"])
TOKEN_TTL = timedelta(days=7)


def review_dto(review: Review) -> dict:
    return {
        "id": review.id,
        "author_name": review.author_name,
        "rating": review.rating,
        "body": review.body,
        "photo_url": review.photo_url,
        "status": review.status.value,
        "source": review.source.value,
    }


async def pending_reviews_count(session: AsyncSession) -> int:
    return await session.scalar(select(func.count()).select_from(Review).where(Review.status == ModerationStatus.PENDING)) or 0


@reviews_router.get("")
async def list_reviews(status: ModerationStatus = ModerationStatus.APPROVED, session: AsyncSession = Depends(get_db)):
    if status != ModerationStatus.APPROVED:
        raise HTTPException(422, "Публично доступны только одобренные отзывы")
    reviews = (await session.scalars(select(Review).where(Review.status == ModerationStatus.APPROVED))).all()
    return [review_dto(review) for review in reviews]


@reviews_router.post("", status_code=201)
async def create_review(
    payload: ReviewCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    review = Review(
        user_id=user.id,
        author_name=payload.author_name,
        rating=payload.rating,
        body=nh3.clean(payload.body),
        photo_url=payload.photo_url,
        source=ReviewSource.SITE,
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return review_dto(review)


@reviews_router.post("/by-token", status_code=201)
async def create_review_by_token(payload: TokenReviewCreate, session: AsyncSession = Depends(get_db)):
    review_token = await session.get(ReviewToken, payload.token)
    if review_token is None:
        raise HTTPException(404, "Токен отзыва не найден")
    expires_at = review_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=UTC)
    if expires_at <= datetime.now(UTC):
        await session.delete(review_token)
        await session.commit()
        raise HTTPException(410, "Срок действия токена отзыва истёк")
    review = Review(
        author_name=payload.author_name,
        rating=payload.rating,
        body=nh3.clean(payload.body),
        photo_url=payload.photo_url,
        source=ReviewSource.BOT,
    )
    session.add(review)
    await session.delete(review_token)
    await session.commit()
    await session.refresh(review)
    return review_dto(review)


@reviews_router.patch("/{review_id}/moderate")
async def moderate_review(
    review_id: int,
    payload: ModerateRequest,
    session: AsyncSession = Depends(get_db),
    editor: User = Depends(require_role(Role.EDITOR)),
):
    review = await session.get(Review, review_id)
    if review is None:
        raise HTTPException(404, "Отзыв не найден")
    review.status = ModerationStatus.APPROVED if payload.action == ModerationAction.APPROVE else ModerationStatus.REJECTED
    review.moderated_by = editor.id
    if review.status == ModerationStatus.APPROVED and review.user_id is not None:
        session.add(Notification(user_id=review.user_id, type="review_approved", payload={"review_id": review.id}))
    await session.commit()
    await session.refresh(review)
    return {"review": review_dto(review), "pending_count": await pending_reviews_count(session)}


@router.post("/internal/review-tokens", status_code=201)
async def create_review_token(
    payload: ReviewTokenCreate,
    request: Request,
    x_bot_bridge_secret: str | None = Header(default=None),
    session: AsyncSession = Depends(get_db),
):
    """Issue a seven-day, single-use bot review token.

    Accepts {tg_id} and X-Bot-Bridge-Secret; returns token and expiry (201).
    Bad secret is 401; consumption returns 404 after use and 410 after expiry.
    Issuing itself creates no notification.
    """
    configured_secret = request.app.state.settings.bot_bridge_secret
    if not configured_secret or x_bot_bridge_secret is None or not hmac.compare_digest(x_bot_bridge_secret, configured_secret):
        raise HTTPException(401, "Недействительный внутренний секрет")
    review_token = ReviewToken(
        token=secrets.token_urlsafe(32),
        tg_id=payload.tg_id,
        expires_at=datetime.now(UTC) + TOKEN_TTL,
    )
    session.add(review_token)
    await session.commit()
    return {"token": review_token.token, "expires_at": review_token.expires_at.isoformat()}
