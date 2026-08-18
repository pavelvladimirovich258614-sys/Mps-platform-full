import re,httpx
from aiogram import Router,F
from aiogram.types import Message
def build_router(backend_url,secret,managers_chat_id):
 router=Router()
 @router.message(F.reply_to_message,F.chat.id==int(managers_chat_id))
 async def answer(message:Message):
  match=re.search(r"#Q(\d+)",message.reply_to_message.text or "")
  if match and message.text:
   async with httpx.AsyncClient() as c: await c.post(f"{backend_url}/api/v1/internal/qa-answer",headers={"X-Bot-Bridge-Secret":secret},json={"question_id":int(match.group(1)),"answer":message.text,"answered_by_name":message.from_user.full_name})
 return router
