from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import TypeDecorator

from app.db import Base


class Role(str, Enum):
    READER = "reader"
    PREMIUM = "premium"
    EDITOR = "editor"
    ADMIN = "admin"


class RoleStorage(TypeDecorator[Role]):
    """Read legacy Enum names and canonical enum values from the VARCHAR role column."""

    impl = String(16)
    cache_ok = True

    def process_bind_param(self, value: Role | str | None, dialect) -> str | None:
        if value is None:
            return None
        return Role(value.lower()).value if isinstance(value, str) else value.value

    def process_result_value(self, value: str | None, dialect) -> Role | None:
        return Role(value.lower()) if value is not None else None


class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("tg_id IS NOT NULL OR email IS NOT NULL", name="users_identity_required"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tg_id: Mapped[int | None] = mapped_column(nullable=True, unique=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True, unique=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    name: Mapped[str] = mapped_column(String(255), default="", server_default="")
    avatar_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    role: Mapped[Role] = mapped_column(
        RoleStorage(),
        default=Role.READER,
        server_default=Role.READER.value,
    )
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
