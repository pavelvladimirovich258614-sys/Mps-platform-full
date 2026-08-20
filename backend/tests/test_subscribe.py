from datetime import UTC, datetime, timedelta
import json
import re
from urllib.parse import urlparse

import httpx
import pytest
import respx
from sqlalchemy import select

from app.models.post import Post, PostStatus, PostType
from app.models.subscription import Subscription
from app.models.user import User
from app.services.mailer import build_digest


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as async_client:
        yield async_client


@respx.mock
async def test_double_opt_in_and_unsubscribe(client, test_app):
    route = respx.post("https://go1.unisender.ru/ru/transactional/api/v1/email/send.json").mock(return_value=httpx.Response(200, json={"result": {"id": "mail-1"}}))
    created = await client.post("/api/v1/subscribe", json={"email": "tourist@example.com"})
    assert created.status_code == 201
    assert route.called
    request_json = json.loads(route.calls[0].request.content)
    assert request_json["message"]["recipients"] == [{"email": "tourist@example.com"}]
    assert "confirm" in request_json["message"]["body"]["html"]
    async with test_app.state.database.session_factory() as session:
        subscription = await session.scalar(select(Subscription).where(Subscription.email == "tourist@example.com"))
        confirm_token, unsub_token = subscription.confirm_token, subscription.unsub_token
    html = request_json["message"]["body"]["html"]
    match = re.search(r'href="([^"]+)"', html)
    assert match is not None
    confirm_url = match.group(1)
    assert confirm_url == f"{test_app.state.settings.base_url.rstrip('/')}/api/v1/subscribe/confirm/{confirm_token}"
    assert (await client.get(urlparse(confirm_url).path)).status_code == 200
    assert (await client.get(f"/api/v1/subscribe/unsub/{unsub_token}")).status_code == 200
    async with test_app.state.database.session_factory() as session:
        assert await session.scalar(select(Subscription).where(Subscription.email == "tourist@example.com")) is None


@respx.mock
async def test_subscription_reports_unisender_delivery_failure_without_losing_token(client, test_app):
    respx.post("https://go1.unisender.ru/ru/transactional/api/v1/email/send.json").mock(
        return_value=httpx.Response(503, json={"error": "temporary unavailable"})
    )

    response = await client.post("/api/v1/subscribe", json={"email": "retry@example.com"})

    assert response.status_code == 502
    assert "Не удалось отправить" in response.json()["detail"]
    async with test_app.state.database.session_factory() as session:
        subscription = await session.scalar(select(Subscription).where(Subscription.email == "retry@example.com"))
        assert subscription is not None
        assert subscription.confirmed is False
        assert subscription.confirm_token
        confirm_token = subscription.confirm_token

    retry = await client.post("/api/v1/subscribe", json={"email": "retry@example.com"})

    assert retry.status_code == 502
    async with test_app.state.database.session_factory() as session:
        subscription = await session.scalar(select(Subscription).where(Subscription.email == "retry@example.com"))
        assert subscription is not None
        assert subscription.confirm_token == confirm_token


async def test_digest_uses_only_recent_published_posts(test_app):
    async with test_app.state.database.session_factory() as session:
        user = User(email="editor@example.com", name="Editor")
        session.add(user); await session.flush()
        session.add_all([
            Post(type=PostType.ARTICLE, title="Свежий", slug="fresh", body="Body", author_id=user.id, status=PostStatus.PUBLISHED, published_at=datetime.now(UTC)),
            Post(type=PostType.ARTICLE, title="Старый", slug="old", body="Body", author_id=user.id, status=PostStatus.PUBLISHED, published_at=datetime.now(UTC) - timedelta(days=8)),
        ])
        await session.commit()
    html = await build_digest(test_app.state.database.session_factory, days=7)
    assert "Свежий" in html and "Старый" not in html
