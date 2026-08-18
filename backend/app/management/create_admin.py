"""Create or promote an administrator without embedding credentials in source."""

import argparse
import asyncio

from sqlalchemy import select

from app.config import get_settings
from app.db import Database
from app.models.user import Role, User


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Создать или повысить администратора МПС")
    identity = parser.add_mutually_exclusive_group()
    identity.add_argument("--email", help="Email существующего или нового администратора")
    identity.add_argument("--tg-id", type=int, help="Telegram ID существующего или нового администратора")
    parser.add_argument("--name", help="Отображаемое имя")
    return parser.parse_args()


async def create_admin(email: str | None, tg_id: int | None, name: str | None, database: Database | None = None) -> User:
    """Create or promote an admin selected by an email or Telegram identity."""
    if not email and tg_id is None:
        raise ValueError("Нужен --email или --tg-id")
    owns_database = database is None
    database = database or Database(get_settings())
    try:
        async with database.session_factory() as session:
            condition = User.email == email.lower() if email else User.tg_id == tg_id
            user = await session.scalar(select(User).where(condition))
            if user is None:
                user = User(email=email.lower() if email else None, tg_id=tg_id, name=name or "Администратор", role=Role.ADMIN, email_verified=bool(email))
                session.add(user)
            else:
                user.role = Role.ADMIN
                if name:
                    user.name = name
            await session.commit()
            await session.refresh(user)
            return user
    finally:
        if owns_database:
            await database.dispose()


async def main() -> None:
    args = arguments()
    email = args.email or input("Email администратора (оставьте пустым для Telegram ID): ").strip() or None
    tg_id = args.tg_id
    if email is None and tg_id is None:
        entered = input("Telegram ID администратора: ").strip()
        tg_id = int(entered) if entered else None
    name = args.name or input("Отображаемое имя (необязательно): ").strip() or None
    user = await create_admin(email, tg_id, name)
    print(f"Администратор готов: id={user.id}, role={user.role.value}")


if __name__ == "__main__":
    asyncio.run(main())
