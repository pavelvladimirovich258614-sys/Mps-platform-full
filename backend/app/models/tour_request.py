from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum as SqlEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class TourRequestStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    CLOSED = "closed"


class TourRequest(Base):
    __tablename__ = "tour_requests"
    __table_args__ = (
        CheckConstraint(
            "personal_data_consent = true",
            name="tour_requests_personal_data_consent_required",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    contact: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    budget: Mapped[str | None] = mapped_column(String(100), nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[TourRequestStatus] = mapped_column(
        SqlEnum(TourRequestStatus, native_enum=False),
        default=TourRequestStatus.NEW,
        nullable=False,
    )
    tg_message_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    personal_data_consent: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
