from pydantic import BaseModel


class RecommendedAuthor(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    bio: str | None


class RecommendedAuthorsResponse(BaseModel):
    items: list[RecommendedAuthor]
    activity_window_days: int
