from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Table, Column, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.review import ModerationStatus
from sqlalchemy import Enum as SqlEnum


comment_reactions = Table(
    "comment_reactions",
    Base.metadata,
    Column("comment_id", ForeignKey("comments.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("emoji", String(8), nullable=False),
)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[ModerationStatus] = mapped_column(
        SqlEnum(ModerationStatus, native_enum=False), default=ModerationStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
