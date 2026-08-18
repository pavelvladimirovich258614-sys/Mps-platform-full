from datetime import UTC, datetime, timedelta

import jwt

from app.config import Settings


def create_token(user_id: int, token_type: str, expires_at: datetime, settings: Settings) -> str:
    if not settings.jwt_secret:
        raise RuntimeError("JWT_SECRET не настроен")
    return jwt.encode({"sub": str(user_id), "type": token_type, "exp": expires_at}, settings.jwt_secret, settings.jwt_algorithm)


def create_access_token(user_id: int, settings: Settings) -> str:
    return create_token(user_id, "access", datetime.now(UTC) + timedelta(minutes=settings.access_token_minutes), settings)


def create_refresh_token(user_id: int, settings: Settings) -> str:
    return create_token(user_id, "refresh", datetime.now(UTC) + timedelta(days=settings.refresh_token_days), settings)
