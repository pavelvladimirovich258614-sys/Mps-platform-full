from pathlib import Path

import pytest
from sqlalchemy import func, select

from app.management.import_fishki import import_fishki, parse_fishki_text
from app.models.activity import ActivityLog
from app.models.post import Post, PostStatus, PostType
from app.models.user import Role, User


SOURCE_PATH = Path(__file__).parents[1] / "app" / "data" / "fishki_160.txt"


def test_parser_reads_the_complete_bank_and_preserves_numbered_body_text():
    records = parse_fishki_text(SOURCE_PATH.read_text(encoding="utf-8"))

    assert len(records) == 160
    assert [record.number for record in records] == list(range(1, 161))
    assert len({record.category for record in records}) == 13
    assert records[0].category == "Трансфер и дорога в аэропорт"
    assert records[34].title == "Что делать, если паспорт потерян за границей"
    assert records[34].body.startswith("1) Полиция")
    assert records[81].body.startswith("1) «Бесплатные» экскурсии")
    assert records[99].body.startswith("1) Точное название отеля")
    assert records[124].body.startswith("1) Полиция")
    assert records[134].category == "Малоизвестные направления"
    assert records[159].category == "Реальные кейсы Сергея (главное)"


async def test_import_is_dry_run_safe_published_and_idempotent(test_app):
    async with test_app.state.database.session_factory() as session:
        author = User(tg_id=700, name="Павел", role=Role.ADMIN)
        session.add(author)
        await session.commit()
        await session.refresh(author)

    dry_run = await import_fishki(
        SOURCE_PATH,
        author_id=author.id,
        database=test_app.state.database,
        dry_run=True,
    )
    assert (dry_run.planned, dry_run.inserted, dry_run.unchanged) == (160, 0, 0)

    async with test_app.state.database.session_factory() as session:
        assert await session.scalar(select(func.count(Post.id))) == 0

    applied = await import_fishki(
        SOURCE_PATH,
        author_id=author.id,
        database=test_app.state.database,
        dry_run=False,
    )
    assert (applied.planned, applied.inserted, applied.unchanged) == (160, 160, 0)

    async with test_app.state.database.session_factory() as session:
        imported = (
            await session.scalars(select(Post).order_by(Post.id))
        ).all()
        assert len(imported) == 160
        assert imported[0].type == PostType.FISHKA
        assert imported[0].status == PostStatus.PUBLISHED
        assert imported[0].published_at is not None
        assert imported[0].author_id == author.id
        assert imported[0].category == "Трансфер и дорога в аэропорт"
        assert imported[34].body.startswith("<p>1) Полиция")
        assert await session.scalar(select(func.count(ActivityLog.id))) == 0

    repeated = await import_fishki(
        SOURCE_PATH,
        author_id=author.id,
        database=test_app.state.database,
        dry_run=False,
    )
    assert (repeated.planned, repeated.inserted, repeated.unchanged) == (160, 0, 160)


async def test_import_rejects_an_author_whose_visible_name_is_not_pavel(test_app):
    async with test_app.state.database.session_factory() as session:
        author = User(tg_id=701, name="Сергей", role=Role.ADMIN)
        session.add(author)
        await session.commit()
        await session.refresh(author)

    with pytest.raises(ValueError, match="Павел"):
        await import_fishki(
            SOURCE_PATH,
            author_id=author.id,
            database=test_app.state.database,
            dry_run=True,
        )
