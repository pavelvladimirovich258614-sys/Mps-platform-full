import hmac
import logging
from datetime import UTC,datetime
from typing import Any
from fastapi import APIRouter,Depends,Header,HTTPException,Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.deps import get_current_user,get_db
from app.models.notification import Notification
from app.models.question import Question,QuestionStatus
from app.models.user import User
from app.rate_limit import forum_user_or_ip_key, limiter
from app.schemas.f05 import AnswerIn,IrishkaQuestionIn,QuestionIn
from app.services import tg_relay
from app.services.irishka_knowledge import find_relevant_entries
from app.services.minimax import generate_completion
from app.services.telegram_qa import parse_qa_reply
router=APIRouter(tags=["qa"])
IRISHKA_PROMPT = (
    "Ты Иришка, дружелюбный ИИ-помощник турагентства «Под солнцем». "
    "Отвечай кратко, доброжелательно и только на основе справочных материалов ниже. "
    "Не называй цены и не давай юридических гарантий; в таких случаях предложи обратиться к менеджеру."
)
IRISHKA_NO_KNOWLEDGE_ANSWER = "Не могу помочь с этим вопросом. Пожалуйста, обратитесь к менеджеру."
IRISHKA_UNAVAILABLE_ANSWER = "Иришка временно не может ответить. Попробуйте позже или обратитесь к менеджеру."
IRISHKA_SNIPPET_MAX_CHARS = 1200
logger = logging.getLogger(__name__)
def dto(q): return {"id":q.id,"target":q.target.value,"body":q.body,"status":q.status.value,"answer":q.answer,"tg_message_id":q.tg_message_id}


async def persist_answer(payload:AnswerIn,session:AsyncSession):
 q=await session.get(Question,payload.question_id)
 if q is None: raise HTTPException(404,"Вопрос не найден")
 if q.status==QuestionStatus.ANSWERED:
  if q.answer==payload.answer and q.answered_by_name==payload.answered_by_name: return dto(q)
  raise HTTPException(409,"На вопрос уже дан другой ответ")
 if q.status!=QuestionStatus.OPEN: raise HTTPException(409,"Вопрос уже закрыт")
 q.status=QuestionStatus.ANSWERED;q.answer=payload.answer;q.answered_by_name=payload.answered_by_name;q.answered_at=datetime.now(UTC);session.add(Notification(user_id=q.user_id,type="qa_answered",payload={"question_id":q.id}));await session.commit();return dto(q)

@router.post("/qa",status_code=201)
async def create(payload:QuestionIn,request:Request,session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)):
 q=Question(user_id=user.id,target=payload.target,body=payload.body);session.add(q);await session.commit();await session.refresh(q);q.tg_message_id=await tg_relay.send(request.app.state.settings,q);await session.commit();return dto(q)
@router.get("/qa/my")
async def mine(session:AsyncSession=Depends(get_db),user:User=Depends(get_current_user)): return [dto(q) for q in (await session.scalars(select(Question).where(Question.user_id==user.id))).all()]
@router.post("/qa/irishka")
@limiter.limit("10/minute", key_func=forum_user_or_ip_key)
async def ask_irishka(payload:IrishkaQuestionIn,request:Request,user:User=Depends(get_current_user)):
 snippets=find_relevant_entries(payload.text)
 if not snippets: return {"answer":IRISHKA_NO_KNOWLEDGE_ANSWER}
 knowledge="\n\n".join(f"[{', '.join(entry.tags)}] {entry.text[:IRISHKA_SNIPPET_MAX_CHARS]}" for entry in snippets)
 answer=await generate_completion(request.app.state.settings,system_prompt=f"{IRISHKA_PROMPT}\n\nСправочные материалы:\n{knowledge}",user_prompt=payload.text,context_label="интерактивного вопроса Иришке",logger=logger)
 if answer is None: raise HTTPException(503,IRISHKA_UNAVAILABLE_ANSWER)
 return {"answer":answer}
@router.post("/internal/qa-answer")
async def answer(payload:AnswerIn,request:Request,x_bot_bridge_secret:str|None=Header(None),session:AsyncSession=Depends(get_db)):
 """Persist a bot-bridge answer and create one author notification.

 Requires X-Bot-Bridge-Secret and {question_id, answer, answered_by_name}; returns
 200 with the question, 401 for bad secret, 404 for unknown question. No Telegram call.
 """
 if not x_bot_bridge_secret or not hmac.compare_digest(x_bot_bridge_secret,request.app.state.settings.bot_bridge_secret): raise HTTPException(401,"Недействительный внутренний секрет")
 return await persist_answer(payload,session)


@router.post("/internal/telegram-webhook")
async def telegram_webhook(
 payload:dict[str,Any],
 request:Request,
 x_telegram_bot_api_secret_token:str|None=Header(None,alias="X-Telegram-Bot-Api-Secret-Token"),
 session:AsyncSession=Depends(get_db),
):
 """Accept a secret-protected Telegram update and persist a valid Q&A reply."""
 settings=request.app.state.settings
 if not settings.telegram_webhook_secret or not x_telegram_bot_api_secret_token or not hmac.compare_digest(x_telegram_bot_api_secret_token,settings.telegram_webhook_secret): raise HTTPException(401,"Недействительный Telegram webhook secret")
 answer_payload=parse_qa_reply(payload,managers_chat_id=settings.managers_chat_id,lawyer_tg_id=settings.lawyer_tg_id)
 if answer_payload is not None: await persist_answer(answer_payload,session)
 return {"ok":True}
