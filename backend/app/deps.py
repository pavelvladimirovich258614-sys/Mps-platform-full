from collections.abc import AsyncIterator

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Database


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    """Provide a request-scoped database session."""

    database: Database = request.app.state.database
    async for session in database.session():
        yield session
