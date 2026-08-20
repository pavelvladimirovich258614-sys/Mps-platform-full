from io import BytesIO
import hashlib
import hmac
from pathlib import Path
import time

import httpx
import pytest
from PIL import Image


def telegram_payload():
    payload = {"id": 101, "first_name": "Reader", "auth_date": int(time.time())}
    data_check_string = "\n".join(f"{key}={payload[key]}" for key in sorted(payload))
    payload["hash"] = hmac.new(
        hashlib.sha256(b"test-auth-bot-token").digest(),
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()
    return payload


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as async_client:
        yield async_client


async def authorization(client):
    response = await client.post("/api/v1/auth/telegram", json=telegram_payload())
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def image_bytes(image_format: str) -> bytes:
    image = Image.new("RGB", (20, 20), color="red")
    data = BytesIO()
    image.save(data, format=image_format)
    return data.getvalue()


@pytest.mark.parametrize(
    ("image_format", "content_type", "filename"),
    [("JPEG", "image/jpeg", "image.jpg"), ("PNG", "image/png", "image.png"), ("WEBP", "image/webp", "image.webp")],
)
async def test_upload_supported_images(client, test_app, image_format, content_type, filename):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": (filename, image_bytes(image_format), content_type)},
    )
    assert response.status_code == 200
    assert len(list(Path(test_app.state.settings.media_dir).iterdir())) == 1


async def test_upload_rejects_invalid_image_and_large_file(client):
    headers = await authorization(client)
    invalid = await client.post(
        "/api/v1/media",
        headers=headers,
        files={"file": ("invalid.jpg", b"not an image", "image/jpeg")},
    )
    assert invalid.status_code == 422
    large = await client.post(
        "/api/v1/media",
        headers=headers,
        files={"file": ("large.jpg", b"x" * (10 * 1024 * 1024 + 1), "image/jpeg")},
    )
    assert large.status_code == 422


async def test_upload_requires_authentication(client):
    response = await client.post(
        "/api/v1/media",
        files={"file": ("image.png", image_bytes("PNG"), "image/png")},
    )
    assert response.status_code == 401
