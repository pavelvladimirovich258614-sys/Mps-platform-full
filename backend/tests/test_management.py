import pytest

from app.management.create_admin import create_admin
from app.models.user import Role


async def test_create_admin_creates_and_promotes_user(test_app):
    created = await create_admin("admin@example.test", None, "Павел", test_app.state.database)
    promoted = await create_admin("admin@example.test", None, "", test_app.state.database)
    assert created.id == promoted.id and promoted.role == Role.ADMIN and promoted.name == "Павел"


async def test_create_admin_requires_an_identity():
    with pytest.raises(ValueError, match="Нужен"):
        await create_admin(None, None, None)
