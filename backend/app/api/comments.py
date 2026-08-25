import nh3
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_current_user, get_db, get_optional_current_user, require_role
from app.models.comment import Comment, comment_reactions
from app.models.activity import ActivityEventType
from app.models.notification import Notification
from app.models.post import Post
from app.models.review import ModerationStatus
from app.models.setting import Setting
from app.models.user import Role, User
from app.schemas.moderation import CommentCreate, ModerateRequest, ModerationAction, ReactionCreate
from app.services.activity import record_activity

router = APIRouter(tags=["comments"])
REACTION_EMOJI = ("👍", "❤️", "🔥", "😂")


async def reaction_state(session: AsyncSession, comment_id: int, user_id: int | None) -> tuple[dict[str, int], str | None]:
    """Returns aggregate counts for supported emoji and the viewer's current reaction."""
    counts = dict.fromkeys(REACTION_EMOJI, 0)
    rows = await session.execute(
        select(comment_reactions.c.emoji, func.count())
        .where(comment_reactions.c.comment_id == comment_id)
        .group_by(comment_reactions.c.emoji)
    )
    for emoji, count in rows:
        if emoji in counts:
            counts[emoji] = count
    current = None
    if user_id is not None:
        current = await session.scalar(
            select(comment_reactions.c.emoji).where(
                comment_reactions.c.comment_id == comment_id,
                comment_reactions.c.user_id == user_id,
            )
        )
    return counts, current


async def comment_dto(session: AsyncSession, comment: Comment, viewer_id: int | None = None) -> dict:
    author = await session.get(User, comment.user_id)
    reactions, my_reaction = await reaction_state(session, comment.id, viewer_id)
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "parent_id": comment.parent_id,
        "body": comment.body,
        "status": comment.status.value,
        "author": {"id": author.id, "name": author.name, "avatar_url": author.avatar_url},
        "reactions": reactions,
        "my_reaction": my_reaction,
    }


async def pending_comments_count(session: AsyncSession) -> int:
    return await session.scalar(select(func.count()).select_from(Comment).where(Comment.status == ModerationStatus.PENDING)) or 0


async def comments_moderation_enabled(session: AsyncSession) -> bool:
    value = await session.scalar(select(Setting.value).where(Setting.key == "comments_moderation_enabled"))
    return value is not None and value.strip().lower() == "true"


@router.get("/posts/{post_id}/comments")
async def list_comments(
    post_id: int,
    session: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_current_user),
):
    comments = (await session.scalars(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.status == ModerationStatus.APPROVED)
        .order_by(Comment.id)
    )).all()
    return [await comment_dto(session, comment, user.id if user is not None else None) for comment in comments]


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
    status = ModerationStatus.PENDING if await comments_moderation_enabled(session) else ModerationStatus.APPROVED
    comment = Comment(post_id=post_id, user_id=user.id, parent_id=payload.parent_id, body=nh3.clean(payload.body), status=status)
    session.add(comment)
    await session.flush()
    record_activity(
        session,
        user_id=user.id,
        event_type=ActivityEventType.COMMENT_CREATED,
        reference_id=comment.id,
    )
    await session.commit()
    await session.refresh(comment)
    return await comment_dto(session, comment, user.id)


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
    if payload.emoji not in REACTION_EMOJI:
        raise HTTPException(422, "Поддерживаются реакции: 👍 ❤️ 🔥 😂")
    existing = await session.scalar(
        select(comment_reactions.c.emoji).where(
            comment_reactions.c.comment_id == comment_id,
            comment_reactions.c.user_id == user.id,
        )
    )
    if existing is None:
        await session.execute(comment_reactions.insert().values(comment_id=comment_id, user_id=user.id, emoji=payload.emoji))
    elif existing == payload.emoji:
        await session.execute(
            delete(comment_reactions).where(
                comment_reactions.c.comment_id == comment_id,
                comment_reactions.c.user_id == user.id,
            )
        )
    else:
        await session.execute(
            update(comment_reactions)
            .where(comment_reactions.c.comment_id == comment_id, comment_reactions.c.user_id == user.id)
            .values(emoji=payload.emoji)
        )
    await session.commit()
    reactions, my_reaction = await reaction_state(session, comment_id, user.id)
    return {"comment_id": comment_id, "my_reaction": my_reaction, "reactions": reactions}


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
    target_status = ModerationStatus.APPROVED if payload.action == ModerationAction.APPROVE else ModerationStatus.REJECTED
    if comment.status != ModerationStatus.PENDING:
        if comment.status != target_status:
            raise HTTPException(409, "Решение по комментарию уже принято")
        return {"comment": await comment_dto(session, comment), "pending_count": await pending_comments_count(session)}
    comment.status = target_status
    if comment.status == ModerationStatus.APPROVED:
        session.add(Notification(user_id=comment.user_id, type="comment_approved", payload={"comment_id": comment.id}))
    await session.commit()
    await session.refresh(comment)
    return {"comment": await comment_dto(session, comment), "pending_count": await pending_comments_count(session)}
