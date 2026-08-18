from datetime import date, datetime
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Enum as SqlEnum, ForeignKey, Integer, String, Table, Text, Column, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base


class PostType(str, Enum): ARTICLE="article"; FISHKA="fishka"; VIDEO_REVIEW="video_review"
class PostStatus(str, Enum): DRAFT="draft"; PUBLISHED="published"

post_likes = Table("post_likes", Base.metadata, Column("post_id", ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True), Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True), Column("created_at", DateTime(timezone=True), server_default=func.now()))

class Country(Base):
    __tablename__="countries"
    id: Mapped[int]=mapped_column(Integer, primary_key=True)
    name: Mapped[str]=mapped_column(String(100), unique=True)
    flag_emoji: Mapped[str]=mapped_column(String(8))
    sort_order: Mapped[int]=mapped_column(Integer, default=0)
    is_active: Mapped[bool]=mapped_column(Boolean, default=True)

class Post(Base):
    __tablename__="posts"
    id: Mapped[int]=mapped_column(Integer, primary_key=True)
    type: Mapped[PostType]=mapped_column(SqlEnum(PostType, native_enum=False))
    title: Mapped[str]=mapped_column(String(255))
    slug: Mapped[str]=mapped_column(String(300), unique=True)
    cover_url: Mapped[str|None]=mapped_column(String(2048))
    body: Mapped[str]=mapped_column(Text)
    excerpt: Mapped[str]=mapped_column(Text, default="")
    author_id: Mapped[int]=mapped_column(ForeignKey("users.id"))
    status: Mapped[PostStatus]=mapped_column(SqlEnum(PostStatus, native_enum=False), default=PostStatus.DRAFT)
    published_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True))
    views: Mapped[int]=mapped_column(Integer, default=0)
    likes_count: Mapped[int]=mapped_column(Integer, default=0)
    cta_enabled: Mapped[bool]=mapped_column(Boolean, default=True)
    video_url: Mapped[str|None]=mapped_column(String(2048))
    hotel_name: Mapped[str|None]=mapped_column(String(255))
    country_id: Mapped[int|None]=mapped_column(ForeignKey("countries.id"))
    shot_at: Mapped[date|None]=mapped_column(Date)
    by_request: Mapped[bool]=mapped_column(Boolean, default=False)
