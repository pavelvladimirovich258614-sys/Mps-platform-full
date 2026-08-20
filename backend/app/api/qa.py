import hmac
from datetime import UTC,datetime
from fastapi import APIRouter,Depends,Header,HTTPException,Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user,get_db
from app.models.notification import Notification
from app.models.question import Question,QuestionStatus
from app.models.user import User
from app.schemas.f05 import AnswerIn,QuestionIn
from app.services import tg_relay
router=APIRouter(tags=["qa"])
def dto(q): return {"id":q.id,"target":q.target.value,"body":q.body,"status":q.status.value,"answer":q.answer,"tg_message_id":q.tg_message_id}
@router.post("/qa",status_code=201)
async def create(payload:QuestionIn,request:Request,session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
 q=Question(user_id=user.id,target=payload.target,body=payload.body);session.add(q);await session.commit();await session.refresh(q);q.tg_message_id=await tg_relay.send(request.app.state.settings,q);await session.commit();return dto(q)
@router.get("/qa/my")
async def mine(session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)): return [dto(q) for q in (await session.scalars(select(Question).where(Question.user_id==user.id))).all()]
@router.post("/internal/qa-answer")
async def answer(payload:AnswerIn,request:Request,x_bot_bridge_secret:str|None=Header(None),session:AsyncSession=Depends(get_db)):
 """Persist a bot-bridge answer and create one author notification.

 Requires X-Bot-Bridge-Secret and {question_id, answer, answered_by_name}; returns
 200 with the question, 401 for bad secret, 404 for unknown question. No Telegram call.
 """
 if not x_bot_bridge_secret or not hmac.compare_digest(x_bot_bridge_secret,request.app.state.settings.bot_bridge_secret): raise HTTPException(401,"Недействительный внутренний секрет")
 q=await session.get(Question,payload.question_id)
 if q is None: raise HTTPException(404,"Вопрос не найден")
 if q.status==QuestionStatus.ANSWERED:
  if q.answer==payload.answer and q.answered_by_name==payload.answered_by_name: return dto(q)
  raise HTTPException(409,"На вопрос уже дан другой ответ")
 if q.status!=QuestionStatus.OPEN: raise HTTPException(409,"Вопрос уже закрыт")
 q.status=QuestionStatus.ANSWERED;q.answer=payload.answer;q.answered_by_name=payload.answered_by_name;q.answered_at=datetime.now(UTC);session.add(Notification(user_id=q.user_id,type="qa_answered",payload={"question_id":q.id}));await session.commit();return dto(q)
