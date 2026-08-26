from pydantic import BaseModel, Field, HttpUrl


class UserBanUpdate(BaseModel):
    is_banned: bool


class SettingsUpdate(BaseModel):
    cta_bot_url: HttpUrl | None = None
    cta_manager_url: HttpUrl | None = None
    irishka_enabled: bool | None = None
    irishka_delay_min: int | None = Field(default=None, ge=1, le=10080)
    comments_moderation_enabled: bool | None = None
    fishka_submissions_enabled: bool | None = None
    legal_name: str | None = Field(default=None, max_length=255)
    legal_inn: str | None = Field(default=None, max_length=32)
    legal_ogrn: str | None = Field(default=None, max_length=32)
    contact_email: str | None = Field(default=None, max_length=320)
    contact_phone: str | None = Field(default=None, max_length=64)
    contact_address: str | None = Field(default=None, max_length=500)


class PublicSettingsResponse(BaseModel):
    legal_name: str | None = None
    legal_inn: str | None = None
    legal_ogrn: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    contact_address: str | None = None
    comments_moderation_enabled: bool = False


class NotificationsReadUpdate(BaseModel):
    ids: list[int] | None = None
