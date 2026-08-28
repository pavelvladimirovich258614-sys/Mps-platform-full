import hashlib
import hmac
import time
from datetime import UTC, datetime, timedelta

import httpx
import pytest
from sqlalchemy import select

from app.models.notification import Notification
from app.models.review import ReviewToken
from app.models.user import Role, User


def telegram_payload(user_id: int) -> dict[str, int | str]:
    payload: dict[str, int | str] = {"id": user_id, "first_name": "Пользователь", "auth_date": int(time.time())}
    check = "\n".join(f"{key}={payload[key]}" for key in sorted(payload))
    payload["hash"] = hmac.new(
        hashlib.sha256(b"test-auth-bot-token").digest(), check.encode(), hashlib.sha256
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


async def test_review_moderation_and_author_notification(client, test_app):
    reader_headers = await headers_for(client, test_app, 201)
    editor_headers = await headers_for(client, test_app, 202, editor=True)
    created = await client.post(
        "/api/v1/reviews",
        headers=reader_headers,
        json={"author_name": "Анна", "rating": 5, "body": "Отличный отдых"},
    )
    assert created.status_code == 201
    review_id = created.json()["id"]
    public = await client.get("/api/v1/reviews?status=approved")
    assert public.status_code == 200
    assert public.json() == []
    assert (await client.patch(
        f"/api/v1/reviews/{review_id}/moderate",
        headers=reader_headers,
        json={"action": "approve"},
    )).status_code == 403
    moderated = await client.patch(
        f"/api/v1/reviews/{review_id}/moderate",
        headers=editor_headers,
        json={"action": "approve"},
    )
    assert moderated.status_code == 200
    assert moderated.json()["pending_count"] == 0
    assert [review["id"] for review in (await client.get("/api/v1/reviews?status=approved")).json()] == [review_id]
    rejected = await client.post(
        "/api/v1/reviews",
        headers=reader_headers,
        json={"author_name": "Анна", "rating": 3, "body": "Не публиковать"},
    )
    rejected_id = rejected.json()["id"]
    rejection = await client.patch(
        f"/api/v1/reviews/{rejected_id}/moderate",
        headers=editor_headers,
        json={"action": "reject"},
    )
    assert rejection.status_code == 200
    assert rejection.json()["review"]["status"] == "rejected"
    mine = await client.get("/api/v1/reviews/mine", headers=reader_headers)
    assert mine.status_code == 200
    assert next(review for review in mine.json() if review["id"] == rejected_id)["status"] == "rejected"
    assert [review["id"] for review in (await client.get("/api/v1/reviews?status=approved")).json()] == [review_id]
    async with test_app.state.database.session_factory() as session:
        notification = await session.scalar(select(Notification))
        assert notification.user_id is not None
        assert notification.type == "review_approved"


async def test_pending_reviews_queue_is_editor_only(client, test_app):
    reader_headers = await headers_for(client, test_app, 601)
    editor_headers = await headers_for(client, test_app, 602, editor=True)
    first = await client.post(
        "/api/v1/reviews",
        headers=reader_headers,
        json={"author_name": "Анна", "rating": 5, "body": "На проверке"},
    )
    second = await client.post(
        "/api/v1/reviews",
        headers=reader_headers,
        json={"author_name": "Илья", "rating": 4, "body": "Тоже на проверке"},
    )
    assert first.status_code == second.status_code == 201

    assert (await client.get("/api/v1/reviews/pending", headers=reader_headers)).status_code == 403
    queued = await client.get("/api/v1/reviews/pending", headers=editor_headers)

    assert queued.status_code == 200
    assert [review["id"] for review in queued.json()] == [first.json()["id"], second.json()["id"]]
    assert {review["status"] for review in queued.json()} == {"pending"}
    assert (await client.get("/api/v1/reviews")).json() == []


async def test_review_token_is_protected_single_use_and_expires(client, test_app):
    unauthorized = await client.post("/api/v1/internal/review-tokens", json={"tg_id": 777})
    assert unauthorized.status_code == 401
    issued = await client.post(
        "/api/v1/internal/review-tokens",
        headers={"X-Bot-Bridge-Secret": "bridge-secret"},
        json={"tg_id": 777},
    )
    assert issued.status_code == 201
    token = issued.json()["token"]
    first = await client.post(
        "/api/v1/reviews/by-token",
        json={"token": token, "author_name": "Клиент", "rating": 4, "body": "Спасибо"},
    )
    assert first.status_code == 201
    assert (await client.post(
        "/api/v1/reviews/by-token",
        json={"token": token, "author_name": "Клиент", "rating": 4, "body": "Спасибо"},
    )).status_code == 404
    async with test_app.state.database.session_factory() as session:
        session.add(ReviewToken(token="expired", tg_id=778, expires_at=datetime.now(UTC) - timedelta(seconds=1)))
        await session.commit()
    expired = await client.post(
        "/api/v1/reviews/by-token",
        json={"token": "expired", "author_name": "Клиент", "rating": 4, "body": "Спасибо"},
    )
    assert expired.status_code == 410


async def test_review_moderation_is_idempotent_after_final_decision(client, test_app):
    reader_headers = await headers_for(client, test_app, 801)
    editor_headers = await headers_for(client, test_app, 802, editor=True)
    created = await client.post(
        "/api/v1/reviews",
        headers=reader_headers,
        json={"author_name": "Анна", "rating": 5, "body": "Отличный отдых"},
    )
    review_id = created.json()["id"]

    assert (await client.patch(
        f"/api/v1/reviews/{review_id}/moderate", headers=editor_headers, json={"action": "approve"}
    )).status_code == 200
    repeated = await client.patch(
        f"/api/v1/reviews/{review_id}/moderate", headers=editor_headers, json={"action": "approve"}
    )
    assert repeated.status_code == 200
    assert repeated.json()["review"]["status"] == "approved"
    conflicting = await client.patch(
        f"/api/v1/reviews/{review_id}/moderate", headers=editor_headers, json={"action": "reject"}
    )
    assert conflicting.status_code == 409
    async with test_app.state.database.session_factory() as session:
        notifications = (await session.scalars(select(Notification))).all()
        assert len(notifications) == 1


async def test_review_accepts_two_photos_and_exposes_them(client, test_app):
    headers = await headers_for(client, test_app, 901)

    created = await client.post(
        "/api/v1/reviews",
        headers=headers,
        json={
            "author_name": "Анна",
            "rating": 5,
            "body": "Две фотографии из поездки",
            "photo_urls": ["/media/sea.webp", "/media/hotel.webp"],
        },
    )

    assert created.status_code == 201
    assert created.json()["photo_urls"] == ["/media/sea.webp", "/media/hotel.webp"]
    assert created.json()["photo_url"] == "/media/sea.webp"


async def test_review_rejects_more_than_two_photos(client, test_app):
    headers = await headers_for(client, test_app, 902)

    response = await client.post(
        "/api/v1/reviews",
        headers=headers,
        json={
            "author_name": "Анна",
            "rating": 5,
            "body": "Слишком много фото",
            "photo_urls": ["/media/one.webp", "/media/two.webp", "/media/three.webp"],
        },
    )

    assert response.status_code == 422


async def test_review_body_is_limited_to_one_thousand_characters(client, test_app):
    headers = await headers_for(client, test_app, 903)

    response = await client.post(
        "/api/v1/reviews",
        headers=headers,
        json={"author_name": "Анна", "rating": 5, "body": "а" * 1001},
    )

    assert response.status_code == 422


async def test_review_mine_returns_only_current_users_statuses(client, test_app):
    author_headers = await headers_for(client, test_app, 904)
    other_headers = await headers_for(client, test_app, 905)
    own = await client.post(
        "/api/v1/reviews",
        headers=author_headers,
        json={"author_name": "Анна", "rating": 5, "body": "На модерации"},
    )
    foreign = await client.post(
        "/api/v1/reviews",
        headers=other_headers,
        json={"author_name": "Илья", "rating": 4, "body": "Чужой отзыв"},
    )

    mine = await client.get("/api/v1/reviews/mine", headers=author_headers)

    assert mine.status_code == 200
    assert [(review["id"], review["status"]) for review in mine.json()] == [(own.json()["id"], "pending")]
    assert foreign.json()["id"] not in [review["id"] for review in mine.json()]
