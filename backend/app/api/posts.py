import re, secrets
from datetime import UTC, datetime
import nh3
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user, get_db, require_role
from app.models.post import Post, PostStatus, PostType, post_likes
from app.models.activity import ActivityEventType
from app.models.setting import Setting
from app.models.user import Role, User
from app.schemas.moderation import ModerateRequest, ModerationAction
from app.schemas.post import PostPatch, PostWrite
from app.services.activity import record_activity, remove_activity

router=APIRouter(prefix="/posts",tags=["posts"])
POST_BODY_TAGS = {"p", "br", "strong", "em", "s", "h1", "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img", "figure"}
POST_BODY_ATTRIBUTES = {"a": {"href"}, "img": {"src", "alt"}, "figure": {"data-carousel"}}

def clean_post_body(body: str) -> str:
    return nh3.clean(body, tags=POST_BODY_TAGS, attributes=POST_BODY_ATTRIBUTES)

def slugify(title:str)->str:
    value=title.lower()
    for source,target in {"щ":"shch","ш":"sh","ч":"ch","ц":"ts","х":"kh","ж":"zh","ю":"yu","я":"ya","ё":"yo","ъ":"","ь":""}.items(): value=value.replace(source,target)
    value=value.translate(str.maketrans({"а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","ы":"y","э":"e"})); value=re.sub(r"[^a-z0-9]+","-",value).strip("-")
    return value or "post"
async def unique_slug(session,title):
    base=slugify(title); slug=base
    while await session.scalar(select(Post.id).where(Post.slug==slug)): slug=f"{base}-{secrets.token_hex(3)}"
    return slug
def dto(p, author: User): return {"id":p.id,"type":p.type.value,"title":p.title,"slug":p.slug,"body":p.body,"emoji":p.emoji,"category":p.category,"status":p.status.value,"published_at":p.published_at.isoformat() if p.published_at else None,"cover_url":p.cover_url,"views":p.views,"likes_count":p.likes_count,"shot_at":p.shot_at.isoformat() if p.shot_at else None,"author":{"id":author.id,"name":author.name,"avatar_url":author.avatar_url}}
def draft_summary_dto(p: Post): return {"id":p.id,"title":p.title,"updated_at":p.updated_at.isoformat()}
def draft_dto(p: Post, author: User): return {**dto(p, author), "status":p.status.value, "updated_at":p.updated_at.isoformat()}

def can_manage_posts(user: User) -> bool:
    return user.role in (Role.EDITOR, Role.ADMIN)

async def fishka_submissions_enabled(session: AsyncSession) -> bool:
    value = await session.scalar(select(Setting.value).where(Setting.key == "fishka_submissions_enabled"))
    return value is not None and value.strip().lower() == "true"

@router.get("")
async def list_posts(type:PostType|None=None,country:int|None=None,author_id:int|None=None,category:str|None=None,page:int=1,session:AsyncSession=Depends(get_db)):
    q=select(Post, User).join(User, User.id == Post.author_id).where(Post.status==PostStatus.PUBLISHED)
    if type:q=q.where(Post.type==type)
    elif author_id is None:q=q.where(Post.type.in_((PostType.ARTICLE, PostType.VIDEO_REVIEW)))
    if country:q=q.where(Post.country_id==country)
    if author_id:q=q.where(Post.author_id==author_id)
    if category:q=q.where(Post.category==category)
    rows=(await session.execute(q.offset((max(page,1)-1)*20).limit(20))).all(); return [dto(post, author) for post, author in rows]
@router.get("/drafts")
async def list_drafts(session:AsyncSession=Depends(get_db),user:User=Depends(require_role(Role.EDITOR))):
    drafts = (await session.scalars(select(Post).where(Post.author_id==user.id, Post.status==PostStatus.DRAFT).order_by(Post.updated_at.desc(), Post.id.desc()))).all()
    return [draft_summary_dto(post) for post in drafts]
@router.get("/drafts/{post_id}")
async def get_draft(post_id:int,session:AsyncSession=Depends(get_db),user:User=Depends(require_role(Role.EDITOR))):
    post = await session.scalar(select(Post).where(Post.id==post_id, Post.author_id==user.id, Post.status==PostStatus.DRAFT))
    if not post: raise HTTPException(404,"Черновик не найден")
    author = await session.get(User, post.author_id)
    return draft_dto(post, author)
@router.get("/fishki/permission")
async def fishka_permission(session: AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
    return {"can_submit_fishka": can_manage_posts(user) or await fishka_submissions_enabled(session)}
@router.get("/fishki/categories")
async def fishka_categories(session: AsyncSession=Depends(get_db)):
    categories = await session.scalars(
        select(Post.category)
        .where(
            Post.type == PostType.FISHKA,
            Post.status == PostStatus.PUBLISHED,
            Post.category.is_not(None),
        )
        .group_by(Post.category)
        .order_by(func.min(Post.id))
    )
    return list(categories)
@router.get("/{slug}")
async def get_post(slug:str,session:AsyncSession=Depends(get_db)):
    row=await session.execute(select(Post, User).join(User, User.id == Post.author_id).where(Post.slug==slug,Post.status==PostStatus.PUBLISHED))
    post, author = row.one_or_none() or (None, None)
    if not post: raise HTTPException(404,"Публикация не найдена")
    post.views+=1; await session.commit(); await session.refresh(post); return dto(post, author)
@router.post("",status_code=201)
async def create(payload:PostWrite,session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
    is_staff = can_manage_posts(user)
    if not is_staff:
        if payload.type != PostType.FISHKA:
            raise HTTPException(403, "Обычным пользователям доступна только отправка фишек")
        if not await fishka_submissions_enabled(session):
            raise HTTPException(403, "Добавление фишек временно отключено администратором")
    values = payload.model_dump()
    values["body"] = clean_post_body(payload.body)
    if not is_staff:
        values["status"] = PostStatus.PENDING
    post=Post(**values,slug=await unique_slug(session,payload.title),author_id=user.id,published_at=datetime.now(UTC) if payload.status==PostStatus.PUBLISHED else None)
    if post.status != PostStatus.PUBLISHED:
        post.published_at = None
    session.add(post)
    await session.flush()
    if post.status == PostStatus.PUBLISHED:
        record_activity(session, user_id=post.author_id, event_type=ActivityEventType.POST_PUBLISHED, reference_id=post.id)
    await session.commit();await session.refresh(post);return dto(post,user)
@router.patch("/{post_id}/moderate")
async def moderate(post_id:int,payload:ModerateRequest,session:AsyncSession=Depends(get_db),editor:User=Depends(require_role(Role.EDITOR))):
    post = await session.get(Post, post_id)
    if post is None or post.type != PostType.FISHKA or post.status != PostStatus.PENDING:
        raise HTTPException(404, "Фишка на модерации не найдена")
    if payload.action == ModerationAction.APPROVE:
        post.status = PostStatus.PUBLISHED
        post.published_at = datetime.now(UTC)
        record_activity(session, user_id=post.author_id, event_type=ActivityEventType.POST_PUBLISHED, reference_id=post.id)
    else:
        post.status = PostStatus.REJECTED
    await session.commit(); await session.refresh(post)
    author = await session.get(User, post.author_id)
    return dto(post, author)
@router.post("/{post_id}/like")
async def like(post_id:int,session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
    exists=await session.scalar(select(post_likes.c.post_id).where(post_likes.c.post_id==post_id,post_likes.c.user_id==user.id)); post=await session.get(Post,post_id)
    if not post: raise HTTPException(404,"Публикация не найдена")
    if exists:
        await session.execute(delete(post_likes).where(post_likes.c.post_id==post_id,post_likes.c.user_id==user.id));post.likes_count-=1
        await remove_activity(session, user_id=user.id, event_type=ActivityEventType.POST_LIKED, reference_id=post_id)
    else:
        await session.execute(post_likes.insert().values(post_id=post_id,user_id=user.id));post.likes_count+=1
        record_activity(session, user_id=user.id, event_type=ActivityEventType.POST_LIKED, reference_id=post_id)
    await session.commit();return {"likes_count":post.likes_count}

@router.patch("/{post_id}")
async def patch(post_id:int,payload:PostPatch,session:AsyncSession=Depends(get_db),user:User=Depends(require_role(Role.EDITOR))):
    post=await session.get(Post,post_id)
    if not post: raise HTTPException(404,"Публикация не найдена")
    if post.status==PostStatus.DRAFT and post.author_id!=user.id: raise HTTPException(404,"Черновик не найден")
    changes = payload.model_dump(exclude_unset=True)
    post_type = changes.get("type", post.type)
    shot_at = changes.get("shot_at", post.shot_at)
    if post_type == PostType.VIDEO_REVIEW and shot_at is None:
        raise HTTPException(422, "Для видеообзора обязательна дата съёмки")
    was_draft = post.status == PostStatus.DRAFT
    for key,value in changes.items(): setattr(post,key,clean_post_body(value) if key=="body" else value)
    if was_draft and post.status == PostStatus.PUBLISHED:
        post.published_at = datetime.now(UTC)
        record_activity(session, user_id=post.author_id, event_type=ActivityEventType.POST_PUBLISHED, reference_id=post.id)
    await session.commit();await session.refresh(post);author=await session.get(User,post.author_id);return draft_dto(post,author)
@router.delete("/{post_id}",status_code=204)
async def remove(post_id:int,session:AsyncSession=Depends(get_db),user:User=Depends(require_role(Role.EDITOR))):
    post=await session.get(Post,post_id)
    if not post: raise HTTPException(404,"Публикация не найдена")
    if post.status==PostStatus.DRAFT and post.author_id!=user.id: raise HTTPException(404,"Черновик не найден")
    await session.delete(post);await session.commit()
