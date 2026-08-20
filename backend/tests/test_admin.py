from datetime import UTC, datetime, timedelta

import httpx
import pytest
from sqlalchemy import select

from app.models.comment import Comment
from app.models.post import Post, PostStatus, PostType
from app.models.question import Question, QuestionStatus, QuestionTarget
from app.models.review import ModerationStatus, Review, ReviewSource
from app.models.subscription import Subscription
from app.models.user import Role, User
from app.services.tokens import create_access_token


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as value:
        yield value


async def make_user(test_app, email: str, role: Role = Role.READER, **values) -> User:
    async with test_app.state.database.session_factory() as session:
        user = User(email=email, name=email, role=role, **values)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user


def headers(test_app, user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user.id, test_app.state.settings)}"}


async def test_admin_stats_top_posts_and_access_control(client, test_app):
    now = datetime.now(UTC)
    admin = await make_user(test_app, "admin@example.com", Role.ADMIN)
    reader = await make_user(test_app, "reader@example.com", last_seen_at=now - timedelta(days=31))
    active = await make_user(test_app, "active@example.com", last_seen_at=now - timedelta(days=2), created_at=now - timedelta(days=2))
    recent = await make_user(test_app, "recent@example.com", created_at=now - timedelta(days=8))
    async with test_app.state.database.session_factory() as session:
        session.add_all([
            Subscription(email="yes@example.com", confirmed=True, confirm_token="a", unsub_token="b"),
            Subscription(email="no@example.com", confirmed=False, confirm_token="c", unsub_token="d"),
            Question(user_id=reader.id, target=QuestionTarget.MANAGER, body="Открыт", status=QuestionStatus.OPEN),
            Question(user_id=reader.id, target=QuestionTarget.MANAGER, body="Отвечен", status=QuestionStatus.ANSWERED),
            Review(user_id=reader.id, author_name="Анна", rating=5, body="На модерации", status=ModerationStatus.PENDING, source=ReviewSource.SITE),
        ])
        for index, views in enumerate([3, 100, 50, 75, 25, 60]):
            session.add(Post(type=PostType.ARTICLE, title=f"Пост {index}", slug=f"post-{index}", body="Текст", author_id=admin.id, status=PostStatus.PUBLISHED, views=views))
        await session.commit()

    assert (await client.get("/api/v1/admin/stats", headers=headers(test_app, reader))).status_code == 403
    response = await client.get("/api/v1/admin/stats", headers=headers(test_app, admin))
    assert response.status_code == 200
    data = response.json()
    assert data["users_total"] == 4
    # Авторизованные проверки доступа обновляют last_seen у reader и admin.
    assert data["users_active_30d"] == 3
    assert data["users_new_7d"] == 3
    assert data["users_new_30d"] == 4
    assert data["subscribers_confirmed"] == 1
    assert data["questions_open"] == 1
    assert data["questions_answered"] == 1
    assert data["reviews_pending"] == 1
    assert [post["views"] for post in data["top_posts"]] == [100, 75, 60, 50, 25]
    assert [post["title"] for post in data["top_posts"]] == ["Пост 1", "Пост 3", "Пост 5", "Пост 2", "Пост 4"]


async def test_admin_moderation_users_ban_and_settings(client, test_app):
    admin = await make_user(test_app, "admin@example.com", Role.ADMIN)
    author = await make_user(test_app, "author@example.com")
    async with test_app.state.database.session_factory() as session:
        post = Post(type=PostType.ARTICLE, title="Пост", slug="post", body="Текст", author_id=admin.id)
        session.add(post)
        await session.commit()
        await session.refresh(post)
        session.add_all([
            Review(user_id=author.id, author_name="Анна", rating=5, body="Отзыв", status=ModerationStatus.PENDING, source=ReviewSource.SITE),
            Comment(post_id=post.id, user_id=author.id, body="Комментарий", status=ModerationStatus.PENDING),
        ])
        await session.commit()

    queue = await client.get("/api/v1/admin/moderation/queue", headers=headers(test_app, admin))
    assert queue.status_code == 200
    assert {item["kind"] for item in queue.json()["items"]} == {"review", "comment"}
    users = await client.get("/api/v1/admin/users", headers=headers(test_app, admin))
    assert users.status_code == 200
    assert any(item["id"] == author.id for item in users.json()["items"])
    banned = await client.patch(f"/api/v1/admin/users/{author.id}", headers=headers(test_app, admin), json={"is_banned": True})
    assert banned.status_code == 200
    assert banned.json()["is_banned"] is True
    settings = await client.patch("/api/v1/admin/settings", headers=headers(test_app, admin), json={"cta_bot_url": "https://t.me/bot?start=platform", "cta_manager_url": "https://t.me/manager", "irishka_enabled": False, "irishka_delay_min": 45})
    assert settings.status_code == 200
    assert settings.json() == {"cta_bot_url": "https://t.me/bot?start=platform", "cta_manager_url": "https://t.me/manager", "irishka_enabled": "false", "irishka_delay_min": "45"}
    async with test_app.state.database.session_factory() as session:
        assert (await session.scalar(select(User.is_banned).where(User.id == author.id))) is True


async def test_public_settings_expose_only_configured_legal_contact_values(client, test_app):
    empty = await client.get("/api/v1/settings/public")
    assert empty.status_code == 200
    assert empty.json() == {
        "legal_name": None,
        "legal_inn": None,
        "contact_email": None,
        "contact_phone": None,
        "contact_address": None,
    }

    admin = await make_user(test_app, "admin-settings@example.test", role=Role.ADMIN)
    saved = await client.patch(
        "/api/v1/admin/settings",
        headers=headers(test_app, admin),
        json={
            "legal_name": "Тестовое агентство",
            "legal_inn": "123456789012",
            "contact_email": "contact@example.test",
            "contact_phone": "+7 000 000-00-00",
            "contact_address": "Тестовый адрес, 1",
            "cta_bot_url": "https://t.me/private_bot",
        },
    )
    assert saved.status_code == 200

    public = await client.get("/api/v1/settings/public")
    assert public.status_code == 200
    assert public.json() == {
        "legal_name": "Тестовое агентство",
        "legal_inn": "123456789012",
        "contact_email": "contact@example.test",
        "contact_phone": "+7 000 000-00-00",
        "contact_address": "Тестовый адрес, 1",
    }
    assert "cta_bot_url" not in public.json()
