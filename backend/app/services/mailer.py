import logging
from datetime import UTC, datetime, timedelta
import httpx
from sqlalchemy import select
from app.models.post import Post, PostStatus
logger=logging.getLogger(__name__)
async def send_email(settings,email,subject,html):
 if not settings.unisender_go_api_key: logger.error("Unisender key is not configured"); return False
 payload={"message":{"recipients":[{"email":email}],"body":{"html":html},"subject":subject,"from_email":settings.unisender_from_email}}
 try:
  async with httpx.AsyncClient() as client:
   response=await client.post(f"{settings.unisender_go_base_url.rstrip('/')}/email/send.json",headers={"Authorization":f"Bearer {settings.unisender_go_api_key}"},json=payload);response.raise_for_status()
  return True
 except httpx.HTTPError: logger.exception("Unisender delivery failed for %s",email);return False
async def send_code(email,code): logger.info("Запрошена отправка кода подтверждения на %s",email)
async def send_confirm(settings,email,token): return await send_email(settings,email,"Подтвердите подписку",f'<a href="{settings.base_url}/subscribe/confirm/{token}">confirm</a>')
async def build_digest(session_factory,days=7):
 async with session_factory() as s: posts=(await s.scalars(select(Post).where(Post.status==PostStatus.PUBLISHED,Post.published_at>=datetime.now(UTC)-timedelta(days=days)))).all()
 return "<h1>Новые публикации</h1>"+"".join(f"<h2>{p.title}</h2><p>{p.excerpt}</p>" for p in posts)
