from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Request
from PIL import Image, ImageOps, UnidentifiedImageError
from pillow_heif import register_heif_opener

from app.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/media", tags=["media"])
register_heif_opener()

SUPPORTED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MEDIUM_VARIANT_MAX_BYTES = 350 * 1024
VARIANT_MAX_DIMENSIONS = {"thumbnail": 320, "medium": 960, "large": 1600}


def _display_mode(image: Image.Image) -> str:
    has_alpha = image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info)
    return "RGBA" if has_alpha else "RGB"


def _resize(image: Image.Image, max_dimension: int) -> Image.Image:
    variant = image.copy()
    variant.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    return variant


def _encode(image: Image.Image, image_format: str, max_bytes: int | None = None) -> bytes:
    qualities = (82, 74, 66, 58, 50, 42, 34, 26, 18, 10) if image_format == "WEBP" else (65, 58, 51, 44, 37, 30, 23, 16)
    encoded = b""
    for quality in qualities:
        output = BytesIO()
        options = {"quality": quality, "method": 4} if image_format == "WEBP" else {"quality": quality, "speed": 8}
        image.save(output, format=image_format, **options)
        encoded = output.getvalue()
        if max_bytes is None or len(encoded) <= max_bytes:
            return encoded
    return encoded


def _encode_variant(image: Image.Image, max_dimension: int, budget: int | None) -> tuple[Image.Image, bytes, bytes]:
    resized = _resize(image, max_dimension)
    while True:
        webp = _encode(resized, "WEBP", budget)
        avif = _encode(resized, "AVIF", budget)
        if budget is None or (len(webp) <= budget and len(avif) <= budget):
            return resized, webp, avif
        current_dimension = max(resized.size)
        resized = _resize(image, max(1, int(current_dimension * 0.8)))


def _build_variants(image: Image.Image, stem: str) -> tuple[dict[str, dict[str, int | str]], dict[str, bytes]]:
    variants: dict[str, dict[str, int | str]] = {}
    files: dict[str, bytes] = {}
    for name, max_dimension in VARIANT_MAX_DIMENSIONS.items():
        budget = MEDIUM_VARIANT_MAX_BYTES if name == "medium" else None
        resized, webp, avif = _encode_variant(image, max_dimension, budget)
        webp_name = f"{stem}-{name}.webp"
        avif_name = f"{stem}-{name}.avif"
        files[webp_name] = webp
        files[avif_name] = avif
        variants[name] = {
            "width": resized.width,
            "height": resized.height,
            "webp_url": f"/media/{webp_name}",
            "avif_url": f"/media/{avif_name}",
        }
    return variants, files


@router.post("")
async def upload(request: Request, file: UploadFile = File(...), user: User = Depends(get_current_user)):
    media_type = file.content_type
    if media_type not in SUPPORTED_MEDIA_TYPES:
        raise HTTPException(422, "Допустимы JPEG, PNG, WebP, HEIC, HEIF или AVIF")

    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(422, "Файл превышает 10 МБ")

    try:
        source = Image.open(BytesIO(raw))
        source.load()
        normalized = ImageOps.exif_transpose(source).convert(_display_mode(source))
        variants, files = _build_variants(normalized, uuid4().hex)
    except (Image.DecompressionBombError, OSError, UnidentifiedImageError, ValueError) as exc:
        raise HTTPException(422, "Некорректное изображение") from exc

    directory = Path(request.app.state.settings.media_dir)
    directory.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        (directory / name).write_bytes(content)

    return {"url": variants["large"]["webp_url"], "variants": variants}
