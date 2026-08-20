import hashlib
import hmac
import time

import httpx
import pytest
from sqlalchemy import select

from app.models.notification import Notification
from app.models.user import Role, User


def telegram_payload(user_id: int) -> dict[str, int | str]:
    payload: dict[str, int | str] = {"id": user_id, "first_name": "Пользователь", "auth_date": int(time.time())}
    check = "\n".join(f"{key}={payload[key]}" for key in sorted(payload))
    payload["hash"] = hmac.new(
        hashlib.sha256(b"test-bot-token").digest(), check.encode(), hashlib.sha256
    ).hexdigest()
    return payload


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as async_client:
        yield async_client


async def headers_for(client, test_app, user_id: int, editor: bool = False) -> dict[str, str]:
    response = await client.post("/api/v1/auth/telegram", json=telegram_payload(user_id))
    access_token = response.json()["access_token"]
    if editor:
        async with test_app.state.database.session_factory() as session:
            user = await session.scalar(select(User).where(User.tg_id == user_id))
            user.role = Role.EDITOR
            await session.commit()
    return {"Authorization": f"Bearer {access_token}"}


async def published_post(client, headers) -> int:
    response = await client.post(
        "/api/v1/posts",
        headers=headers,
        json={"type": "article", "title": "Пост для комментариев", "body": "Текст", "status": "published"},
    )
    assert response.status_code == 201
    return response.json()["id"]


async def test_comments_moderation_replies_and_reactions(client, test_app):
    reader_headers = await headers_for(client, test_app, 301)
    other_reader_headers = await headers_for(client, test_app, 303)
    editor_headers = await headers_for(client, test_app, 302, editor=True)
    post_id = await published_post(client, editor_headers)
    root = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        headers=reader_headers,
        json={"body": "Первый комментарий"},
    )
    assert root.status_code == 201
    root_id = root.json()["id"]
    assert (await client.get(f"/api/v1/posts/{post_id}/comments")).json() == []
    approved = await client.patch(
        f"/api/v1/comments/{root_id}/moderate",
        headers=editor_headers,
        json={"action": "approve"},
    )
    assert approved.status_code == 200
    assert approved.json()["pending_count"] == 0
    listed = await client.get(f"/api/v1/posts/{post_id}/comments", headers=reader_headers)
    assert [comment["id"] for comment in listed.json()] == [root_id]
    comment = listed.json()[0]
    assert comment["author"] == {"id": 1, "name": "Пользователь", "avatar_url": None}
    assert comment["reactions"] == {"👍": 0, "❤️": 0, "🔥": 0, "😂": 0}
    assert comment["my_reaction"] is None
    reply = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        headers=reader_headers,
        json={"body": "Ответ", "parent_id": root_id},
    )
    assert reply.status_code == 201
    nested = await client.post(
        f"/api/v1/posts/{post_id}/comments",
        headers=reader_headers,
        json={"body": "Второй уровень", "parent_id": reply.json()["id"]},
    )
    assert nested.status_code == 422
    first_reaction = await client.post(f"/api/v1/comments/{root_id}/react", headers=reader_headers, json={"emoji": "👍"})
    assert first_reaction.status_code == 200
    assert first_reaction.json()["my_reaction"] == "👍"
    assert first_reaction.json()["reactions"]["👍"] == 1
    removed = await client.post(f"/api/v1/comments/{root_id}/react", headers=reader_headers, json={"emoji": "👍"})
    assert removed.status_code == 200
    assert removed.json()["my_reaction"] is None
    assert removed.json()["reactions"]["👍"] == 0
    replacement = await client.post(f"/api/v1/comments/{root_id}/react", headers=reader_headers, json={"emoji": "❤️"})
    assert replacement.status_code == 200
    assert replacement.json()["my_reaction"] == "❤️"
    second_user = await client.post(f"/api/v1/comments/{root_id}/react", headers=other_reader_headers, json={"emoji": "❤️"})
    assert second_user.status_code == 200
    assert second_user.json()["reactions"]["❤️"] == 2
    changed = await client.post(f"/api/v1/comments/{root_id}/react", headers=reader_headers, json={"emoji": "🔥"})
    assert changed.status_code == 200
    assert changed.json()["my_reaction"] == "🔥"
    assert changed.json()["reactions"] == {"👍": 0, "❤️": 1, "🔥": 1, "😂": 0}
    other_view = await client.get(f"/api/v1/posts/{post_id}/comments", headers=other_reader_headers)
    assert other_view.json()[0]["my_reaction"] == "❤️"
    async with test_app.state.database.session_factory() as session:
        notifications = (await session.scalars(select(Notification))).all()
        assert len(notifications) == 1
        assert notifications[0].type == "comment_approved"


async def test_comment_moderation_requires_editor(client, test_app):
    reader_headers = await headers_for(client, test_app, 401)
    editor_headers = await headers_for(client, test_app, 402, editor=True)
    post_id = await published_post(client, editor_headers)
    comment = await client.post(
        f"/api/v1/posts/{post_id}/comments", headers=reader_headers, json={"body": "На проверку"}
    )
    assert (await client.patch(
        f"/api/v1/comments/{comment.json()['id']}/moderate",
        headers=reader_headers,
        json={"action": "reject"},
    )).status_code == 403
    assert (await client.patch(
        f"/api/v1/comments/{comment.json()['id']}/moderate",
        headers=editor_headers,
        json={"action": "reject"},
    )).status_code == 200
    assert (await client.get(f"/api/v1/posts/{post_id}/comments")).json() == []


async def test_comment_moderation_is_idempotent_after_final_decision(client, test_app):
    reader_headers = await headers_for(client, test_app, 501)
    editor_headers = await headers_for(client, test_app, 502, editor=True)
    post_id = await published_post(client, editor_headers)
    comment = await client.post(
        f"/api/v1/posts/{post_id}/comments", headers=reader_headers, json={"body": "На модерацию"}
    )
    comment_id = comment.json()["id"]

    assert (await client.patch(
        f"/api/v1/comments/{comment_id}/moderate", headers=editor_headers, json={"action": "approve"}
    )).status_code == 200
    repeated = await client.patch(
        f"/api/v1/comments/{comment_id}/moderate", headers=editor_headers, json={"action": "approve"}
    )
    assert repeated.status_code == 200
    assert repeated.json()["comment"]["status"] == "approved"
    conflicting = await client.patch(
        f"/api/v1/comments/{comment_id}/moderate", headers=editor_headers, json={"action": "reject"}
    )
    assert conflicting.status_code == 409
    async with test_app.state.database.session_factory() as session:
        notifications = (await session.scalars(select(Notification))).all()
        assert len(notifications) == 1
