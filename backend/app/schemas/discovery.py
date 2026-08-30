from pydantic import BaseModel


class RecommendedAuthor(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    bio: str | None


class RecommendedAuthorsResponse(BaseModel):
    items: list[RecommendedAuthor]
    activity_window_days: int


class DiscoveryArticle(BaseModel):
    id: int
    title: str
    slug: str


class DiscoveryAuthor(BaseModel):
    id: int
    name: str
    avatar_url: str | None
    bio: str | None


class DiscoveryForumTopic(BaseModel):
    id: int
    title: str
    country_id: int


class DiscoverySearchResponse(BaseModel):
    articles: list[DiscoveryArticle]
    authors: list[DiscoveryAuthor]
    forum_topics: list[DiscoveryForumTopic]
