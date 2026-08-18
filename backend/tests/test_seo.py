from datetime import UTC, datetime

import httpx
import pytest

from app.models.post import Country, Post, PostStatus, PostType
from app.models.user import User


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as value:
        yield value


async def test_sitemap_robots_and_bot_post_metadata(client, test_app, tmp_path):
    test_app.state.settings.base_url = "https://example.test"
    test_app.state.settings.frontend_dist_dir = str(tmp_path)
    (tmp_path / "index.html").write_text("<div id='root'></div>", encoding="utf-8")
    async with test_app.state.database.session_factory() as session:
        author = User(email="editor@example.test", name="Редактор")
        country = Country(name="ОАЭ", flag_emoji="🇦🇪", sort_order=1)
        session.add_all([author, country])
        await session.flush()
        session.add(Post(type=PostType.ARTICLE, title="Тестовая публикация", slug="test-post", cover_url="https://example.test/cover.jpg", body="Описание публикации", excerpt="Короткое описание", author_id=author.id, status=PostStatus.PUBLISHED, published_at=datetime.now(UTC)))
        await session.commit()
    assert "https://example.test/posts/test-post" in (await client.get("/sitemap.xml")).text
    assert "Sitemap: https://example.test/sitemap.xml" in (await client.get("/robots.txt")).text
    bot = await client.get("/posts/test-post", headers={"User-Agent": "Googlebot"})
    assert bot.status_code == 200 and 'property="og:title" content="Тестовая публикация"' in bot.text and '"@type": "Article"' in bot.text
    assert (await client.get("/posts/test-post", headers={"User-Agent": "Mozilla/5.0"})).text == "<div id='root'></div>"


async def test_unknown_post_loads_spa_for_browser_but_is_not_prerendered(client, test_app, tmp_path):
    test_app.state.settings.frontend_dist_dir = str(tmp_path)
    (tmp_path / "index.html").write_text("<div id='root'></div>", encoding="utf-8")

    browser = await client.get("/posts/missing", headers={"User-Agent": "Mozilla/5.0"})
    assert browser.status_code == 200
    assert browser.text == "<div id='root'></div>"

    bot = await client.get("/posts/missing", headers={"User-Agent": "Googlebot"})
    assert bot.status_code == 404
