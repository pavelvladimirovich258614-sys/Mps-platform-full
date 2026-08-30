from datetime import UTC, datetime, timedelta

import httpx
import pytest
from sqlalchemy import event

from app.models.comment import Comment
from app.models.post import Post, PostStatus, PostType
from app.models.review import ModerationStatus
from app.models.user import User, UserFollow
from app.services.tokens import create_access_token


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as value:
        yield value


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
