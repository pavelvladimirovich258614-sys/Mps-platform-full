"""Public crawl endpoints and post metadata injection for the SPA shell."""

from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urljoin

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.models.post import Country, Post, PostStatus

router = APIRouter(tags=["seo"])
BOT_MARKERS = ("googlebot", "yandexbot", "bingbot", "facebookexternalhit", "twitterbot", "telegrambot")


def is_bot(request: Request) -> bool:
    """Return whether the request user agent is a crawler requiring prerendered metadata."""
    user_agent = request.headers.get("user-agent", "").lower()
    return any(marker in user_agent for marker in BOT_MARKERS)


def public_url(base_url: str, path: str) -> str:
    return f"{base_url.rstrip('/')}{path}"


def json_ld(value: dict) -> str:
    """Serialize JSON-LD safely for embedding into an HTML script element."""
    return json.dumps(value, ensure_ascii=False).replace("&", "\\u0026").replace("<", "\\u003c").replace(">", "\\u003e")


class _PlainTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style"} and self.skip_depth:
            self.skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if not self.skip_depth:
            self.parts.append(data)


def plain_text(value: str) -> str:
    parser = _PlainTextParser()
    parser.feed(value)
    parser.close()
    return " ".join(" ".join(parser.parts).split())


def frontend_index(request: Request) -> Path:
    index = Path(request.app.state.settings.frontend_dist_dir) / "index.html"
    if not index.is_file():
        raise HTTPException(503, "Фронтенд ещё не собран")
    return index


def inject_post_metadata(index_html: str, *, title: str, description: str, canonical: str, image: str) -> str:
    safe_title = escape(title, quote=True)
    safe_description = escape(description, quote=True)
    safe_canonical = escape(canonical, quote=True)
    safe_image = escape(image, quote=True)
    article = json_ld({"@context": "https://schema.org", "@type": "Article", "headline": title, "description": description, "mainEntityOfPage": canonical, "image": image})
    metadata = "".join((
        f'<link rel="canonical" href="{safe_canonical}">',
        f'<meta name="description" content="{safe_description}">',
        '<meta property="og:type" content="article">',
        f'<meta property="og:title" content="{safe_title}">',
        f'<meta property="og:description" content="{safe_description}">',
        f'<meta property="og:url" content="{safe_canonical}">',
        f'<meta property="og:image" content="{safe_image}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<script type="application/ld+json">{article}</script>',
    ))
    title_tag = f"<title>{escape(title)}</title>"
    if re.search(r"<title(?:\s[^>]*)?>.*?</title>", index_html, flags=re.IGNORECASE | re.DOTALL):
        index_html = re.sub(r"<title(?:\s[^>]*)?>.*?</title>", lambda _match: title_tag, index_html, count=1, flags=re.IGNORECASE | re.DOTALL)
    else:
        metadata = f"{title_tag}{metadata}"
    if "</head>" not in index_html.lower():
        raise HTTPException(503, "Собранный frontend не содержит head")
    return re.sub(r"</head>", lambda _match: f"{metadata}</head>", index_html, count=1, flags=re.IGNORECASE)


@router.get("/robots.txt", include_in_schema=False)
async def robots(request: Request) -> Response:
    base_url = request.app.state.settings.base_url.rstrip("/")
    return Response(f"User-agent: *\nAllow: /\nSitemap: {base_url}/sitemap.xml\n", media_type="text/plain")


@router.get("/sitemap.xml", include_in_schema=False)
async def sitemap(request: Request, session: AsyncSession = Depends(get_db)) -> Response:
    base_url = request.app.state.settings.base_url.rstrip("/")
    posts = (await session.scalars(select(Post).where(Post.status == PostStatus.PUBLISHED))).all()
    countries = (await session.scalars(select(Country).where(Country.is_active.is_(True)))).all()
    paths = ["/", "/reviews", "/subscribe", "/about"]
    paths.extend(f"/posts/{post.slug}" for post in posts)
    paths.extend(f"/countries/{country.id}" for country in countries)
    urls = "".join(f"<url><loc>{escape(public_url(base_url, path))}</loc></url>" for path in paths)
    return Response(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>', media_type="application/xml")


@router.get("/posts/{slug}", include_in_schema=False)
async def post_page(slug: str, request: Request, session: AsyncSession = Depends(get_db)) -> Response:
    post = await session.scalar(select(Post).where(Post.slug == slug, Post.status == PostStatus.PUBLISHED))
    if post is None:
        if not is_bot(request):
            return FileResponse(frontend_index(request))
        raise HTTPException(404, "Публикация не найдена")
    base_url = request.app.state.settings.base_url.rstrip("/")
    canonical = public_url(base_url, f"/posts/{post.slug}")
    description = plain_text(post.excerpt or post.body)[:300]
    image = urljoin(f"{base_url}/", post.cover_url or "/favicon.ico")
    html = inject_post_metadata(frontend_index(request).read_text(encoding="utf-8"), title=post.title, description=description, canonical=canonical, image=image)
    return Response(html, media_type="text/html")
