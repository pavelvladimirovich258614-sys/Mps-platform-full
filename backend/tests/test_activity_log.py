import httpx
import jwt
import pytest
from sqlalchemy import select

from app.models.activity import ActivityEventType, ActivityLog
from app.models.user import Role, User


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app), base_url="http://test"
    ) as value:
        yield value


def auth_headers(test_app, user: User) -> dict[str, str]:
    token = jwt.encode(
        {"sub": str(user.id), "type": "access"},
        test_app.state.settings.jwt_secret,
        algorithm=test_app.state.settings.jwt_algorithm,
    )
    return {"Authorization": f"Bearer {token}"}


async def activity_rows(test_app) -> list[ActivityLog]:
    async with test_app.state.database.session_factory() as session:
        return list((await session.scalars(select(ActivityLog).order_by(ActivityLog.id))).all())


async def create_editor(test_app) -> User:
    async with test_app.state.database.session_factory() as session:
        editor = User(email="activity-editor@example.test", name="Редактор", role=Role.EDITOR)
        session.add(editor)
        await session.commit()
        await session.refresh(editor)
        return editor


async def test_activity_logs_direct_and_draft_publications(client, test_app):
    editor = await create_editor(test_app)
    headers = auth_headers(test_app, editor)

    direct = await client.post(
        "/api/v1/posts",
        headers=headers,
        json={"type": "article", "title": "Сразу опубликована", "body": "Текст", "status": "published"},
    )
    draft = await client.post(
        "/api/v1/posts",
        headers=headers,
        json={"type": "article", "title": "Сначала черновик", "body": "Текст", "status": "draft"},
    )
    published = await client.patch(
        f"/api/v1/posts/{draft.json()['id']}", headers=headers, json={"status": "published"}
    )

    assert direct.status_code == 201
    assert draft.status_code == 201
    assert published.status_code == 200
    rows = await activity_rows(test_app)
    assert [(row.user_id, row.event_type, row.reference_id) for row in rows] == [
        (editor.id, ActivityEventType.POST_PUBLISHED, direct.json()["id"]),
        (editor.id, ActivityEventType.POST_PUBLISHED, draft.json()["id"]),
    ]


async def test_activity_logs_comment_creation(client, test_app):
    editor = await create_editor(test_app)
    reader = User(email="activity-reader@example.test", name="Читатель")
    async with test_app.state.database.session_factory() as session:
        session.add(reader)
        await session.commit()
        await session.refresh(reader)

    post = await client.post(
        "/api/v1/posts",
        headers=auth_headers(test_app, editor),
        json={"type": "article", "title": "Пост", "body": "Текст", "status": "published"},
    )
    comment = await client.post(
        f"/api/v1/posts/{post.json()['id']}/comments",
        headers=auth_headers(test_app, reader),
        json={"body": "Мой ответ"},
    )

    assert comment.status_code == 201
    rows = await activity_rows(test_app)
    assert (reader.id, ActivityEventType.COMMENT_CREATED, comment.json()["id"]) in [
        (row.user_id, row.event_type, row.reference_id) for row in rows
    ]


async def test_activity_removes_like_event_on_unlike(client, test_app):
    editor = await create_editor(test_app)
    reader = User(email="activity-like-reader@example.test", name="Любитель")
    async with test_app.state.database.session_factory() as session:
        session.add(reader)
        await session.commit()
        await session.refresh(reader)

    post = await client.post(
        "/api/v1/posts",
        headers=auth_headers(test_app, editor),
        json={"type": "article", "title": "Лайк", "body": "Текст", "status": "published"},
    )
    liked = await client.post(f"/api/v1/posts/{post.json()['id']}/like", headers=auth_headers(test_app, reader))

    assert liked.json() == {"likes_count": 1}
    rows = await activity_rows(test_app)
    assert (reader.id, ActivityEventType.POST_LIKED, post.json()["id"]) in [
        (row.user_id, row.event_type, row.reference_id) for row in rows
    ]

    unliked = await client.post(f"/api/v1/posts/{post.json()['id']}/like", headers=auth_headers(test_app, reader))

    assert unliked.json() == {"likes_count": 0}
    assert not any(
        row.user_id == reader.id
        and row.event_type == ActivityEventType.POST_LIKED
        and row.reference_id == post.json()["id"]
        for row in await activity_rows(test_app)
    )


async def test_activity_removes_follow_event_on_unfollow(client, test_app):
    follower = User(email="activity-follower@example.test", name="Подписчик")
    target = User(email="activity-target@example.test", name="Автор")
    async with test_app.state.database.session_factory() as session:
        session.add_all([follower, target])
        await session.commit()
        await session.refresh(follower)
        await session.refresh(target)

    followed = await client.post(f"/api/v1/users/{target.id}/follow", headers=auth_headers(test_app, follower))

    assert followed.status_code == 201
    rows = await activity_rows(test_app)
    assert (follower.id, ActivityEventType.USER_FOLLOWED, target.id) in [
        (row.user_id, row.event_type, row.reference_id) for row in rows
    ]

    unfollowed = await client.delete(f"/api/v1/users/{target.id}/follow", headers=auth_headers(test_app, follower))

    assert unfollowed.status_code == 200
    assert not any(
        row.user_id == follower.id
        and row.event_type == ActivityEventType.USER_FOLLOWED
        and row.reference_id == target.id
        for row in await activity_rows(test_app)
    )
