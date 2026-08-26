from datetime import UTC,datetime,timedelta
from unittest.mock import AsyncMock
import pytest,respx,httpx
from sqlalchemy import event,select
from app.models.forum import ForumTopic,ForumMessage
from app.models.post import Country
from app.models.setting import Setting
from app.models.user import User
from app.models.question import Question
from app.services import tg_relay
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


@respx.mock
async def test_irishka_uses_atomic_message_counter_increment(test_app):
 async with test_app.state.database.session_factory() as s:
  c=Country(name="Atomic",flag_emoji="🏖",sort_order=3);u=User(email="atomic-user@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();t=ForumTopic(country_id=c.id,author_id=u.id,title="Совет",created_at=datetime.now(UTC)-timedelta(minutes=31));s.add(t);await s.commit()
 respx.post("https://api.minimax.io/v1/chat/completions").mock(return_value=httpx.Response(200,json={"choices":[{"message":{"content":"Ответ"}}]}))
 statements=[]
 def record(_, __, statement, ___, ____, _____): statements.append(statement.upper().replace(" ",""))
 engine=test_app.state.database.engine.sync_engine;event.listen(engine,"before_cursor_execute",record)
 try:
  assert await run(test_app.state.database.session_factory,test_app.state.settings)==1
 finally:
  event.remove(engine,"before_cursor_execute",record)
 assert any("UPDATEFORUM_TOPICSSETMESSAGES_COUNT=(FORUM_TOPICS.MESSAGES_COUNT+" in statement for statement in statements)


@pytest.mark.parametrize("title", ["Какая цена", "Нужна виза"])
async def test_irishka_sends_manager_question_to_telegram(test_app, monkeypatch, title):
 async with test_app.state.database.session_factory() as s:
  c=Country(name="Telegram",flag_emoji="🏖",sort_order=4);u=User(email="telegram-user@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();s.add(ForumTopic(country_id=c.id,author_id=u.id,title=title,created_at=datetime.now(UTC)-timedelta(minutes=31)));await s.commit()
 sent=AsyncMock(return_value=12345)
 monkeypatch.setattr(tg_relay,"send",sent)
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==1
 sent.assert_awaited_once()
 settings,question=sent.await_args.args
 assert settings is test_app.state.settings
 assert question.target.value=="manager" and question.body==title
 async with test_app.state.database.session_factory() as s:
  saved=await s.scalar(select(Question).where(Question.body==title))
  assert saved is not None and saved.tg_message_id==12345


async def test_irishka_keeps_question_and_ai_message_when_telegram_fails(test_app, monkeypatch):
 title="Какая стоимость визы"
 async with test_app.state.database.session_factory() as s:
  c=Country(name="Telegram failure",flag_emoji="🏖",sort_order=5);u=User(email="telegram-failure@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();s.add(ForumTopic(country_id=c.id,author_id=u.id,title=title,created_at=datetime.now(UTC)-timedelta(minutes=31)));await s.commit()
 sent=AsyncMock(side_effect=httpx.HTTPError("Telegram unavailable"))
 monkeypatch.setattr(tg_relay,"send",sent)
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==1
 sent.assert_awaited_once()
 async with test_app.state.database.session_factory() as s:
  question=await s.scalar(select(Question).where(Question.body==title))
  messages=(await s.scalars(select(ForumMessage))).all()
  assert question is not None and question.tg_message_id is None
  assert len(messages)==1 and messages[0].is_ai is True
