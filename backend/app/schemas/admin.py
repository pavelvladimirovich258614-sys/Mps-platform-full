from pydantic import BaseModel, Field, HttpUrl


class UserBanUpdate(BaseModel):
    is_banned: bool


class SettingsUpdate(BaseModel):
    cta_bot_url: HttpUrl | None = None
    cta_manager_url: HttpUrl | None = None
    irishka_enabled: bool | None = None
    irishka_delay_min: int | None = Field(default=None, ge=1, le=10080)


class NotificationsReadUpdate(BaseModel):
    ids: list[int] | None = None
