import secrets
from fastapi import APIRouter,Depends,HTTPException,Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_db
from app.models.subscription import Subscription
from app.schemas.f05 import SubscribeIn
from app.services.mailer import send_confirm
router=APIRouter(prefix="/subscribe",tags=["subscribe"])
@router.post("",status_code=201)
async def subscribe(payload:SubscribeIn,request:Request,session:AsyncSession=Depends(get_db)):
 email=payload.email.lower(); sub=await session.scalar(select(Subscription).where(Subscription.email==email))
 if sub is None: sub=Subscription(email=email,confirm_token=secrets.token_urlsafe(24),unsub_token=secrets.token_urlsafe(24));session.add(sub);await session.commit();await session.refresh(sub)
 await send_confirm(request.app.state.settings,email,sub.confirm_token);return {"email":email,"confirmed":sub.confirmed}
@router.get("/confirm/{token}")
async def confirm(token:str,session:AsyncSession=Depends(get_db)):
 sub=await session.scalar(select(Subscription).where(Subscription.confirm_token==token))
 if sub is None: raise HTTPException(404,"Подписка не найдена")
 sub.confirmed=True;await session.commit();return {"confirmed":True}
@router.get("/unsub/{token}")
async def unsub(token:str,session:AsyncSession=Depends(get_db)):
 sub=await session.scalar(select(Subscription).where(Subscription.unsub_token==token))
 if sub is None: raise HTTPException(404,"Подписка не найдена")
 await session.delete(sub);await session.commit();return {"unsubscribed":True}
