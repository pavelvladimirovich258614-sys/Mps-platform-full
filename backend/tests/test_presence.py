from datetime import UTC, datetime, timedelta

import httpx
import pytest
from sqlalchemy import select

from app.models.notification import Notification
from app.models.user import User
from app.services.tokens import create_access_token


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as value:
        yield value


async def make_user(test_app, email: str, **values) -> User:
    async with test_app.state.database.session_factory() as session:
        user = User(email=email, name=email.split("@")[0], **values)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


def headers(test_app, user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, test_app.state.settings)}"}


async def test_online_excludes_anonymous_and_stale_users(client, test_app):
    now = datetime.now(UTC)
    viewer = await make_user(test_app, "viewer@example.com", last_seen_at=now)
    visible = await make_user(test_app, "visible@example.com", avatar_url="https://example.com/a.jpg", last_seen_at=now - timedelta(seconds=119))
    await make_user(test_app, "anonymous@example.com", is_anonymous=True, last_seen_at=now)
    await make_user(test_app, "stale@example.com", last_seen_at=now - timedelta(seconds=121))
    response = await client.get("/api/v1/online", headers=headers(test_app, viewer))
    assert response.status_code == 200
    online = response.json()
    assert {person["id"] for person in online} == {viewer.id, visible.id}
    assert next(person for person in online if person["id"] == visible.id) == {"id": visible.id, "name": "visible", "avatar_url": "https://example.com/a.jpg"}


async def test_notifications_mark_specific_ids_without_touching_foreign_and_mark_all(client, test_app):
    owner = await make_user(test_app, "owner@example.com")
    other = await make_user(test_app, "other@example.com")
    async with test_app.state.database.session_factory() as session:
        own_one = Notification(user_id=owner.id, type="qa_answered", payload={})
        own_two = Notification(user_id=owner.id, type="comment_approved", payload={})
        foreign = Notification(user_id=other.id, type="review_approved", payload={})
        session.add_all([own_one, own_two, foreign])
        await session.commit()
        await session.refresh(own_one)
        await session.refresh(own_two)
        await session.refresh(foreign)

    first_page = await client.get("/api/v1/notifications?page=1&page_size=1", headers=headers(test_app, owner))
    assert first_page.status_code == 200
    assert first_page.json()["total"] == 2
    specific = await client.patch("/api/v1/notifications/read", headers=headers(test_app, owner), json={"ids": [own_one.id, foreign.id]})
    assert specific.status_code == 200
    assert specific.json()["updated"] == 1
    async with test_app.state.database.session_factory() as session:
        assert await session.scalar(select(Notification.is_read).where(Notification.id == own_one.id)) is True
        assert await session.scalar(select(Notification.is_read).where(Notification.id == own_two.id)) is False
        assert await session.scalar(select(Notification.is_read).where(Notification.id == foreign.id)) is False
    all_read = await client.patch("/api/v1/notifications/read", headers=headers(test_app, owner), json={})
    assert all_read.status_code == 200
    assert all_read.json()["updated"] == 1
    async with test_app.state.database.session_factory() as session:
        assert await session.scalar(select(Notification.is_read).where(Notification.id == own_two.id)) is True
        assert await session.scalar(select(Notification.is_read).where(Notification.id == foreign.id)) is False
