from datetime import datetime
from enum import Enum

from sqlalchemy import CheckConstraint, DateTime, Enum as SqlEnum, ForeignKey, Integer, SmallInteger, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ReviewSource(str, Enum):
    SITE = "site"
    BOT = "bot"


class ModerationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5", name="reviews_rating_range"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(255))
    rating: Mapped[int] = mapped_column(SmallInteger)
    body: Mapped[str] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[ModerationStatus] = mapped_column(
        SqlEnum(ModerationStatus, native_enum=False), default=ModerationStatus.PENDING
    )
    moderated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source: Mapped[ReviewSource] = mapped_column(SqlEnum(ReviewSource, native_enum=False))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ReviewToken(Base):
    __tablename__ = "review_tokens"

    token: Mapped[str] = mapped_column(String(128), primary_key=True)
    tg_id: Mapped[int] = mapped_column(Integer)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
