import hashlib
import hmac
import json
import time

import httpx
import pytest
import respx
from fastapi import Depends
from sqlalchemy import select

from app.deps import require_role
from app.models.user import Role, User


def telegram_payload() -> dict:
    data = {"id": 42, "first_name": "Павел", "auth_date": int(time.time())}
    check = "\n".join(f"{key}={data[key]}" for key in sorted(data))
    data["hash"] = hmac.new(hashlib.sha256(b"test-auth-bot-token").digest(), check.encode(), hashlib.sha256).hexdigest()
    return data


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as value:
        yield value


async def test_telegram_valid_and_tampered_hash(client):
    payload = telegram_payload()
    response = await client.post("/api/v1/auth/telegram", json=payload)
    assert response.status_code == 200
    assert response.json()["access_token"]
    payload["hash"] = "0" * 64
    assert (await client.post("/api/v1/auth/telegram", json=payload)).status_code == 401


async def test_logout_clears_refresh_cookie(client):
    response = await client.post("/api/v1/auth/logout")

    assert response.status_code == 204
    assert "refresh_token=\"\"" in response.headers["set-cookie"]
    assert "Max-Age=0" in response.headers["set-cookie"]


@respx.mock
async def test_email_code_is_sent_stored_verified_and_rejected_when_wrong(client, test_app):
    delivery = respx.post("https://go1.unisender.ru/ru/transactional/api/v1/email/send.json").mock(
        return_value=httpx.Response(200, json={"result": {"id": "login-code-mail"}})
    )
    assert (await client.post("/api/v1/auth/email/request", json={"email": "a@example.com"})).status_code == 204
    stored = await test_app.state.redis.get("email-code:a@example.com")
    code = stored.decode() if isinstance(stored, bytes) else stored
    request_json = json.loads(delivery.calls.last.request.content)
    assert request_json["message"]["recipients"] == [{"email": "a@example.com"}]
    assert request_json["message"]["subject"] == "Код для входа в «Мир под солнцем»"
    assert code in request_json["message"]["body"]["html"]
    assert 0 < await test_app.state.redis.ttl("email-code:a@example.com") <= 600
    assert (await client.post("/api/v1/auth/email/verify", json={"email": "a@example.com", "code": "000000"})).status_code == 400
    assert (await client.post("/api/v1/auth/email/verify", json={"email": "a@example.com", "code": code})).status_code == 200
    await test_app.state.redis.set("email-code:expired@example.com", "123456", ex=1)
    await test_app.state.redis.delete("email-code:expired@example.com")
    assert (await client.post("/api/v1/auth/email/verify", json={"email": "expired@example.com", "code": "123456"})).status_code == 400


@respx.mock
async def test_email_delivery_failure_removes_undelivered_code(client, test_app):
    delivery = respx.post("https://go1.unisender.ru/ru/transactional/api/v1/email/send.json").mock(
        return_value=httpx.Response(503, json={"message": "temporarily unavailable"})
    )

    response = await client.post("/api/v1/auth/email/request", json={"email": "offline@example.com"})

    assert delivery.called
    assert response.status_code == 502
    assert response.json()["detail"] == "Не удалось отправить код. Попробуйте ещё раз позже"
    assert await test_app.state.redis.get("email-code:offline@example.com") is None
    verify = await client.post(
        "/api/v1/auth/email/verify",
        json={"email": "offline@example.com", "code": "123456"},
    )
    assert verify.status_code == 400


async def test_me_requires_and_accepts_access_token(client):
    assert (await client.get("/api/v1/me")).status_code == 401
    token = (await client.post("/api/v1/auth/telegram", json=telegram_payload())).json()["access_token"]
    response = await client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["last_seen_at"] is not None


async def test_reader_is_forbidden_from_editor_dependency(client, test_app):
    @test_app.get("/editor-check")
    async def editor_check(_: User = Depends(require_role(Role.EDITOR))):
        return {"ok": True}

    token = (await client.post("/api/v1/auth/telegram", json=telegram_payload())).json()["access_token"]
    response = await client.get("/editor-check", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
