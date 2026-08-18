from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.config import Settings, get_settings
from app.db import Database


def create_app(settings: Settings | None = None) -> FastAPI:
    """Create the configured FastAPI application."""

    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        yield
        await application.state.database.dispose()

    app = FastAPI(title="Мир под солнцем", version="0.1.0", lifespan=lifespan)
    app.state.database = Database(app_settings)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(health_router, prefix="/api/v1")
    return app


app = create_app()
