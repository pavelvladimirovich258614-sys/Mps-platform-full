from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ModerationAction(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"


class ModerateRequest(BaseModel):
    action: ModerationAction


class ReviewCreate(BaseModel):
    author_name: str = Field(min_length=1, max_length=255)
    rating: int = Field(ge=1, le=5)
    body: str = Field(min_length=1, max_length=1000)
    photo_url: str | None = None
    photo_urls: list[str] = Field(default_factory=list, max_length=2)


class TokenReviewCreate(ReviewCreate):
    token: str = Field(min_length=1, max_length=128)


class ReviewTokenCreate(BaseModel):
    tg_id: int


class CommentCreate(BaseModel):
    body: str = Field(min_length=1)
    parent_id: int | None = None


class ReactionCreate(BaseModel):
    emoji: str = Field(min_length=1, max_length=8)
