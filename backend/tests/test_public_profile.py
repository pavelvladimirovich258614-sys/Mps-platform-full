from datetime import UTC, datetime

import httpx
import jwt
import pytest
from sqlalchemy import select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.profile import published_countries_query
from app.models.post import Country, Post, PostStatus, PostType
from app.models.user import Role, User, UserFollow


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


def auth_headers(test_app, user: User) -> dict[str, str]:
    token = jwt.encode(
        {"sub": str(user.id), "type": "access"},
        test_app.state.settings.jwt_secret,
        algorithm=test_app.state.settings.jwt_algorithm,
    )
    return {"Authorization": f"Bearer {token}"}


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
        "followers_count": 0,
        "following_count": 0,
        "is_following": False,
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


async def test_follow_unfollow_updates_real_profile_counters_and_viewer_state(client, test_app):
    async with test_app.state.database.session_factory() as session:
        follower = User(email="follower@example.test", name="Подписчик")
        target = User(email="target@example.test", name="Автор")
        third_user = User(email="third@example.test", name="Третий")
        session.add_all([follower, target, third_user])
        await session.commit()
        await session.refresh(follower)
        await session.refresh(target)
        await session.refresh(third_user)

    follower_headers = auth_headers(test_app, follower)
    third_headers = auth_headers(test_app, third_user)

    assert (await client.post(f"/api/v1/users/{target.id}/follow")).status_code == 401

    followed = await client.post(f"/api/v1/users/{target.id}/follow", headers=follower_headers)
    assert followed.status_code == 201
    assert followed.json() == {"followers_count": 1, "is_following": True}

    profile_for_follower = await client.get(f"/api/v1/users/{target.id}/profile", headers=follower_headers)
    assert profile_for_follower.status_code == 200
    assert profile_for_follower.json()["followers_count"] == 1
    assert profile_for_follower.json()["following_count"] == 0
    assert profile_for_follower.json()["is_following"] is True

    profile_for_third_user = await client.get(f"/api/v1/users/{target.id}/profile", headers=third_headers)
    assert profile_for_third_user.status_code == 200
    assert profile_for_third_user.json()["is_following"] is False

    unfollowed = await client.delete(f"/api/v1/users/{target.id}/follow", headers=follower_headers)
    assert unfollowed.status_code == 200
    assert unfollowed.json() == {"followers_count": 0, "is_following": False}


async def test_follow_rejects_self_duplicate_and_hidden_or_banned_profiles(client, test_app):
    async with test_app.state.database.session_factory() as session:
        follower = User(email="follow-rules@example.test", name="Подписчик")
        target = User(email="follow-target@example.test", name="Автор")
        anonymous = User(email="follow-hidden@example.test", name="Скрытый", is_anonymous=True)
        banned = User(email="follow-banned@example.test", name="Заблокированный", is_banned=True)
        session.add_all([follower, target, anonymous, banned])
        await session.commit()
        for user in (follower, target, anonymous, banned):
            await session.refresh(user)

    headers = auth_headers(test_app, follower)
    self_follow = await client.post(f"/api/v1/users/{follower.id}/follow", headers=headers)
    assert self_follow.status_code == 422
    assert self_follow.json()["detail"] == "Нельзя подписаться на собственный профиль"

    assert (await client.post(f"/api/v1/users/{target.id}/follow", headers=headers)).status_code == 201
    duplicate = await client.post(f"/api/v1/users/{target.id}/follow", headers=headers)
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == "Вы уже подписаны на этого пользователя"

    assert (await client.post(f"/api/v1/users/{anonymous.id}/follow", headers=headers)).status_code == 404
    assert (await client.post(f"/api/v1/users/{banned.id}/follow", headers=headers)).status_code == 404


def test_public_profile_countries_distinct_query_is_postgresql_compatible():
    """PostgreSQL requires every DISTINCT ORDER BY expression in the select-list."""
    sql = str(published_countries_query(7).compile(dialect=postgresql.dialect()))
    select_clause = sql.split("FROM", maxsplit=1)[0]

    assert "countries.sort_order" in select_clause
    assert "ORDER BY countries.sort_order, countries.id" in sql


def test_user_follows_ddl_is_postgresql_compatible():
    sql = str(CreateTable(UserFollow.__table__).compile(dialect=postgresql.dialect()))

    assert "PRIMARY KEY (follower_id, following_id)" in sql
    assert "CHECK (follower_id <> following_id)" in sql
    assert "FOREIGN KEY(follower_id) REFERENCES users (id) ON DELETE CASCADE" in sql
    assert "FOREIGN KEY(following_id) REFERENCES users (id) ON DELETE CASCADE" in sql


async def test_post_status_uses_one_consistent_database_name_convention(test_app):
    """Guard the existing SQLAlchemy Enum-name convention: PUBLISHED, not published."""
    async with test_app.state.database.session_factory() as session:
        author = User(email="post-status@example.test", name="Автор")
        country = Country(name="Статусия", flag_emoji="🏝️")
        session.add_all([author, country])
        await session.flush()
        post = Post(
            type=PostType.ARTICLE,
            title="Проверка статуса",
            slug="post-status-convention",
            body="Текст",
            author_id=author.id,
            country_id=country.id,
            status=PostStatus.PUBLISHED,
            published_at=datetime.now(UTC),
        )
        session.add(post)
        await session.flush()

        stored_status = await session.scalar(text("SELECT status FROM posts WHERE id = :id"), {"id": post.id})
        loaded = await session.scalar(select(Post).where(Post.status == PostStatus.PUBLISHED))

    assert stored_status == "PUBLISHED"
    assert loaded is not None
    assert loaded.status is PostStatus.PUBLISHED
