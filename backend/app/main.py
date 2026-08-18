from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import jwt
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.rate_limit import limiter

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.profile import router as profile_router
from app.api.posts import router as posts_router
from app.api.media import router as media_router
from app.api.comments import router as comments_router
from app.api.reviews import reviews_router, router as internal_router
from app.api.subscribe import router as subscribe_router
from app.api.qa import router as qa_router
from app.api.forum import router as forum_router
from app.api.admin import router as admin_router
from app.config import Settings, get_settings
from app.db import Database
from app.models.user import User
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.irishka import run as run_irishka


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create the configured FastAPI application."""

    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        scheduler=AsyncIOScheduler();scheduler.add_job(run_irishka,"interval",minutes=5,args=[application.state.database.session_factory,app_settings]);scheduler.start()
        yield
        scheduler.shutdown(wait=False)
        await application.state.database.dispose()

    app = FastAPI(title="Мир под солнцем", version="0.1.0", lifespan=lifespan)
    app.state.database = Database(app_settings)
    app.state.settings = app_settings
    app.state.redis = Redis.from_url(app_settings.redis_url, decode_responses=False)
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.middleware("http")
    async def database_session(request, call_next):
        async with app.state.database.session_factory() as session:
            request.state.db = session
            authorization = request.headers.get("Authorization", "")
            if authorization.startswith("Bearer "):
                try:
                    payload = jwt.decode(
                        authorization.removeprefix("Bearer "),
                        app_settings.jwt_secret,
                        algorithms=[app_settings.jwt_algorithm],
                    )
                    if payload.get("type") == "access":
                        user = await session.get(User, int(payload["sub"]))
                        if user is not None and not user.is_banned:
                            user.last_seen_at = datetime.now(UTC)
                            await session.commit()
                except (jwt.PyJWTError, KeyError, ValueError):
                    authorization = ""
            response = await call_next(request)
        return response
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(health_router, prefix="/api/v1")
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(profile_router, prefix="/api/v1")
    app.include_router(posts_router, prefix="/api/v1")
    app.include_router(media_router, prefix="/api/v1")
    app.include_router(comments_router, prefix="/api/v1")
    app.include_router(reviews_router, prefix="/api/v1")
    app.include_router(internal_router, prefix="/api/v1")
    app.include_router(subscribe_router, prefix="/api/v1")
    app.include_router(qa_router, prefix="/api/v1")
    app.include_router(forum_router, prefix="/api/v1")
    app.include_router(admin_router, prefix="/api/v1")
    return app


app = create_app()
