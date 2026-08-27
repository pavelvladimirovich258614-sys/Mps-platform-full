"""Validate and import the approved 160-item fishka content bank."""

import argparse
import asyncio
import html
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select

from app.api.posts import slugify
from app.config import get_settings
from app.db import Database
from app.models.post import Post, PostStatus, PostType
from app.models.user import User


DEFAULT_SOURCE = Path(__file__).parents[1] / "data" / "fishki_160.txt"
BLOCK_RE = re.compile(r"^(?P<emoji>\S+)\s+Блок\s+(?P<number>\d+)\.\s+(?P<category>.+?)\s*$")
ENTRY_RE = re.compile(r"^(?P<number>\d+)\.\s+(?P<emoji>\S+)\s+(?P<title>.+?)\s*$")
CATEGORY_COUNT_SUFFIX_RE = re.compile(r"\s+—\s+\d+\s+фиш(?:ка|ки|ек)\s*$", re.IGNORECASE)


@dataclass(frozen=True)
class FishkaSourceRecord:
    number: int
    block_number: int
    emoji: str
    title: str
    body: str
    category: str


@dataclass(frozen=True)
class ImportResult:
    planned: int
    inserted: int
    unchanged: int


def parse_fishki_text(text: str) -> list[FishkaSourceRecord]:
    records: list[FishkaSourceRecord] = []
    current_block: tuple[int, str, str] | None = None
    current_entry: dict[str, object] | None = None

    def finish_entry() -> None:
        nonlocal current_entry
        if current_entry is None:
            return
        body = "\n".join(str(line).rstrip() for line in current_entry["body_lines"]).strip()
        if not body:
            raise ValueError(f"У фишки {current_entry['number']} отсутствует текст")
        records.append(
            FishkaSourceRecord(
                number=int(current_entry["number"]),
                block_number=int(current_entry["block_number"]),
                emoji=str(current_entry["emoji"]),
                title=str(current_entry["title"]),
                body=body,
                category=str(current_entry["category"]),
            )
        )
        current_entry = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        block_match = BLOCK_RE.match(line)
        if block_match:
            finish_entry()
            category = CATEGORY_COUNT_SUFFIX_RE.sub("", block_match.group("category")).strip()
            current_block = (
                int(block_match.group("number")),
                block_match.group("emoji"),
                category,
            )
            continue

        entry_match = ENTRY_RE.match(line) if current_block is not None else None
        if entry_match and entry_match.group("emoji") == current_block[1]:
            finish_entry()
            current_entry = {
                "number": int(entry_match.group("number")),
                "block_number": current_block[0],
                "emoji": entry_match.group("emoji"),
                "title": entry_match.group("title").strip(),
                "category": current_block[2],
                "body_lines": [],
            }
            continue

        if current_entry is not None:
            current_entry["body_lines"].append(raw_line)

    finish_entry()
    if not records:
        raise ValueError("В источнике не найдены фишки")
    expected_numbers = list(range(1, len(records) + 1))
    actual_numbers = [record.number for record in records]
    if actual_numbers != expected_numbers:
        raise ValueError("Нумерация фишек должна быть непрерывной и начинаться с 1")
    if len({record.title for record in records}) != len(records):
        raise ValueError("В источнике найдены повторяющиеся заголовки")
    return records


def validate_complete_bank(records: list[FishkaSourceRecord]) -> None:
    if len(records) != 160:
        raise ValueError(f"Ожидалось 160 фишек, найдено {len(records)}")
    blocks = {record.block_number for record in records}
    if blocks != set(range(1, 14)):
        raise ValueError("Ожидались блоки с 1 по 13")
    for record in records:
        if len(record.title) > 255:
            raise ValueError(f"Заголовок фишки {record.number} длиннее 255 символов")
        if len(record.category) > 120:
            raise ValueError(f"Категория фишки {record.number} длиннее 120 символов")


def as_fishka_html(value: str) -> str:
    paragraphs = re.split(r"\n\s*\n", value.strip())
    return "".join(
        f"<p>{html.escape(paragraph).replace(chr(10), '<br>')}</p>"
        for paragraph in paragraphs
    )


def import_slug(record: FishkaSourceRecord) -> str:
    return f"fishka-import-{record.number:03d}-{slugify(record.title)}"


def matches_source(post: Post, record: FishkaSourceRecord, author_id: int) -> bool:
    return (
        post.type == PostType.FISHKA
        and post.title == record.title
        and post.emoji == record.emoji
        and post.category == record.category
        and post.body == as_fishka_html(record.body)
        and post.author_id == author_id
        and post.status == PostStatus.PUBLISHED
    )


async def import_fishki(
    source: Path,
    *,
    author_id: int,
    database: Database | None = None,
    dry_run: bool,
) -> ImportResult:
    records = parse_fishki_text(source.read_text(encoding="utf-8"))
    validate_complete_bank(records)
    owns_database = database is None
    database = database or Database(get_settings())
    try:
        async with database.session_factory() as session:
            author = await session.get(User, author_id)
            if author is None or author.name.strip() != "Павел":
                raise ValueError("Автор импорта должен существовать и иметь имя «Павел»")

            slugs = [import_slug(record) for record in records]
            existing = (
                await session.scalars(select(Post).where(Post.slug.in_(slugs)))
            ).all()
            existing_by_slug = {post.slug: post for post in existing}
            unchanged = 0
            missing: list[tuple[FishkaSourceRecord, str]] = []
            for record, slug in zip(records, slugs, strict=True):
                post = existing_by_slug.get(slug)
                if post is None:
                    missing.append((record, slug))
                elif matches_source(post, record, author_id):
                    unchanged += 1
                else:
                    raise ValueError(f"Конфликт импортированной фишки со slug={slug}")

            if dry_run:
                return ImportResult(planned=len(records), inserted=0, unchanged=unchanged)

            published_at = datetime.now(UTC)
            for record, slug in missing:
                session.add(
                    Post(
                        type=PostType.FISHKA,
                        title=record.title,
                        emoji=record.emoji,
                        category=record.category,
                        slug=slug,
                        body=as_fishka_html(record.body),
                        excerpt="",
                        author_id=author_id,
                        status=PostStatus.PUBLISHED,
                        published_at=published_at,
                        views=0,
                        likes_count=0,
                        cta_enabled=True,
                        by_request=False,
                    )
                )
            await session.commit()
            return ImportResult(
                planned=len(records),
                inserted=len(missing),
                unchanged=unchanged,
            )
    finally:
        if owns_database:
            await database.dispose()


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Импортировать 160 опубликованных фишек")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--author-id", type=int, required=True)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--dry-run", action="store_true")
    action.add_argument("--apply", action="store_true")
    return parser.parse_args()


async def main() -> None:
    args = arguments()
    result = await import_fishki(
        args.source,
        author_id=args.author_id,
        dry_run=args.dry_run,
    )
    print(
        f"planned={result.planned} inserted={result.inserted} "
        f"unchanged={result.unchanged} dry_run={args.dry_run}"
    )


if __name__ == "__main__":
    asyncio.run(main())
