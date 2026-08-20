import hashlib
import hmac
import secrets
import time

import jwt
from fastapi import APIRouter, HTTPException, Request, Response, status
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import EmailRequest, EmailVerifyRequest, TelegramLoginRequest, TokenResponse
from app.services import mailer
from app.services.tokens import create_access_token, create_refresh_token
from app.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


def telegram_hash_is_valid(payload: TelegramLoginRequest, bot_token: str) -> bool:
    values = payload.model_dump(exclude={"hash"}, exclude_none=True, exclude_unset=True)
    check = "\n".join(f"{key}={values[key]}" for key in sorted(values))
    secret = hashlib.sha256(bot_token.encode()).digest()
    expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, payload.hash)


def tokens_response(user: User, request: Request, response: Response) -> TokenResponse:
    settings = request.app.state.settings
    refresh = create_refresh_token(user.id, settings)
    response.set_cookie("refresh_token", refresh, max_age=settings.refresh_token_days * 86400, httponly=True, secure=True, samesite="lax")
    return TokenResponse(access_token=create_access_token(user.id, settings))


@router.post("/telegram", response_model=TokenResponse)
@limiter.limit("5/minute")
async def telegram_login(payload: TelegramLoginRequest, request: Request, response: Response) -> TokenResponse:
    settings = request.app.state.settings
    if not settings.auth_bot_token or payload.auth_date < time.time() - 86400 or not telegram_hash_is_valid(payload, settings.auth_bot_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Недействительные данные Telegram")
    session: AsyncSession = request.state.db
    user = await session.scalar(select(User).where(User.tg_id == payload.id))
    if user is None:
        user = User(tg_id=payload.id, name=" ".join(filter(None, [payload.first_name, payload.last_name])) or payload.username or "Пользователь", avatar_url=payload.photo_url)
        session.add(user)
        await session.commit()
        await session.refresh(user)
    return tokens_response(user, request, response)


@router.post("/email/request", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
async def email_request(payload: EmailRequest, request: Request) -> None:
    """Issue a login code, removing its Redis value unless email delivery is accepted."""

    code = f"{secrets.randbelow(1_000_000):06d}"
    redis: Redis = request.app.state.redis
    email = payload.email.lower()
    redis_key = f"email-code:{email}"
    await redis.set(redis_key, code, ex=600)
    try:
        delivered = await mailer.send_code(request.app.state.settings, email, code)
    except Exception:
        await redis.delete(redis_key)
        raise
    if not delivered:
        await redis.delete(redis_key)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Не удалось отправить код. Попробуйте ещё раз позже",
        )


@router.post("/email/verify", response_model=TokenResponse)
@limiter.limit("5/minute")
async def email_verify(payload: EmailVerifyRequest, request: Request, response: Response) -> TokenResponse:
    email = payload.email.lower()
    redis: Redis = request.app.state.redis
    expected = await redis.get(f"email-code:{email}")
    if expected is None or not hmac.compare_digest(expected.decode() if isinstance(expected, bytes) else expected, payload.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный или истёкший код")
    await redis.delete(f"email-code:{email}")
    session: AsyncSession = request.state.db
    user = await session.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, email_verified=True, name="")
        session.add(user)
    else:
        user.email_verified = True
    await session.commit(); await session.refresh(user)
    return tokens_response(user, request, response)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: Request, response: Response) -> TokenResponse:
    token = request.cookies.get("refresh_token")
    try:
        payload = jwt.decode(token, request.app.state.settings.jwt_secret, algorithms=[request.app.state.settings.jwt_algorithm])
        if payload.get("type") != "refresh": raise jwt.InvalidTokenError
        user = await request.state.db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, TypeError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Недействительный токен") from None
    if user is None: raise HTTPException(status_code=401, detail="Недействительный токен")
    return tokens_response(user, request, response)
