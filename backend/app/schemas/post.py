from datetime import date
from pydantic import BaseModel, Field, model_validator
from app.models.post import PostStatus, PostType

class PostWrite(BaseModel):
    type: PostType; title: str = Field(min_length=1,max_length=255); body: str; excerpt: str=""; status: PostStatus=PostStatus.DRAFT; emoji: str|None=Field(default=None, min_length=1, max_length=32); cover_url: str|None=None; cta_enabled: bool=True; video_url: str|None=None; hotel_name: str|None=None; country_id: int|None=None; shot_at: date|None=None; by_request: bool=False
    @model_validator(mode="after")
    def video_has_shot_at(self):
        if self.type == PostType.VIDEO_REVIEW and self.shot_at is None: raise ValueError("Для видеообзора обязательна дата съёмки")
        if self.type == PostType.FISHKA and not self.emoji: raise ValueError("Для фишки обязателен эмодзи")
        return self
class PostPatch(PostWrite):
    type: PostType | None = None
    title: str | None = Field(default=None, min_length=1, max_length=255)
    body: str | None = None
    excerpt: str | None = None
    status: PostStatus | None = None
    cover_url: str | None = None
    cta_enabled: bool | None = None
    video_url: str | None = None
    hotel_name: str | None = None
    country_id: int | None = None
    shot_at: date | None = None
    by_request: bool | None = None
