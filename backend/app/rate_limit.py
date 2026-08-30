import jwt
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)


def trusted_proxy_ip_key(request: Request) -> str:
    """Use nginx's overwritten X-Real-IP, falling back to the direct peer address."""

    real_ip = request.headers.get("X-Real-IP", "").strip()
    return f"ip:{real_ip or get_remote_address(request)}"


def forum_user_or_ip_key(request: Request) -> str:
    """Rate-limit forum writes by a verified access-token subject when available."""

    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        return f"ip:{get_remote_address(request)}"
    try:
        settings = request.app.state.settings
        payload = jwt.decode(
            authorization.removeprefix("Bearer "),
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != "access":
            raise jwt.InvalidTokenError
        return f"user:{int(payload['sub'])}"
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        return f"ip:{get_remote_address(request)}"
