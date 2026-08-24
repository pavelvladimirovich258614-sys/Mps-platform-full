from io import BytesIO
import hashlib
import hmac
from pathlib import Path
import random
import time

import httpx
import pytest
from PIL import Image
from pillow_heif import from_pillow


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


def heif_bytes(format_name: str) -> bytes:
    image = Image.new("RGB", (20, 20), color="red")
    data = BytesIO()
    from_pillow(image).save(data, format=format_name)
    return data.getvalue()


def png_larger_than_nginx_default() -> bytes:
    width = height = 700
    pixels = random.Random(21).randbytes(width * height * 3)
    image = Image.frombytes("RGB", (width, height), pixels)
    data = BytesIO()
    image.save(data, format="PNG")
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


@pytest.mark.parametrize(
    ("format_name", "content_type", "filename"),
    [("HEIF", "image/heic", "iphone.heic"), ("HEIF", "image/heif", "iphone.heif")],
)
async def test_upload_converts_heic_and_heif_to_displayable_webp(client, test_app, format_name, content_type, filename):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": (filename, heif_bytes(format_name), content_type)},
    )

    assert response.status_code == 200
    saved_file = Path(test_app.state.settings.media_dir, Path(response.json()["url"]).name)
    assert saved_file.suffix == ".webp"
    with Image.open(saved_file) as saved:
        assert saved.format == "WEBP"


async def test_upload_accepts_avif(client, test_app):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("photo.avif", image_bytes("AVIF"), "image/avif")},
    )

    assert response.status_code == 200
    saved_file = Path(test_app.state.settings.media_dir, Path(response.json()["url"]).name)
    assert saved_file.suffix == ".avif"
    with Image.open(saved_file) as saved:
        assert saved.format == "AVIF"


async def test_uploads_two_images_sequentially_with_same_token(client, test_app):
    headers = await authorization(client)
    second_image = png_larger_than_nginx_default()
    assert 1024 * 1024 < len(second_image) < 10 * 1024 * 1024

    first = await client.post(
        "/api/v1/media",
        headers=headers,
        files={"file": ("first.png", image_bytes("PNG"), "image/png")},
    )
    second = await client.post(
        "/api/v1/media",
        headers=headers,
        files={"file": ("second.png", second_image, "image/png")},
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["url"] != second.json()["url"]
    assert len(list(Path(test_app.state.settings.media_dir).iterdir())) == 2


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


async def test_upload_explains_unsupported_format(client):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("document.pdf", b"not an image", "application/pdf")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Допустимы JPEG, PNG, WebP, HEIC, HEIF или AVIF"


async def test_upload_rejects_truncated_png_with_valid_mime(client, test_app):
    headers = await authorization(client)
    truncated_png = image_bytes("PNG")[:-24]

    response = await client.post(
        "/api/v1/media",
        headers=headers,
        files={"file": ("truncated.png", truncated_png, "image/png")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Некорректное изображение"
    media_dir = Path(test_app.state.settings.media_dir)
    assert not media_dir.exists() or list(media_dir.iterdir()) == []


async def test_upload_requires_authentication(client):
    response = await client.post(
        "/api/v1/media",
        files={"file": ("image.png", image_bytes("PNG"), "image/png")},
    )
    assert response.status_code == 401
