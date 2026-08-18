"""F09b acceptance flow against the project's SQLite + fakeredis ASGI test stand."""

from datetime import UTC, datetime

import httpx
import respx
import pytest
from sqlalchemy import select

from app.models.post import Country, Post, PostStatus, PostType
from app.models.subscription import Subscription
from app.models.user import Role, User


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as value:
        yield value


@respx.mock
async def test_f09b_api_acceptance_flow_with_email_auth(client, test_app):
    """Exercises TZ 7.1–6 contracts without external Postgres, Redis, or mail delivery."""
    async with test_app.state.database.session_factory() as session:
        editor = User(email="editor@example.com", name="Редактор", role=Role.EDITOR)
        country = Country(name="ОАЭ", flag_emoji="🇦🇪", sort_order=1)
        session.add_all([editor, country])
        await session.commit()
        await session.refresh(editor)
        await session.refresh(country)
        post = Post(
            type=PostType.FISHKA,
            title="Проверенная фишка",
            slug="proverennaya-fishka",
            cover_url="/cover.jpg",
            body="Текст для сценария F09b",
            author_id=editor.id,
            status=PostStatus.PUBLISHED,
            published_at=datetime.now(UTC),
        )
        session.add(post)
        await session.commit()
        await session.refresh(post)

    # TZ 7.1 and 7.4: a public feed is available and subscription confirms by link.
    respx.post("https://go1.unisender.ru/ru/transactional/api/v1/email/send.json").mock(return_value=httpx.Response(200, json={}))
    assert (await client.get("/api/v1/posts")).json()[0]["id"] == post.id
    subscription = await client.post("/api/v1/subscribe", json={"email": "reader@example.com"})
    assert subscription.status_code == 201
    async with test_app.state.database.session_factory() as session:
        saved_subscription = await session.scalar(select(Subscription).where(Subscription.email == "reader@example.com"))
        confirm_token = saved_subscription.confirm_token
    assert (await client.get(f"/api/v1/subscribe/confirm/{confirm_token}")).json() == {"confirmed": True}

    # TZ 7.2 alternative: email code is read from fakeredis, then yields a reader JWT.
    assert (await client.post("/api/v1/auth/email/request", json={"email": "reader@example.com"})).status_code == 204
    code = await test_app.state.redis.get("email-code:reader@example.com")
    bad_code = await client.post("/api/v1/auth/email/verify", json={"email": "reader@example.com", "code": "000000"})
    assert bad_code.status_code == 400 and "Неверный" in bad_code.json()["detail"]
    verified = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "reader@example.com", "code": code.decode()},
    )
    assert verified.status_code == 200
    headers = {"Authorization": f"Bearer {verified.json()['access_token']}"}
    refresh_cookie = verified.headers["set-cookie"].split(";", 1)[0]
    refreshed = await client.post("/api/v1/auth/refresh", headers={"Cookie": refresh_cookie})
    assert refreshed.status_code == 200 and refreshed.json()["access_token"]
    me = await client.get("/api/v1/me", headers=headers)
    assert me.status_code == 200 and me.json()["role"] == "reader"

    # TZ 7.2–3: an authenticated reader likes, comments and leaves a pending review.
    assert (await client.post(f"/api/v1/posts/{post.id}/like", headers=headers)).json() == {"likes_count": 1}
    assert (await client.post(f"/api/v1/posts/{post.id}/comments", headers=headers, json={"body": "Полезно"})).status_code == 201
    review = await client.post("/api/v1/reviews", headers=headers, json={"author_name": "Читатель", "rating": 5, "body": "Спасибо"})
    assert review.status_code == 201 and review.json()["status"] == "pending"

    # TZ 7.5: the relay call is explicitly mocked; no real Telegram request is possible.
    respx.post("https://api.telegram.org/bottest-bot-token/sendMessage").mock(return_value=httpx.Response(200, json={"result": {"message_id": 77}}))
    question = await client.post("/api/v1/qa", headers=headers, json={"target": "manager", "body": "Нужен совет"})
    assert question.status_code == 201 and question.json()["tg_message_id"] == 77

    # TZ 7.6: a reader creates a country topic and then adds a second message.
    topic = await client.post(f"/api/v1/countries/{country.id}/topics", headers=headers, json={"title": "Какая симка?"})
    assert topic.status_code == 201
    message = await client.post(f"/api/v1/topics/{topic.json()['id']}/messages", headers=headers, json={"body": "Поделюсь опытом"})
    assert message.status_code == 201
