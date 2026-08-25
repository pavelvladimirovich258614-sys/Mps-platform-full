from datetime import UTC, datetime, timedelta

import httpx
import jwt
import pytest

from app.models.activity import ActivityEventType, ActivityLog
from app.models.comment import Comment
from app.models.post import Post, PostStatus, PostType
from app.models.review import ModerationStatus
from app.models.user import User


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as value:
        yield value


def auth_headers(test_app, user: User) -> dict[str, str]:
    token = jwt.encode(
        {"sub": str(user.id), "type": "access"},
        test_app.state.settings.jwt_secret,
        algorithm=test_app.state.settings.jwt_algorithm,
    )
    return {"Authorization": f"Bearer {token}"}


async def test_activity_feed_resolves_context_and_hides_nonapproved_comments(client, test_app):
    now = datetime(2026, 8, 25, 12, tzinfo=UTC)
    async with test_app.state.database.session_factory() as session:
        owner = User(email="activity-owner@example.test", name="Мария")
        visitor = User(email="activity-visitor@example.test", name="Гость")
        followed = User(email="activity-followed@example.test", name="Анна", avatar_url="/media/anna.webp")
        session.add_all([owner, visitor, followed])
        await session.flush()
        post = Post(
            type=PostType.ARTICLE,
            title="Гид по Бали",
            slug="bali-guide",
            body="Текст",
            author_id=owner.id,
            status=PostStatus.PUBLISHED,
            published_at=now - timedelta(minutes=6),
        )
        session.add(post)
        await session.flush()
        approved = Comment(post_id=post.id, user_id=owner.id, body="Одобренный ответ", status=ModerationStatus.APPROVED, created_at=now - timedelta(minutes=3))
        pending = Comment(post_id=post.id, user_id=owner.id, body="Ответ на проверке", status=ModerationStatus.PENDING, created_at=now - timedelta(minutes=4))
        rejected = Comment(post_id=post.id, user_id=owner.id, body="Отклонённый ответ", status=ModerationStatus.REJECTED, created_at=now - timedelta(minutes=5))
        session.add_all([approved, pending, rejected])
        await session.flush()
        session.add_all([
            ActivityLog(user_id=owner.id, event_type=ActivityEventType.USER_FOLLOWED, reference_id=followed.id, created_at=now),
            ActivityLog(user_id=owner.id, event_type=ActivityEventType.POST_LIKED, reference_id=post.id, created_at=now - timedelta(minutes=1)),
            ActivityLog(user_id=owner.id, event_type=ActivityEventType.COMMENT_CREATED, reference_id=approved.id, created_at=approved.created_at),
            ActivityLog(user_id=owner.id, event_type=ActivityEventType.COMMENT_CREATED, reference_id=pending.id, created_at=pending.created_at),
            ActivityLog(user_id=owner.id, event_type=ActivityEventType.COMMENT_CREATED, reference_id=rejected.id, created_at=rejected.created_at),
            ActivityLog(user_id=owner.id, event_type=ActivityEventType.POST_PUBLISHED, reference_id=post.id, created_at=post.published_at),
        ])
        await session.commit()

    owner_response = await client.get(f"/api/v1/users/{owner.id}/activity", headers=auth_headers(test_app, owner))
    visitor_response = await client.get(f"/api/v1/users/{owner.id}/activity", headers=auth_headers(test_app, visitor))

    assert owner_response.status_code == 200
    owner_items = owner_response.json()["items"]
    assert [item["event_type"] for item in owner_items] == [
        "user_followed", "post_liked", "comment_created", "comment_created", "comment_created", "post_published",
    ]
    assert owner_items[0]["user"] == {"id": followed.id, "name": "Анна", "avatar_url": "/media/anna.webp"}
    assert owner_items[1]["post"] == {"id": post.id, "title": "Гид по Бали", "slug": "bali-guide"}
    assert owner_items[2]["comment"]["status"] == "approved"
    assert owner_items[3]["comment"]["status"] == "pending"
    assert owner_items[4]["comment"]["status"] == "rejected"
    assert owner_items[2]["comment"]["post"] == {"title": "Гид по Бали", "slug": "bali-guide"}

    assert visitor_response.status_code == 200
    visitor_items = visitor_response.json()["items"]
    assert [item["event_type"] for item in visitor_items] == [
        "user_followed", "post_liked", "comment_created", "post_published",
    ]
    assert visitor_items[2]["comment"]["status"] == "approved"


async def test_activity_feed_uses_keyset_pagination_without_duplicates(client, test_app):
    now = datetime(2026, 8, 25, 12, tzinfo=UTC)
    async with test_app.state.database.session_factory() as session:
        owner = User(email="activity-page-owner@example.test", name="Мария")
        session.add(owner)
        await session.flush()
        posts = [
            Post(type=PostType.ARTICLE, title=f"Пост {number}", slug=f"post-{number}", body="Текст", author_id=owner.id, status=PostStatus.PUBLISHED, published_at=now - timedelta(minutes=number))
            for number in range(1, 4)
        ]
        session.add_all(posts)
        await session.flush()
        session.add_all([
            ActivityLog(user_id=owner.id, event_type=ActivityEventType.POST_PUBLISHED, reference_id=post.id, created_at=post.published_at)
            for post in posts
        ])
        await session.commit()

    first = await client.get(f"/api/v1/users/{owner.id}/activity?limit=2")

    assert first.status_code == 200
    first_body = first.json()
    assert [item["post"]["slug"] for item in first_body["items"]] == ["post-1", "post-2"]
    assert first_body["next_cursor"]

    second = await client.get(f"/api/v1/users/{owner.id}/activity?limit=2&cursor={first_body['next_cursor']}")

    assert second.status_code == 200
    assert [item["post"]["slug"] for item in second.json()["items"]] == ["post-3"]
    assert second.json()["next_cursor"] is None
