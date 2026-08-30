from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db, get_optional_current_user
from app.models.tour_request import TourRequest
from app.models.user import User
from app.rate_limit import limiter, trusted_proxy_ip_key
from app.schemas.tour_request import TourRequestCreate
from app.services import tg_relay


router = APIRouter(prefix="/tour-requests", tags=["tour-requests"])


def tour_request_message(tour_request: TourRequest) -> str:
    lines = [
        f"#T{tour_request.id}",
        "Новая заявка на подбор тура",
        f"Имя: {tour_request.name}",
        f"Контакт: {tour_request.contact}",
        f"Направление: {tour_request.destination}",
    ]
    if tour_request.budget:
        lines.append(f"Бюджет: {tour_request.budget}")
    if tour_request.comment:
        lines.append(f"Комментарий: {tour_request.comment}")
    lines.append("Согласие на обработку персональных данных: да")
    return "\n".join(lines)


def tour_request_dto(tour_request: TourRequest) -> dict:
    return {
        "id": tour_request.id,
        "status": tour_request.status.value,
        "tg_message_id": tour_request.tg_message_id,
        "created_at": tour_request.created_at.isoformat(),
    }


@router.post("", status_code=201)
@limiter.limit("5/minute", key_func=trusted_proxy_ip_key)
async def create_tour_request(
    payload: TourRequestCreate,
    request: Request,
    session: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_current_user),
):
    tour_request = TourRequest(
        user_id=user.id if user is not None else None,
        name=payload.name,
        contact=payload.contact,
        destination=payload.destination,
        budget=payload.budget,
        comment=payload.comment,
        personal_data_consent=payload.personal_data_consent,
    )
    session.add(tour_request)
    await session.commit()
    await session.refresh(tour_request)

    try:
        tour_request.tg_message_id = await tg_relay.send_message(
            request.app.state.settings,
            chat_id=request.app.state.settings.managers_chat_id,
            text=tour_request_message(tour_request),
            context=f"tour request id={tour_request.id}",
        )
    except tg_relay.TelegramRelayError:
        raise HTTPException(
            status_code=502,
            detail="Заявка сохранена, но уведомление менеджеру временно не доставлено",
        ) from None

    await session.commit()
    await session.refresh(tour_request)
    return tour_request_dto(tour_request)
