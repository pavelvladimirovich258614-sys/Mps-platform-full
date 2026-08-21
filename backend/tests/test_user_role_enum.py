import hashlib
import hmac
import time

import httpx
from sqlalchemy import select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable

from app.models.user import Role, User


def telegram_payload(user_id: int) -> dict:
    data = {"id": user_id, "first_name": "Павел", "auth_date": int(time.time())}
    check = "\n".join(f"{key}={data[key]}" for key in sorted(data))
    data["hash"] = hmac.new(
        hashlib.sha256(b"test-auth-bot-token").digest(),
        check.encode(),
        hashlib.sha256,
    ).hexdigest()
    return data


async def test_role_enum_reads_mixed_case_database_values_through_orm_and_telegram_auth(test_app) -> None:
    """Legacy enum names and current enum values must load together during the transition."""

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
        await session.execute(
            text(
                "INSERT INTO users (tg_id, name, role, is_anonymous, is_banned) "
                "VALUES (:tg_id, :name, :role, :anonymous, :banned)"
            ),
            {
                "tg_id": 4242,
                "name": "Legacy admin",
                "role": "ADMIN",
                "anonymous": False,
                "banned": False,
            },
        )
        await session.commit()

    async with test_app.state.database.session_factory() as session:
        editor = await session.scalar(select(User).where(User.email == "lowercase-editor@example.test"))
        admin = await session.scalar(select(User).where(User.tg_id == 4242))

    assert editor is not None
    assert editor.role is Role.EDITOR
    assert admin is not None
    assert admin.role is Role.ADMIN

    assert "VARCHAR" in str(CreateTable(User.__table__).compile(dialect=postgresql.dialect()))

    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as client:
        profile = await client.get(f"/api/v1/users/{editor.id}/profile")
        telegram_login = await client.post("/api/v1/auth/telegram", json=telegram_payload(4242))

    assert profile.status_code == 200
    assert profile.json()["name"] == "Редактор"
    assert telegram_login.status_code == 200
    assert telegram_login.json()["access_token"]


async def test_new_role_writes_use_canonical_lowercase_value(test_app) -> None:
    async with test_app.state.database.session_factory() as session:
        user = User(email="new-admin@example.test", name="Новый admin", role=Role.ADMIN)
        session.add(user)
        await session.flush()
        stored_role = await session.scalar(text("SELECT role FROM users WHERE id = :id"), {"id": user.id})

    assert stored_role == "admin"
