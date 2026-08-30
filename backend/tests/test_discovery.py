import os
from datetime import UTC, datetime, timedelta

import fakeredis.aioredis
import httpx
import pytest
import pytest_asyncio
from sqlalchemy import event

from app.config import Settings
from app.db import Base
from app.main import create_app
from app.models.comment import Comment
from app.models.forum import ForumTopic
from app.models.post import Country, Post, PostStatus, PostType
from app.models.review import ModerationStatus
from app.models.user import User, UserFollow
from app.rate_limit import limiter
from app.services.tokens import create_access_token


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as value:
        yield value


@pytest_asyncio.fixture
async def postgresql_discovery_client(tmp_path):
    database_url = os.getenv("MPS_TEST_POSTGRES_URL")
    if not database_url:
        pytest.skip("MPS_TEST_POSTGRES_URL is required for discovery search verification")

    limiter.reset()
    settings = Settings(
        database_url=database_url,
        jwt_secret="test-secret-key-with-32-characters",
        auth_bot_token="test-auth-bot-token",
        relay_bot_token="test-relay-bot-token",
        bot_bridge_secret="bridge-secret",
        unisender_go_api_key="key",
        unisender_from_email="noreply@example.com",
        minimax_api_key="test-minimax-key",
        minimax_model="test-model",
        media_dir=str(tmp_path / "media"),
    )
    app = create_app(settings)
    app.state.redis = fakeredis.aioredis.FakeRedis(decode_responses=False)
    engine = app.state.database.engine
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    try:
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as value:
            yield value, app
    finally:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
        await app.state.database.dispose()
        await app.state.redis.aclose()


def headers(test_app, user: User) -> dict[str, str]:
    token = create_access_token(user.id, test_app.state.settings)
    return {"Authorization": f"Bearer {token}"}


def published_post(author_id: int, slug: str) -> Post:
    return Post(
        type=PostType.ARTICLE,
        title=slug,
        slug=slug,
        body="Публичный текст",
        author_id=author_id,
        status=PostStatus.PUBLISHED,
        published_at=datetime.now(UTC),
    )


async def test_recommended_authors_exclude_ineligible_and_accept_public_contributors(client, test_app):
    now = datetime.now(UTC)
    async with test_app.state.database.session_factory() as session:
        viewer = User(email="viewer@example.test", name="Зритель", last_seen_at=now)
        post_author = User(email="post-author@example.test", name="Автор поста", last_seen_at=now)
        comment_author = User(email="comment-author@example.test", name="Автор комментария", last_seen_at=now)
        followed = User(email="followed@example.test", name="Уже читаю", last_seen_at=now)
        inactive = User(email="inactive@example.test", name="Неактивный", last_seen_at=now - timedelta(days=31))
        anonymous = User(email="anonymous@example.test", name="Анонимный", last_seen_at=now, is_anonymous=True)
        banned = User(email="banned@example.test", name="Заблокированный", last_seen_at=now, is_banned=True)
        contentless = User(email="contentless@example.test", name="Без публикаций", last_seen_at=now)
        pending_only = User(email="pending@example.test", name="Только pending", last_seen_at=now)
        session.add_all([
            viewer,
            post_author,
            comment_author,
            followed,
            inactive,
            anonymous,
            banned,
            contentless,
            pending_only,
        ])
        await session.flush()

        anchor = published_post(viewer.id, "anchor")
        session.add_all([
            anchor,
            published_post(post_author.id, "eligible-post"),
            published_post(followed.id, "followed-post"),
            published_post(inactive.id, "inactive-post"),
            published_post(anonymous.id, "anonymous-post"),
        ])
        await session.flush()
        session.add_all([
            Comment(post_id=anchor.id, user_id=comment_author.id, body="Одобрено", status=ModerationStatus.APPROVED),
            Comment(post_id=anchor.id, user_id=banned.id, body="Скрыто", status=ModerationStatus.APPROVED),
            Comment(post_id=anchor.id, user_id=pending_only.id, body="Ожидает", status=ModerationStatus.PENDING),
            UserFollow(follower_id=viewer.id, following_id=followed.id),
        ])
        await session.commit()

    response = await client.get(
        "/api/v1/discovery/recommended-authors",
        headers=headers(test_app, viewer),
    )

    assert response.status_code == 200
    assert response.json()["activity_window_days"] == 30
    assert {item["id"] for item in response.json()["items"]} == {post_author.id, comment_author.id}


async def test_recommended_authors_limit_uses_no_database_random_sort(client, test_app):
    now = datetime.now(UTC)
    async with test_app.state.database.session_factory() as session:
        viewer = User(email="limit-viewer@example.test", name="Зритель", last_seen_at=now)
        candidates = [
            User(email=f"candidate-{index}@example.test", name=f"Кандидат {index}", last_seen_at=now)
            for index in range(5)
        ]
        session.add_all([viewer, *candidates])
        await session.flush()
        session.add_all([
            published_post(candidate.id, f"candidate-post-{candidate.id}")
            for candidate in candidates
        ])
        await session.commit()

    statements: list[str] = []

    def record_statement(_, __, statement, ___, ____, _____):
        statements.append(statement)

    engine = test_app.state.database.engine.sync_engine
    event.listen(engine, "before_cursor_execute", record_statement)
    try:
        response = await client.get(
            "/api/v1/discovery/recommended-authors?limit=3",
            headers=headers(test_app, viewer),
        )
    finally:
        event.remove(engine, "before_cursor_execute", record_statement)

    assert response.status_code == 200
    assert len(response.json()["items"]) == 3
    assert {item["id"] for item in response.json()["items"]} <= {candidate.id for candidate in candidates}
    assert all("RANDOM(" not in statement.upper() for statement in statements)


async def test_discovery_search_finds_each_entity_and_country(postgresql_discovery_client):
    client, app = postgresql_discovery_client
    async with app.state.database.session_factory() as session:
        author = User(email="search-author@example.test", name="Сергей Путешественник")
        session.add(author)
        await session.flush()
        country = Country(name="Марокко", flag_emoji="MA", sort_order=1)
        session.add(country)
        await session.flush()
        article = Post(
            type=PostType.ARTICLE,
            title="Байкальский маршрут",
            slug="baikal-search-route",
            body="Подробный путь вдоль озера",
            author_id=author.id,
            status=PostStatus.PUBLISHED,
            published_at=datetime.now(UTC),
        )
        topic = ForumTopic(
            country_id=country.id,
            author_id=author.id,
            title="Марокко: симкарта для поездки",
        )
        session.add_all([article, topic])
        await session.commit()
        await session.refresh(article)
        await session.refresh(topic)

    article_response = await client.get("/api/v1/discovery/search", params={"q": "байкальский"})
    author_response = await client.get("/api/v1/discovery/search", params={"q": "сергей"})
    topic_response = await client.get("/api/v1/discovery/search", params={"q": "симкарта"})

    assert article_response.status_code == 200
    assert article_response.json() == {
        "articles": [{"id": article.id, "title": article.title, "slug": article.slug}],
        "authors": [],
        "forum_topics": [],
    }
    assert author_response.status_code == 200
    assert author_response.json()["authors"] == [{
        "id": author.id,
        "name": author.name,
        "avatar_url": None,
        "bio": None,
    }]
    assert topic_response.status_code == 200
    assert topic_response.json()["forum_topics"] == [{
        "id": topic.id,
        "title": topic.title,
        "country_id": country.id,
    }]


async def test_discovery_search_excludes_drafts_other_post_types_and_closed_profiles(
    postgresql_discovery_client,
):
    client, app = postgresql_discovery_client
    async with app.state.database.session_factory() as session:
        visible = User(email="visible@example.test", name="Открытый профиль")
        anonymous = User(
            email="anonymous-search@example.test",
            name="Скрытый профиль",
            is_anonymous=True,
        )
        banned = User(
            email="banned-search@example.test",
            name="Заблокированный профиль",
            is_banned=True,
        )
        session.add_all([visible, anonymous, banned])
        await session.flush()
        session.add_all([
            Post(
                type=PostType.ARTICLE,
                title="Черновой материал",
                slug="draft-search-material",
                body="Черновой текст",
                author_id=visible.id,
                status=PostStatus.DRAFT,
            ),
            Post(
                type=PostType.FISHKA,
                title="Фишечный материал",
                slug="fishka-search-material",
                body="Фишечный текст",
                author_id=visible.id,
                status=PostStatus.PUBLISHED,
                published_at=datetime.now(UTC),
            ),
        ])
        await session.commit()

    for query in ("черновой", "фишечный"):
        response = await client.get("/api/v1/discovery/search", params={"q": query})
        assert response.status_code == 200
        assert response.json()["articles"] == []
    for query in ("скрытый", "заблокированный"):
        response = await client.get("/api/v1/discovery/search", params={"q": query})
        assert response.status_code == 200
        assert response.json()["authors"] == []


async def test_existing_forum_search_still_uses_ilike(postgresql_discovery_client):
    client, app = postgresql_discovery_client
    async with app.state.database.session_factory() as session:
        author = User(email="forum-regression@example.test", name="Автор форума")
        session.add(author)
        await session.flush()
        country = Country(name="Таиланд", flag_emoji="TH", sort_order=1)
        session.add(country)
        await session.flush()
        topic = ForumTopic(
            country_id=country.id,
            author_id=author.id,
            title="СИМка в поездке",
        )
        session.add(topic)
        await session.commit()
        await session.refresh(topic)

    statements: list[str] = []

    def record_statement(_, __, statement, ___, ____, _____):
        statements.append(statement)

    engine = app.state.database.engine.sync_engine
    event.listen(engine, "before_cursor_execute", record_statement)
    try:
        response = await client.get(
            f"/api/v1/countries/{country.id}/topics",
            params={"search": "симка"},
        )
    finally:
        event.remove(engine, "before_cursor_execute", record_statement)

    assert response.status_code == 200
    assert [item["id"] for item in response.json()["items"]] == [topic.id]
    assert any(" ILIKE " in statement.upper() for statement in statements)
