from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Index, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class ActivityEventType(str, Enum):
    POST_PUBLISHED = "post_published"
    COMMENT_CREATED = "comment_created"
    POST_LIKED = "post_liked"
    USER_FOLLOWED = "user_followed"


class ActivityLog(Base):
    __tablename__ = "activity_log"
    __table_args__ = (
        UniqueConstraint("user_id", "event_type", "reference_id", name="uq_activity_log_user_event_reference"),
        Index("ix_activity_log_user_created_at_id", "user_id", "created_at", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[ActivityEventType] = mapped_column(
        SqlEnum(
            ActivityEventType,
            native_enum=False,
            values_callable=lambda values: [value.value for value in values],
            create_constraint=True,
        ),
        nullable=False,
    )
    reference_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
