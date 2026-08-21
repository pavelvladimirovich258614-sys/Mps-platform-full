from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.user import Role


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tg_id: int | None
    email: str | None
    email_verified: bool
    name: str
    avatar_url: str | None
    bio: str | None
    role: Role
    is_anonymous: bool
    last_seen_at: datetime | None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    bio: str | None = Field(default=None, max_length=5000)
    avatar_url: str | None = Field(default=None, max_length=2048)
    is_anonymous: bool | None = None


class PublicProfileCountry(BaseModel):
    id: int
    name: str
    flag_emoji: str


class PublicProfileResponse(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    bio: str | None
    posts_count: int
    countries: list[PublicProfileCountry]
