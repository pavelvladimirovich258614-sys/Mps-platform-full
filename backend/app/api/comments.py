import nh3
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db, require_role
from app.models.comment import Comment, comment_reactions
from app.models.notification import Notification
from app.models.post import Post
from app.models.review import ModerationStatus
from app.models.user import Role, User
from app.schemas.moderation import CommentCreate, ModerateRequest, ModerationAction, ReactionCreate

router = APIRouter(tags=["comments"])


def comment_dto(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "parent_id": comment.parent_id,
        "body": comment.body,
        "status": comment.status.value,
    }


async def pending_comments_count(session: AsyncSession) -> int:
    return await session.scalar(select(func.count()).select_from(Comment).where(Comment.status == ModerationStatus.PENDING)) or 0


@router.get("/posts/{post_id}/comments")
async def list_comments(post_id: int, session: AsyncSession = Depends(get_db)):
    comments = (await session.scalars(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.status == ModerationStatus.APPROVED)
        .order_by(Comment.id)
    )).all()
    return [comment_dto(comment) for comment in comments]


@router.post("/posts/{post_id}/comments", status_code=201)
async def create_comment(
    post_id: int,
    payload: CommentCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if await session.get(Post, post_id) is None:
        raise HTTPException(404, "Публикация не найдена")
    if payload.parent_id is not None:
        parent = await session.get(Comment, payload.parent_id)
        if parent is None or parent.post_id != post_id:
            raise HTTPException(404, "Родительский комментарий не найден")
        if parent.parent_id is not None:
            raise HTTPException(422, "Разрешён только один уровень ответов")
    comment = Comment(post_id=post_id, user_id=user.id, parent_id=payload.parent_id, body=nh3.clean(payload.body))
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment_dto(comment)


@router.post("/comments/{comment_id}/react")
async def react_to_comment(
    comment_id: int,
    payload: ReactionCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    comment = await session.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(404, "Комментарий не найден")
    if comment.status != ModerationStatus.APPROVED:
        raise HTTPException(422, "Реакцию можно поставить только на одобренный комментарий")
    exists = await session.scalar(
        select(comment_reactions.c.comment_id).where(
            comment_reactions.c.comment_id == comment_id,
            comment_reactions.c.user_id == user.id,
        )
    )
    if exists is None:
        await session.execute(comment_reactions.insert().values(comment_id=comment_id, user_id=user.id, emoji=payload.emoji))
    else:
        await session.execute(
            update(comment_reactions)
            .where(comment_reactions.c.comment_id == comment_id, comment_reactions.c.user_id == user.id)
            .values(emoji=payload.emoji)
        )
    await session.commit()
    return {"comment_id": comment_id, "emoji": payload.emoji}


@router.patch("/comments/{comment_id}/moderate")
async def moderate_comment(
    comment_id: int,
    payload: ModerateRequest,
    session: AsyncSession = Depends(get_db),
    editor: User = Depends(require_role(Role.EDITOR)),
):
    comment = await session.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(404, "Комментарий не найден")
    comment.status = ModerationStatus.APPROVED if payload.action == ModerationAction.APPROVE else ModerationStatus.REJECTED
    if comment.status == ModerationStatus.APPROVED:
        session.add(Notification(user_id=comment.user_id, type="comment_approved", payload={"comment_id": comment.id}))
    await session.commit()
    await session.refresh(comment)
    return {"comment": comment_dto(comment), "pending_count": await pending_comments_count(session)}
