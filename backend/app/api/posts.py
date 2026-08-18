import re, secrets
from datetime import UTC, datetime
import nh3
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user, get_db, require_role
from app.models.post import Post, PostStatus, PostType, post_likes
from app.models.user import Role, User
from app.schemas.post import PostPatch, PostWrite

router=APIRouter(prefix="/posts",tags=["posts"])
def slugify(title:str)->str:
    value=title.lower()
    for source,target in {"щ":"shch","ш":"sh","ч":"ch","ц":"ts","х":"kh","ж":"zh","ю":"yu","я":"ya","ё":"yo","ъ":"","ь":""}.items(): value=value.replace(source,target)
    value=value.translate(str.maketrans({"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","ы":"y","э":"e"})); value=re.sub(r"[^a-z0-9]+","-",value).strip("-")
    return value or "post"
async def unique_slug(session,title):
    base=slugify(title); slug=base
    while await session.scalar(select(Post.id).where(Post.slug==slug)): slug=f"{base}-{secrets.token_hex(3)}"
    return slug
def dto(p): return {"id":p.id,"type":p.type.value,"title":p.title,"slug":p.slug,"body":p.body,"views":p.views,"likes_count":p.likes_count,"shot_at":p.shot_at.isoformat() if p.shot_at else None}

@router.get("")
async def list_posts(type:PostType|None=None,country:int|None=None,page:int=1,session:AsyncSession=Depends(get_db)):
    q=select(Post).where(Post.status==PostStatus.PUBLISHED)
    if type:q=q.where(Post.type==type)
    if country:q=q.where(Post.country_id==country)
    rows=(await session.scalars(q.offset((max(page,1)-1)*20).limit(20))).all(); return [dto(x) for x in rows]
@router.get("/{slug}")
async def get_post(slug:str,session:AsyncSession=Depends(get_db)):
    post=await session.scalar(select(Post).where(Post.slug==slug,Post.status==PostStatus.PUBLISHED))
    if not post: raise HTTPException(404,"Публикация не найдена")
    post.views+=1; await session.commit(); await session.refresh(post); return dto(post)
@router.post("",status_code=201)
async def create(payload:PostWrite,session:AsyncSession=Depends(get_db),user:User=Depends(require_role(Role.EDITOR))):
    values = payload.model_dump()
    values["body"] = nh3.clean(payload.body)
    post=Post(**values,slug=await unique_slug(session,payload.title),author_id=user.id,published_at=datetime.now(UTC) if payload.status==PostStatus.PUBLISHED else None);session.add(post);await session.commit();await session.refresh(post);return dto(post)
@router.post("/{post_id}/like")
async def like(post_id:int,session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
    exists=await session.scalar(select(post_likes.c.post_id).where(post_likes.c.post_id==post_id,post_likes.c.user_id==user.id)); post=await session.get(Post,post_id)
    if not post: raise HTTPException(404,"Публикация не найдена")
    if exists: await session.execute(delete(post_likes).where(post_likes.c.post_id==post_id,post_likes.c.user_id==user.id));post.likes_count-=1
    else: await session.execute(post_likes.insert().values(post_id=post_id,user_id=user.id));post.likes_count+=1
    await session.commit();return {"likes_count":post.likes_count}

@router.patch("/{post_id}")
async def patch(post_id:int,payload:PostPatch,session:AsyncSession=Depends(get_db),_:User=Depends(require_role(Role.EDITOR))):
    post=await session.get(Post,post_id)
    if not post: raise HTTPException(404,"Публикация не найдена")
    changes = payload.model_dump(exclude_unset=True)
    post_type = changes.get("type", post.type)
    shot_at = changes.get("shot_at", post.shot_at)
    if post_type == PostType.VIDEO_REVIEW and shot_at is None:
        raise HTTPException(422, "Для видеообзора обязательна дата съёмки")
    for key,value in changes.items(): setattr(post,key,nh3.clean(value) if key=="body" else value)
    await session.commit();await session.refresh(post);return dto(post)
@router.delete("/{post_id}",status_code=204)
async def remove(post_id:int,session:AsyncSession=Depends(get_db),_:User=Depends(require_role(Role.EDITOR))):
    post=await session.get(Post,post_id)
    if not post: raise HTTPException(404,"Публикация не найдена")
    await session.delete(post);await session.commit()
