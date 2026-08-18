import httpx
async def send(settings,question):
 chat_id=settings.managers_chat_id if question.target.value=="manager" else settings.lawyer_tg_id
 async with httpx.AsyncClient() as client:
  r=await client.post(f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",json={"chat_id":chat_id,"text":f"#Q{question.id}\n{question.body}"});r.raise_for_status();return r.json()["result"]["message_id"]
