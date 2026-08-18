from collections.abc import AsyncIterator

import pytest_asyncio
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import Settings
from app.db import Base
from app.main import create_app


@pytest_asyncio.fixture
async def test_app(tmp_path) -> AsyncIterator[FastAPI]:
    database_path = tmp_path / "test.sqlite3"
    settings = Settings(database_url=f"sqlite+aiosqlite:///{database_path}")
    application = create_app(settings)
    engine: AsyncEngine = application.state.database.engine

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    yield application

    await application.state.database.dispose()
