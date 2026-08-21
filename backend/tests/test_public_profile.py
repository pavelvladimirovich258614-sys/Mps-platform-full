from datetime import UTC, datetime

import httpx
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import Country, Post, PostStatus, PostType
from app.models.user import Role, User


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as value:
        yield value


async def create_post(
    session: AsyncSession,
    *,
    author_id: int,
    country_id: int,
    slug: str,
    status: PostStatus = PostStatus.PUBLISHED,
) -> None:
    session.add(
        Post(
            type=PostType.ARTICLE,
            title=slug,
            slug=slug,
            body="Текст публикации",
            author_id=author_id,
            country_id=country_id,
            status=status,
            published_at=datetime.now(UTC) if status == PostStatus.PUBLISHED else None,
        )
    )


async def test_public_profile_exposes_only_public_author_data_and_published_posts(client, test_app):
    async with test_app.state.database.session_factory() as session:
        author = User(
            email="author@example.test",
            name="Мария",
            avatar_url="/media/maria.webp",
            bio="Пишу о путешествиях.",
            role=Role.EDITOR,
            tg_id=42,
        )
        other = User(email="other@example.test", name="Другой автор")
        uae = Country(name="ОАЭ", flag_emoji="🇦🇪", sort_order=1)
        turkey = Country(name="Турция", flag_emoji="🇹🇷", sort_order=2)
        session.add_all([author, other, uae, turkey])
        await session.flush()
        await create_post(session, author_id=author.id, country_id=uae.id, slug="uae-guide")
        await create_post(session, author_id=author.id, country_id=uae.id, slug="uae-tips")
        await create_post(session, author_id=author.id, country_id=turkey.id, slug="draft-turkey", status=PostStatus.DRAFT)
        await create_post(session, author_id=other.id, country_id=turkey.id, slug="other-post")
        await session.commit()

    profile = await client.get(f"/api/v1/users/{author.id}/profile")

    assert profile.status_code == 200
    assert profile.json() == {
        "id": author.id,
        "name": "Мария",
        "avatar_url": "/media/maria.webp",
        "bio": "Пишу о путешествиях.",
        "posts_count": 2,
        "countries": [{"id": uae.id, "name": "ОАЭ", "flag_emoji": "🇦🇪"}],
    }
    assert {"email", "tg_id", "role", "is_anonymous"}.isdisjoint(profile.json())

    posts = await client.get(f"/api/v1/posts?author_id={author.id}")

    assert posts.status_code == 200
    assert [post["slug"] for post in posts.json()] == ["uae-guide", "uae-tips"]


async def test_public_profile_hides_anonymous_and_banned_users(client, test_app):
    async with test_app.state.database.session_factory() as session:
        anonymous = User(email="anonymous@example.test", name="Скрытый", is_anonymous=True)
        banned = User(email="banned@example.test", name="Заблокированный", is_banned=True)
        session.add_all([anonymous, banned])
        await session.commit()

    assert (await client.get(f"/api/v1/users/{anonymous.id}/profile")).status_code == 404
    assert (await client.get(f"/api/v1/users/{banned.id}/profile")).status_code == 404
