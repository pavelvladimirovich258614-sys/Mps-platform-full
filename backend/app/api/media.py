from io import BytesIO
from pathlib import Path
from uuid import uuid4
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Request
from PIL import Image, UnidentifiedImageError
from pillow_heif import register_heif_opener
from app.deps import get_current_user
from app.models.user import User

router=APIRouter(prefix="/media",tags=["media"])
register_heif_opener()

SUPPORTED_MEDIA_TYPES = {
    "image/jpeg": (".jpg", "JPEG"),
    "image/png": (".png", "PNG"),
    "image/webp": (".webp", "WEBP"),
    "image/heic": (".webp", "WEBP"),
    "image/heif": (".webp", "WEBP"),
    "image/avif": (".avif", "AVIF"),
}

@router.post("")
async def upload(request:Request,file:UploadFile=File(...),user:User=Depends(get_current_user)):
    media_type = file.content_type
    if media_type not in SUPPORTED_MEDIA_TYPES: raise HTTPException(422,"Допустимы JPEG, PNG, WebP, HEIC, HEIF или AVIF")
    raw=await file.read()
    if len(raw)>10*1024*1024: raise HTTPException(422,"Файл превышает 10 МБ")
    try: image=Image.open(BytesIO(raw)); image.load(); image.thumbnail((1600,1600))
    except (OSError, UnidentifiedImageError) as exc: raise HTTPException(422,"Некорректное изображение") from exc
    directory=Path(request.app.state.settings.media_dir);directory.mkdir(parents=True,exist_ok=True);suffix, output_format = SUPPORTED_MEDIA_TYPES[media_type];name=f"{uuid4().hex}{suffix}";image.save(directory/name, format=output_format);return {"url":f"/media/{name}"}
