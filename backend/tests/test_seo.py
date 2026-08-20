from datetime import UTC, datetime
import json
import re

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


async def test_json_ld_escapes_html_significant_characters(client, test_app):
    title = "</script><script>window.__injected = true</script> & >"
    excerpt = "Описание </script><script>window.__injected = true</script> & >"
    async with test_app.state.database.session_factory() as session:
        author = User(email="editor@example.test", name="Редактор")
        session.add(author)
        await session.flush()
        session.add(Post(type=PostType.ARTICLE, title=title, slug="unsafe-json-ld", body="Текст", excerpt=excerpt, author_id=author.id, status=PostStatus.PUBLISHED, published_at=datetime.now(UTC)))
        await session.commit()

    response = await client.get("/posts/unsafe-json-ld", headers={"User-Agent": "Googlebot"})

    assert response.status_code == 200
    assert "</script><script>window.__injected = true</script>" not in response.text
    assert r"\u003c/script\u003e" in response.text
    assert r"\u0026" in response.text
    assert r"\u003e" in response.text
    match = re.search(r'<script type="application/ld\+json">(.*?)</script>', response.text)
    assert match is not None
    article = json.loads(match.group(1))
    assert article["headline"] == title
    assert article["description"] == excerpt
