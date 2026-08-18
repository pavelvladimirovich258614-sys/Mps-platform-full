from datetime import UTC,datetime
from fastapi import APIRouter,Depends,HTTPException,Request
from pydantic import BaseModel,Field
from sqlalchemy import func,select
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user,get_db
from app.models.forum import ForumMessage,ForumTopic
from app.models.notification import Notification
from app.models.post import Country
from app.models.user import Role,User
router=APIRouter(tags=["forum"])
class TopicIn(BaseModel): title:str=Field(min_length=1,max_length=255)
class MessageIn(BaseModel): body:str=Field(min_length=1)
@router.get("/countries")
async def countries(session:AsyncSession=Depends(get_db)):
 rows=(await session.scalars(select(Country).where(Country.is_active.is_(True)).order_by(Country.sort_order))).all();return [{"id":c.id,"name":c.name,"topics_count":await session.scalar(select(func.count()).select_from(ForumTopic).where(ForumTopic.country_id==c.id))} for c in rows]
@router.get("/countries/{country_id}/topics")
async def topics(country_id:int,search:str|None=None,session:AsyncSession=Depends(get_db)):
 q=select(ForumTopic).where(ForumTopic.country_id==country_id)
 rows=(await session.scalars(q)).all()
 if search:
  term=search.casefold(); stem=term[:-1] if len(term)>3 else term
  rows=[t for t in rows if term in t.title.casefold() or stem in t.title.casefold()]
 return [{"id":t.id,"title":t.title,"messages_count":t.messages_count} for t in rows]
@router.post("/countries/{country_id}/topics",status_code=201)
async def create_topic(country_id:int,payload:TopicIn,request:Request,session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
 if await session.get(Country,country_id) is None:raise HTTPException(404,"Страна не найдена")
 if user.role not in (Role.EDITOR,Role.ADMIN):
  count=await session.scalar(select(func.count()).select_from(ForumTopic).where(ForumTopic.author_id==user.id))
  if count>=request.app.state.settings.forum_topic_limit:raise HTTPException(403,"Достигнут лимит тем форума")
 t=ForumTopic(country_id=country_id,author_id=user.id,title=payload.title);session.add(t);await session.commit();await session.refresh(t);return {"id":t.id,"title":t.title}
@router.get("/topics/{topic_id}/messages")
async def messages(topic_id:int,session:AsyncSession=Depends(get_db)):return [{"id":m.id,"body":m.body} for m in (await session.scalars(select(ForumMessage).where(ForumMessage.topic_id==topic_id).order_by(ForumMessage.id))).all()]
@router.post("/topics/{topic_id}/messages",status_code=201)
async def message(topic_id:int,payload:MessageIn,session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
 t=await session.get(ForumTopic,topic_id)
 if t is None:raise HTTPException(404,"Тема не найдена")
 m=ForumMessage(topic_id=topic_id,author_id=user.id,body=payload.body);session.add(m);t.messages_count+=1;t.last_message_at=datetime.now(UTC)
 if t.author_id!=user.id:session.add(Notification(user_id=t.author_id,type="forum_message",payload={"topic_id":t.id,"message_id":None}))
 await session.commit();await session.refresh(m);return {"id":m.id,"body":m.body}
