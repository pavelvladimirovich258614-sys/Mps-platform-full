import httpx
from sqlalchemy import select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from app.models.user import Role, User


async def test_role_enum_reads_lowercase_database_value_through_orm_and_profile(test_app) -> None:
    """Production stores Role.value strings; loading them must not use Enum member names."""

    async with test_app.state.database.session_factory() as session:
        await session.execute(
            text(
                "INSERT INTO users (email, email_verified, name, role, is_anonymous, is_banned) "
                "VALUES (:email, :verified, :name, :role, :anonymous, :banned)"
            ),
            {
                "email": "lowercase-editor@example.test",
                "verified": True,
                "name": "Редактор",
                "role": "editor",
                "anonymous": False,
                "banned": False,
            },
        )
        await session.commit()

    async with test_app.state.database.session_factory() as session:
        user = await session.scalar(select(User).where(User.email == "lowercase-editor@example.test"))

    assert user is not None
    assert user.role is Role.EDITOR

    role_type = User.__table__.c.role.type
    assert role_type.native_enum is False
    assert role_type.enums == ["reader", "premium", "editor", "admin"]
    assert "VARCHAR" in str(CreateTable(User.__table__).compile(dialect=postgresql.dialect()))

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as client:
        profile = await client.get(f"/api/v1/users/{user.id}/profile")

    assert profile.status_code == 200
    assert profile.json()["name"] == "Редактор"
