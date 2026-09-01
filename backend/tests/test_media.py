from io import BytesIO
import hashlib
import hmac
from pathlib import Path
import random
import time
from unittest.mock import Mock

import httpx
import pytest
from PIL import Image
from pillow_heif import from_pillow, register_heif_opener

from app.api import media as media_api


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


def heif_bytes(image: Image.Image | None = None, exif: bytes | None = None) -> bytes:
    image = image or Image.new("RGB", (20, 20), color="red")
    data = BytesIO()
    from_pillow(image).save(data, format="HEIF", exif=exif)
    return data.getvalue()


def exif_rotated_heif_bytes() -> bytes:
    image = Image.new("RGB", (1200, 1800), color=(44, 122, 173))
    exif = Image.Exif()
    exif[274] = 6
    return heif_bytes(image, exif.tobytes())


def png_larger_than_nginx_default() -> bytes:
    width = height = 700
    pixels = random.Random(21).randbytes(width * height * 3)
    image = Image.frombytes("RGB", (width, height), pixels)
    data = BytesIO()
    image.save(data, format="PNG")
    return data.getvalue()


def detailed_jpeg_bytes(width: int = 2200, height: int = 1467) -> bytes:
    pixels = random.Random(84).randbytes(width * height * 3)
    image = Image.frombytes("RGB", (width, height), pixels)
    data = BytesIO()
    image.save(data, format="JPEG", quality=92)
    return data.getvalue()


def exif_rotated_jpeg_bytes() -> bytes:
    image = Image.new("RGB", (1200, 1800), color=(44, 122, 173))
    exif = Image.Exif()
    exif[274] = 6
    data = BytesIO()
    image.save(data, format="JPEG", quality=92, exif=exif)
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
    assert response.json()["url"].endswith("-large.webp")
    assert len(list(Path(test_app.state.settings.media_dir).iterdir())) == 6


@pytest.mark.parametrize(
    ("content_type", "filename"),
    [
        ("image/heic", "iphone.heic"),
        ("image/heif", "iphone.heif"),
    ],
)
async def test_upload_accepts_real_heic_and_heif(client, test_app, content_type, filename):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": (filename, heif_bytes(), content_type)},
    )

    assert response.status_code == 200
    assert response.json()["url"].endswith("-large.webp")
    assert len(list(Path(test_app.state.settings.media_dir).iterdir())) == 6


async def test_upload_heif_creates_all_responsive_webp_avif_variants(client, test_app):
    source = Image.new("RGB", (1800, 1200), color=(30, 90, 150))
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("landscape.heic", heif_bytes(source), "image/heic")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert set(payload["variants"]) == {"thumbnail", "medium", "large"}
    media_dir = Path(test_app.state.settings.media_dir)
    for name, expected_width in {"thumbnail": 320, "medium": 960, "large": 1600}.items():
        variant = payload["variants"][name]
        assert variant["width"] == expected_width
        assert variant["height"] == round(expected_width * 2 / 3)
        for field, expected_format in (("webp_url", "WEBP"), ("avif_url", "AVIF")):
            saved_file = media_dir / Path(variant[field]).name
            with Image.open(saved_file) as saved:
                assert saved.format == expected_format
                assert saved.size == (variant["width"], variant["height"])
    assert len(list(media_dir.iterdir())) == 6


async def test_upload_heif_fails_closed_below_safe_native_version(client, test_app, monkeypatch):
    opener = Mock(wraps=register_heif_opener)
    monkeypatch.setattr(media_api, "libheif_info", lambda: {"libheif": "1.23.1"}, raising=False)
    monkeypatch.setattr(media_api, "register_heif_opener", opener, raising=False)

    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("disguised.jpg", heif_bytes(), "image/jpeg")},
    )

    opener.assert_not_called()
    assert response.status_code == 422
    assert response.json()["detail"] == "Формат HEIC/HEIF временно недоступен, используйте JPEG/PNG/WebP"
    media_dir = Path(test_app.state.settings.media_dir)
    assert not media_dir.exists() or list(media_dir.iterdir()) == []


async def test_upload_heif_fails_closed_when_native_runtime_is_unavailable(client, monkeypatch):
    monkeypatch.setattr(media_api, "libheif_info", None)
    monkeypatch.setattr(media_api, "register_heif_opener", None)

    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("unavailable.heic", heif_bytes(), "image/heic")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Формат HEIC/HEIF временно недоступен, используйте JPEG/PNG/WebP"


async def test_upload_heif_enables_decoder_at_safe_native_version(client, monkeypatch):
    opener = Mock(wraps=register_heif_opener)
    monkeypatch.setattr(media_api, "libheif_info", lambda: {"libheif": "1.23.2"}, raising=False)
    monkeypatch.setattr(media_api, "register_heif_opener", opener, raising=False)

    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("safe.heic", heif_bytes(), "image/heic")},
    )

    opener.assert_called()
    assert response.status_code == 200


async def test_upload_heif_applies_iphone_exif_orientation(client, test_app):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("iphone.heic", exif_rotated_heif_bytes(), "image/heic")},
    )

    assert response.status_code == 200
    assert all(
        variant["width"] > variant["height"]
        for variant in response.json()["variants"].values()
    )


async def test_upload_heif_preserves_alpha_in_generated_variants(client, test_app):
    source = Image.new("RGBA", (640, 360), color=(30, 90, 150, 96))
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("alpha.heif", heif_bytes(source), "image/heif")},
    )

    assert response.status_code == 200
    media_dir = Path(test_app.state.settings.media_dir)
    for variant in response.json()["variants"].values():
        for field in ("webp_url", "avif_url"):
            with Image.open(media_dir / Path(variant[field]).name) as saved:
                saved.load()
                assert "A" in saved.mode
                assert saved.getchannel("A").getextrema()[1] < 255


async def test_upload_heif_disguise_cannot_bypass_unsafe_runtime_guard(client, monkeypatch):
    monkeypatch.setattr(media_api, "libheif_info", lambda: {"libheif": "1.22.0"}, raising=False)

    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("photo.jpg", heif_bytes(), "image/jpeg")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Формат HEIC/HEIF временно недоступен, используйте JPEG/PNG/WebP"


async def test_upload_rejects_malformed_and_truncated_heif_without_writes(client, test_app):
    valid = heif_bytes()
    headers = await authorization(client)
    responses = [
        await client.post(
            "/api/v1/media",
            headers=headers,
            files={"file": ("broken.heic", payload, "image/heic")},
        )
        for payload in (b"not a heif image", valid[: max(32, len(valid) // 3)])
    ]

    assert [response.status_code for response in responses] == [422, 422]
    media_dir = Path(test_app.state.settings.media_dir)
    assert not media_dir.exists() or list(media_dir.iterdir()) == []


async def test_upload_rejects_heif_over_ten_mib_before_decode(client):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("large.heic", b"x" * (10 * 1024 * 1024 + 1), "image/heic")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Файл превышает 10 МБ"


@pytest.mark.parametrize("major_brand", [b"avif", b"mif1"])
async def test_upload_accepts_avif(client, test_app, major_brand):
    source = bytearray(image_bytes("AVIF"))
    assert source[4:8] == b"ftyp"
    source[8:12] = major_brand
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("photo.avif", bytes(source), "image/avif")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["url"].endswith("-large.webp")
    saved_file = Path(test_app.state.settings.media_dir, Path(payload["variants"]["large"]["avif_url"]).name)
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
    assert len(list(Path(test_app.state.settings.media_dir).iterdir())) == 12


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
    assert response.json()["detail"] == "Допустимы JPEG, PNG, WebP или AVIF"


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


async def test_upload_generates_bounded_webp_avif_variants_and_applies_exif_orientation(client, test_app):
    response = await client.post(
        "/api/v1/media",
        headers=await authorization(client),
        files={"file": ("iphone-portrait.jpg", exif_rotated_jpeg_bytes(), "image/jpeg")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "variants" in payload, "upload must return responsive image variants"
    assert set(payload["variants"]) == {"thumbnail", "medium", "large"}
    assert payload["url"] == payload["variants"]["large"]["webp_url"]

    max_widths = {"thumbnail": 320, "medium": 960, "large": 1600}
    media_dir = Path(test_app.state.settings.media_dir)
    for name, max_width in max_widths.items():
        variant = payload["variants"][name]
        assert {"width", "height", "webp_url", "avif_url"} <= set(variant)
        assert variant["width"] <= max_width
        assert variant["width"] > variant["height"], "EXIF orientation must be applied before resizing"
        for field, expected_format in (("webp_url", "WEBP"), ("avif_url", "AVIF")):
            saved_file = media_dir / Path(variant[field]).name
            assert saved_file.is_file()
            with Image.open(saved_file) as saved:
                assert saved.format == expected_format
                assert saved.width == variant["width"]
                assert saved.height == variant["height"]

    saved_files = list(media_dir.iterdir())
    assert len(saved_files) == 6
    assert {path.suffix for path in saved_files} == {".webp", ".avif"}


async def test_two_initial_mobile_images_fit_700_kib_media_budget(client, test_app):
    headers = await authorization(client)
    source = detailed_jpeg_bytes()
    assert len(source) < 10 * 1024 * 1024

    responses = [
        await client.post(
            "/api/v1/media",
            headers=headers,
            files={"file": (f"mobile-{index}.jpg", source, "image/jpeg")},
        )
        for index in range(2)
    ]

    assert [response.status_code for response in responses] == [200, 200]
    payloads = [response.json() for response in responses]
    assert all("variants" in payload for payload in payloads), "upload must expose the mobile-sized variants"
    media_dir = Path(test_app.state.settings.media_dir)
    initial_fallback_bytes = sum(
        (media_dir / Path(payload["variants"]["medium"]["webp_url"]).name).stat().st_size
        for payload in payloads
    )
    assert initial_fallback_bytes <= 700 * 1024
