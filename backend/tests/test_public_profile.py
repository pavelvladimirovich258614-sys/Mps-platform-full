from datetime import UTC, datetime, timedelta

import httpx
import jwt
import pytest
from sqlalchemy import select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.profile import published_countries_query
from app.models.comment import Comment
from app.models.post import Country, Post, PostStatus, PostType, post_likes
from app.models.review import ModerationStatus
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


async def test_public_profile_likes_returns_only_published_posts(client, test_app):
    async with test_app.state.database.session_factory() as session:
        user = User(email="likes-user@example.test", name="Любитель фишек")
        author = User(email="likes-author@example.test", name="Автор")
        country = Country(name="Индонезия", flag_emoji="🇮🇩", sort_order=1)
        session.add_all([user, author, country])
        await session.flush()
        published = Post(
            type=PostType.ARTICLE,
            title="Понравившийся пост",
            slug="liked-post",
            body="Текст",
            author_id=author.id,
            country_id=country.id,
            status=PostStatus.PUBLISHED,
            published_at=datetime.now(UTC),
        )
        draft = Post(
            type=PostType.ARTICLE,
            title="Черновик",
            slug="liked-draft",
            body="Текст",
            author_id=author.id,
            country_id=country.id,
            status=PostStatus.DRAFT,
        )
        session.add_all([published, draft])
        await session.flush()
        await session.execute(post_likes.insert(), [
            {"post_id": published.id, "user_id": user.id},
            {"post_id": draft.id, "user_id": user.id},
        ])
        await session.commit()

    response = await client.get(f"/api/v1/users/{user.id}/likes")

    assert response.status_code == 200
    assert [post["slug"] for post in response.json()] == ["liked-post"]


async def test_public_profile_comments_respect_owner_visibility_and_include_post_context(client, test_app):
    now = datetime.now(UTC)
    async with test_app.state.database.session_factory() as session:
        profile = User(email="comments-profile@example.test", name="Автор ответов")
        viewer = User(email="comments-viewer@example.test", name="Посетитель")
        other_author = User(email="comments-other@example.test", name="Другой автор")
        country = Country(name="Комментарии", flag_emoji="💬")
        session.add_all([profile, viewer, other_author, country])
        await session.flush()
        post = Post(
            type=PostType.ARTICLE,
            title="Гид по Португалии",
            slug="portugal-guide",
            body="Текст публикации",
            author_id=other_author.id,
            country_id=country.id,
            status=PostStatus.PUBLISHED,
            published_at=now,
        )
        session.add(post)
        await session.flush()
        session.add_all([
            Comment(post_id=post.id, user_id=profile.id, body="Одобренный ответ", status=ModerationStatus.APPROVED, created_at=now - timedelta(minutes=3)),
            Comment(post_id=post.id, user_id=profile.id, body="Ответ на проверке", status=ModerationStatus.PENDING, created_at=now - timedelta(minutes=2)),
            Comment(post_id=post.id, user_id=profile.id, body="Отклонённый ответ", status=ModerationStatus.REJECTED, created_at=now - timedelta(minutes=1)),
            Comment(post_id=post.id, user_id=other_author.id, body="Чужой комментарий", status=ModerationStatus.APPROVED, created_at=now),
        ])
        await session.commit()

    owner = await client.get(f"/api/v1/users/{profile.id}/comments", headers=auth_headers(test_app, profile))
    visitor = await client.get(f"/api/v1/users/{profile.id}/comments", headers=auth_headers(test_app, viewer))
    guest = await client.get(f"/api/v1/users/{profile.id}/comments")

    assert owner.status_code == 200
    assert [(item["body"], item["status"]) for item in owner.json()] == [
        ("Отклонённый ответ", "rejected"),
        ("Ответ на проверке", "pending"),
        ("Одобренный ответ", "approved"),
    ]
    assert all(item["created_at"] for item in owner.json())
    assert all(item["post"] == {"slug": "portugal-guide", "title": "Гид по Португалии"} for item in owner.json())
    assert visitor.status_code == 200
    assert [(item["body"], item["status"]) for item in visitor.json()] == [("Одобренный ответ", "approved")]
    assert guest.status_code == 200
    assert [(item["body"], item["status"]) for item in guest.json()] == [("Одобренный ответ", "approved")]


async def test_public_profile_follow_lists_are_public_ordered_and_viewer_aware(client, test_app):
    now = datetime.now(UTC)
    async with test_app.state.database.session_factory() as session:
        profile = User(email="profile@example.test", name="Профиль")
        old_follower = User(email="old-follower@example.test", name="Ранний подписчик", avatar_url="/media/old.webp")
        new_follower = User(email="new-follower@example.test", name="Новый подписчик")
        older_author = User(email="older-author@example.test", name="Старый автор")
        newer_author = User(email="newer-author@example.test", name="Новый автор", avatar_url="/media/new.webp")
        viewer = User(email="viewer@example.test", name="Смотрящий")
        hidden = User(email="hidden-follow@example.test", name="Скрытый", is_anonymous=True)
        banned = User(email="banned-follow@example.test", name="Заблокированный", is_banned=True)
        session.add_all([profile, old_follower, new_follower, older_author, newer_author, viewer, hidden, banned])
        await session.flush()
        session.add_all([
            UserFollow(follower_id=old_follower.id, following_id=profile.id, created_at=now - timedelta(hours=2)),
            UserFollow(follower_id=new_follower.id, following_id=profile.id, created_at=now - timedelta(hours=1)),
            UserFollow(follower_id=hidden.id, following_id=profile.id, created_at=now),
            UserFollow(follower_id=profile.id, following_id=older_author.id, created_at=now - timedelta(hours=2)),
            UserFollow(follower_id=profile.id, following_id=newer_author.id, created_at=now - timedelta(hours=1)),
            UserFollow(follower_id=profile.id, following_id=banned.id, created_at=now),
            UserFollow(follower_id=viewer.id, following_id=old_follower.id, created_at=now),
            UserFollow(follower_id=viewer.id, following_id=newer_author.id, created_at=now),
        ])
        await session.commit()

    anonymous_followers = await client.get(f"/api/v1/users/{profile.id}/followers")
    viewer_followers = await client.get(
        f"/api/v1/users/{profile.id}/followers", headers=auth_headers(test_app, viewer)
    )
    viewer_following = await client.get(
        f"/api/v1/users/{profile.id}/following", headers=auth_headers(test_app, viewer)
    )

    assert anonymous_followers.status_code == 200
    assert anonymous_followers.json() == [
        {"id": new_follower.id, "name": "Новый подписчик", "avatar_url": None, "is_following": False},
        {"id": old_follower.id, "name": "Ранний подписчик", "avatar_url": "/media/old.webp", "is_following": False},
    ]
    assert viewer_followers.status_code == 200
    assert viewer_followers.json()[1]["is_following"] is True
    assert viewer_following.status_code == 200
    assert viewer_following.json() == [
        {"id": newer_author.id, "name": "Новый автор", "avatar_url": "/media/new.webp", "is_following": True},
        {"id": older_author.id, "name": "Старый автор", "avatar_url": None, "is_following": False},
    ]


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
