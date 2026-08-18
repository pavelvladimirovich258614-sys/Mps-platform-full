import httpx
from datetime import UTC,datetime,timedelta
from sqlalchemy import select
from app.models.forum import ForumTopic,ForumMessage
from app.models.question import Question,QuestionTarget
from app.models.setting import Setting
from app.models.user import User
PROMPT="Ты Иришка, дружелюбный помощник турагентства. Отвечай кратко и полезно. Не называй цены и не давай юридических гарантий."
TRIGGERS=("цен", "стоим", "виз", "документ")
async def run(session_factory,settings):
 async with session_factory() as s:
  values={x.key:x.value for x in (await s.scalars(select(Setting))).all()}
  if values.get("irishka_enabled","true").lower()!="true":return 0
  delay=int(values.get("irishka_delay_min","30")); cutoff=datetime.now(UTC)-timedelta(minutes=delay)
  assistant=await s.scalar(select(User).where(User.email=="irishka@system.local")); topics=(await s.scalars(select(ForumTopic).where(ForumTopic.created_at<=cutoff))).all(); made=0
  for topic in topics:
   messages=(await s.scalars(select(ForumMessage).where(ForumMessage.topic_id==topic.id))).all()
   if messages or not assistant:continue
   lower=topic.title.casefold()
   if any(x in lower for x in TRIGGERS):
    text="Уточню у менеджера и вернусь с ответом.";s.add(Question(user_id=topic.author_id,target=QuestionTarget.MANAGER,body=topic.title))
   else:
    async with httpx.AsyncClient() as c:
     r=await c.post(f"{settings.minimax_base_url.rstrip('/')}/chat/completions",headers={"Authorization":f"Bearer {settings.minimax_api_key}"},json={"model":settings.minimax_model,"messages":[{"role":"system","content":PROMPT},{"role":"user","content":topic.title}],"max_completion_tokens":500});r.raise_for_status();text=r.json()["choices"][0]["message"]["content"]
   s.add(ForumMessage(topic_id=topic.id,author_id=assistant.id,body=text,is_ai=True));topic.messages_count+=1;topic.last_message_at=datetime.now(UTC);made+=1
  await s.commit();return made
