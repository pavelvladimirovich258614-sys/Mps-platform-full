import hashlib
import hmac
import time

import httpx
import pytest
from fastapi import Depends
from sqlalchemy import select

from app.deps import require_role
from app.models.user import Role, User


def telegram_payload() -> dict:
    data = {"id": 42, "first_name": "Павел", "auth_date": int(time.time())}
    check = "\n".join(f"{key}={data[key]}" for key in sorted(data))
    data["hash"] = hmac.new(hashlib.sha256(b"test-bot-token").digest(), check.encode(), hashlib.sha256).hexdigest()
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


async def test_email_code_is_stored_verified_and_rejected_when_wrong(client, test_app, monkeypatch):
    sent: list[str] = []
    async def capture(email, code): sent.append(code)
    monkeypatch.setattr("app.api.auth.mailer.send_code", capture)
    assert (await client.post("/api/v1/auth/email/request", json={"email": "a@example.com"})).status_code == 204
    assert 0 < await test_app.state.redis.ttl("email-code:a@example.com") <= 600
    assert (await client.post("/api/v1/auth/email/verify", json={"email": "a@example.com", "code": "000000"})).status_code == 400
    assert (await client.post("/api/v1/auth/email/verify", json={"email": "a@example.com", "code": sent[0]})).status_code == 200
    await test_app.state.redis.set("email-code:expired@example.com", "123456", ex=1)
    await test_app.state.redis.delete("email-code:expired@example.com")
    assert (await client.post("/api/v1/auth/email/verify", json={"email": "expired@example.com", "code": "123456"})).status_code == 400


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
