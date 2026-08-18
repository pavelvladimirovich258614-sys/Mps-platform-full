from pydantic import BaseModel, Field


class TelegramLoginRequest(BaseModel):
    id: int
    first_name: str = ""
    last_name: str = ""
    username: str | None = None
    photo_url: str | None = None
    auth_date: int
    hash: str


class EmailRequest(BaseModel):
    email: str = Field(max_length=320)


class EmailVerifyRequest(EmailRequest):
    code: str = Field(pattern=r"^\d{6}$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
