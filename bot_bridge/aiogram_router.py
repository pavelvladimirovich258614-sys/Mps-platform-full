import httpx
from aiogram import F, Router
from aiogram.types import Message


def build_router(backend_url, webhook_secret, managers_chat_id, lawyer_tg_id=None):
 router=Router()
 allowed_chat_ids=[int(chat_id) for chat_id in (managers_chat_id,lawyer_tg_id) if chat_id]
 @router.message(F.reply_to_message,F.chat.id.in_(allowed_chat_ids))
 async def forward_reply(message:Message):
  async with httpx.AsyncClient() as client:
   response=await client.post(f"{backend_url}/api/v1/internal/telegram-webhook",headers={"X-Telegram-Bot-Api-Secret-Token":webhook_secret},json={"message":message.model_dump(by_alias=True,mode="json")})
   response.raise_for_status()
 return router
