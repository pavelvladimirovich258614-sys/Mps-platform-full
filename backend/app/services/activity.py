from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import ActivityEventType, ActivityLog


def record_activity(
    session: AsyncSession,
    *,
    user_id: int,
    event_type: ActivityEventType,
    reference_id: int,
) -> None:
    session.add(
        ActivityLog(
            user_id=user_id,
            event_type=event_type,
            reference_id=reference_id,
        )
    )


async def remove_activity(
    session: AsyncSession,
    *,
    user_id: int,
    event_type: ActivityEventType,
    reference_id: int,
) -> None:
    await session.execute(
        delete(ActivityLog).where(
            ActivityLog.user_id == user_id,
            ActivityLog.event_type == event_type,
            ActivityLog.reference_id == reference_id,
        )
    )
