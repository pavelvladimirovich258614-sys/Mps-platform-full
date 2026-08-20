from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.models.setting import Setting
from app.schemas.admin import PublicSettingsResponse


PUBLIC_SETTING_KEYS = (
    "legal_name",
    "legal_inn",
    "contact_email",
    "contact_phone",
    "contact_address",
)

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/public", response_model=PublicSettingsResponse)
async def public_settings(session: AsyncSession = Depends(get_db)) -> PublicSettingsResponse:
    rows = (await session.scalars(select(Setting).where(Setting.key.in_(PUBLIC_SETTING_KEYS)))).all()
    values = {row.key: row.value.strip() or None for row in rows}
    return PublicSettingsResponse(**values)
