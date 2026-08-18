from collections.abc import AsyncIterator

import pytest_asyncio
import fakeredis.aioredis
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import Settings
from app.db import Base
from app.main import create_app
from app.rate_limit import limiter


@pytest_asyncio.fixture
async def test_app(tmp_path) -> AsyncIterator[FastAPI]:
    limiter.reset()
    database_path = tmp_path / "test.sqlite3"
    settings = Settings(database_url=f"sqlite+aiosqlite:///{database_path}", jwt_secret="test-secret-key-with-32-characters", bot_token="test-bot-token", bot_bridge_secret="bridge-secret", unisender_go_api_key="key", unisender_from_email="noreply@example.com", media_dir=str(tmp_path / "media"))
    application = create_app(settings)
    application.state.redis = fakeredis.aioredis.FakeRedis(decode_responses=False)
    engine: AsyncEngine = application.state.database.engine

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    yield application

    await application.state.database.dispose()
    await application.state.redis.aclose()
