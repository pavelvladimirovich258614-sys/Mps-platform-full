from datetime import UTC,datetime,timedelta
import pytest,respx,httpx
from sqlalchemy import select
from app.models.forum import ForumTopic,ForumMessage
from app.models.post import Country
from app.models.setting import Setting
from app.models.user import User
from app.models.question import Question
from app.services.irishka import run
@pytest.mark.parametrize("title,enabled,expect",[("Совет",True,1),("Какая цена",True,1),("Новая",True,0),("Выключено",False,0)])
@respx.mock
async def test_irishka(test_app,title,enabled,expect):
 async with test_app.state.database.session_factory() as s:
  c=Country(name="C",flag_emoji="🏖",sort_order=1);u=User(email="u@x",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value=str(enabled).lower()),Setting(key="irishka_delay_min",value="30")]);await s.flush();t=ForumTopic(country_id=c.id,author_id=u.id,title=title,created_at=datetime.now(UTC)-timedelta(minutes=31 if title!="Новая" else 1));s.add(t);await s.commit()
 respx.post("https://api.minimax.io/v1/chat/completions").mock(return_value=httpx.Response(200,json={"choices":[{"message":{"content":"Ответ"}}]}))
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==expect
 async with test_app.state.database.session_factory() as s:
  messages=(await s.scalars(select(ForumMessage))).all()
  questions=(await s.scalars(select(Question))).all()
  if title=="Совет":
   assert len(messages)==1 and messages[0].is_ai is True
   assert not questions
  elif title=="Какая цена":
   assert len(messages)==1 and "менеджер" in messages[0].body
   assert len(questions)==1 and questions[0].target.value=="manager"
  else:
   assert not messages and not questions
@respx.mock
async def test_irishka_second_run_does_not_duplicate(test_app):
 async with test_app.state.database.session_factory() as s:
  c=Country(name="D",flag_emoji="🏖",sort_order=2);u=User(email="d@x",name="d");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();t=ForumTopic(country_id=c.id,author_id=u.id,title="Совет",created_at=datetime.now(UTC)-timedelta(minutes=31));s.add(t);await s.commit()
 respx.post("https://api.minimax.io/v1/chat/completions").mock(return_value=httpx.Response(200,json={"choices":[{"message":{"content":"Ответ"}}]}))
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==1
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==0
 async with test_app.state.database.session_factory() as s:assert len((await s.scalars(select(ForumMessage))).all())==1
