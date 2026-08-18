"""Public crawl endpoints and bot-specific post prerendering."""

from html import escape
import json
from pathlib import Path

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
        raise HTTPException(404, "Публикация не найдена")
    if not is_bot(request):
        index = Path(request.app.state.settings.frontend_dist_dir) / "index.html"
        if index.is_file():
            return FileResponse(index)
        raise HTTPException(503, "Фронтенд ещё не собран")
    base_url = request.app.state.settings.base_url.rstrip("/")
    canonical = public_url(base_url, f"/posts/{post.slug}")
    description = (post.excerpt or post.body)[:300]
    image = post.cover_url or public_url(base_url, "/favicon.ico")
    article = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": post.title, "description": description, "mainEntityOfPage": canonical}, ensure_ascii=False)
    html = f"<!doctype html><html lang=\"ru\"><head><title>{escape(post.title)}</title><link rel=\"canonical\" href=\"{canonical}\"><meta property=\"og:title\" content=\"{escape(post.title, quote=True)}\"><meta property=\"og:description\" content=\"{escape(description, quote=True)}\"><meta property=\"og:url\" content=\"{canonical}\"><meta property=\"og:image\" content=\"{escape(image, quote=True)}\"><meta name=\"description\" content=\"{escape(description, quote=True)}\"><script type=\"application/ld+json\">{article}</script></head><body><h1>{escape(post.title)}</h1><p>{escape(description)}</p></body></html>"
    return Response(html, media_type="text/html")
