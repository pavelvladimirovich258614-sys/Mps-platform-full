import asyncio
import os
from datetime import UTC,datetime,timedelta
from unittest.mock import AsyncMock
import logging
import pytest,pytest_asyncio,respx,httpx
from sqlalchemy import event,func,select,update
from app.config import Settings
from app.db import Base
from app.main import create_app
from app.models.forum import ForumTopic,ForumMessage
from app.models.post import Country
from app.models.setting import Setting
from app.models.user import User
from app.models.question import Question
from app.services import tg_relay
from app.services.irishka import ADVISORY_LOCK_NAMESPACE,run


@pytest_asyncio.fixture
async def postgresql_irishka_app(tmp_path):
 database_url=os.getenv("MPS_TEST_POSTGRES_URL")
 if not database_url:
  pytest.skip("MPS_TEST_POSTGRES_URL is required for PostgreSQL Иришка concurrency verification")
 settings=Settings(database_url=database_url,jwt_secret="test-secret-key-with-32-characters",auth_bot_token="test-auth-bot-token",relay_bot_token="test-relay-bot-token",bot_bridge_secret="bridge-secret",unisender_go_api_key="key",unisender_from_email="noreply@example.com",minimax_api_key="test-minimax-key",minimax_model="test-model",media_dir=str(tmp_path/"media"))
 app=create_app(settings);engine=app.state.database.engine
 async with engine.begin() as connection:
  await connection.run_sync(Base.metadata.drop_all);await connection.run_sync(Base.metadata.create_all)
 try:
  yield app
 finally:
  async with engine.begin() as connection:await connection.run_sync(Base.metadata.drop_all)
  await app.state.database.dispose()


async def test_irishka_postgresql_concurrent_runners_create_one_ai_message(postgresql_irishka_app,monkeypatch):
 app=postgresql_irishka_app
 async with app.state.database.session_factory() as s:
  c=Country(name="Concurrency",flag_emoji="🏖",sort_order=100);u=User(email="concurrent-user@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();topic=ForumTopic(country_id=c.id,author_id=u.id,title="Нужен совет",created_at=datetime.now(UTC)-timedelta(minutes=31));s.add(topic);await s.commit();topic_id=topic.id
 provider_started=asyncio.Event();release_provider=asyncio.Event();provider_calls=0
 async def delayed_answer(_settings,_title):
  nonlocal provider_calls
  provider_calls+=1;provider_started.set();await release_provider.wait();return "Единственный ответ"
 monkeypatch.setattr("app.services.irishka.generate_minimax_answer",delayed_answer)
 first=asyncio.create_task(run(app.state.database.session_factory,app.state.settings))
 await asyncio.wait_for(provider_started.wait(),timeout=2)
 second=asyncio.create_task(run(app.state.database.session_factory,app.state.settings))
 await asyncio.sleep(0.2)
 release_provider.set()
 results=await asyncio.gather(first,second)
 async with app.state.database.session_factory() as s:
  messages=(await s.scalars(select(ForumMessage).where(ForumMessage.topic_id==topic_id))).all();saved_topic=await s.get(ForumTopic,topic_id)
 assert (results,provider_calls,len(messages),saved_topic.messages_count)==([1,0],1,1,1)
 assert messages[0].is_ai is True


async def test_irishka_postgresql_busy_locks_skip_minimax_and_telegram(postgresql_irishka_app,monkeypatch):
 app=postgresql_irishka_app
 async with app.state.database.session_factory() as s:
  c=Country(name="Busy lock",flag_emoji="🏖",sort_order=101);u=User(email="busy-lock-user@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();topics=[ForumTopic(country_id=c.id,author_id=u.id,title=title,created_at=datetime.now(UTC)-timedelta(minutes=31)) for title in ("Нужен совет","Какая цена")];s.add_all(topics);await s.commit();topic_ids=[topic.id for topic in topics]
 minimax=AsyncMock(return_value="Ответ");telegram=AsyncMock(return_value=123)
 monkeypatch.setattr("app.services.irishka.generate_minimax_answer",minimax);monkeypatch.setattr(tg_relay,"send",telegram)
 async with app.state.database.session_factory() as blocker:
  for topic_id in topic_ids:await blocker.scalar(select(func.pg_advisory_xact_lock(ADVISORY_LOCK_NAMESPACE,topic_id)))
  assert await run(app.state.database.session_factory,app.state.settings)==0
 minimax.assert_not_awaited();telegram.assert_not_awaited()


async def test_irishka_postgresql_rechecks_messages_after_minimax(postgresql_irishka_app,monkeypatch):
 app=postgresql_irishka_app
 async with app.state.database.session_factory() as s:
  c=Country(name="Final recheck",flag_emoji="🏖",sort_order=102);u=User(email="recheck-user@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();topic=ForumTopic(country_id=c.id,author_id=u.id,title="Нужен совет",created_at=datetime.now(UTC)-timedelta(minutes=31));s.add(topic);await s.commit();topic_id=topic.id;user_id=u.id
 provider_started=asyncio.Event();release_provider=asyncio.Event()
 async def delayed_answer(_settings,_title):provider_started.set();await release_provider.wait();return "Устаревший ответ"
 monkeypatch.setattr("app.services.irishka.generate_minimax_answer",delayed_answer)
 runner=asyncio.create_task(run(app.state.database.session_factory,app.state.settings));await asyncio.wait_for(provider_started.wait(),timeout=2)
 async with app.state.database.session_factory() as s:
  s.add(ForumMessage(topic_id=topic_id,author_id=user_id,body="Человеческий ответ",is_ai=False));await s.execute(update(ForumTopic).where(ForumTopic.id==topic_id).values(messages_count=ForumTopic.messages_count+1,last_message_at=datetime.now(UTC)));await s.commit()
 release_provider.set();assert await runner==0
 async with app.state.database.session_factory() as s:
  messages=(await s.scalars(select(ForumMessage).where(ForumMessage.topic_id==topic_id))).all();saved_topic=await s.get(ForumTopic,topic_id)
 assert len(messages)==1 and messages[0].is_ai is False
 assert saved_topic.messages_count==1


async def test_irishka_postgresql_concurrent_manager_trigger_relays_once(postgresql_irishka_app,monkeypatch):
 app=postgresql_irishka_app
 async with app.state.database.session_factory() as s:
  c=Country(name="Relay concurrency",flag_emoji="🏖",sort_order=103);u=User(email="relay-concurrent-user@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush();topic=ForumTopic(country_id=c.id,author_id=u.id,title="Какая цена",created_at=datetime.now(UTC)-timedelta(minutes=31));s.add(topic);await s.commit();topic_id=topic.id
 relay_started=asyncio.Event();release_relay=asyncio.Event()
 async def delayed_relay(_settings,_question):relay_started.set();await release_relay.wait();return 456
 telegram=AsyncMock(side_effect=delayed_relay);monkeypatch.setattr(tg_relay,"send",telegram)
 first=asyncio.create_task(run(app.state.database.session_factory,app.state.settings));await asyncio.wait_for(relay_started.wait(),timeout=2)
 second=asyncio.create_task(run(app.state.database.session_factory,app.state.settings));await asyncio.sleep(0.2);release_relay.set();results=await asyncio.gather(first,second)
 async with app.state.database.session_factory() as s:
  messages=(await s.scalars(select(ForumMessage).where(ForumMessage.topic_id==topic_id))).all();questions=(await s.scalars(select(Question))).all();saved_topic=await s.get(ForumTopic,topic_id)
 assert (results,telegram.await_count,len(messages),len(questions),saved_topic.messages_count)==([1,0],1,1,1,1)
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


async def add_ai_topics(test_app, *titles):
 async with test_app.state.database.session_factory() as s:
  c=Country(name="MiniMax",flag_emoji="🏖",sort_order=6);u=User(email="minimax-user@example.com",name="u");a=User(email="irishka@system.local",name="Иришка · ИИ-помощник",role="editor");s.add_all([c,u,a,Setting(key="irishka_enabled",value="true"),Setting(key="irishka_delay_min",value="30")]);await s.flush()
  topics=[ForumTopic(country_id=c.id,author_id=u.id,title=title,created_at=datetime.now(UTC)-timedelta(minutes=31)) for title in titles]
  s.add_all(topics);await s.commit()
  return [topic.id for topic in topics]


@pytest.mark.parametrize("failure", [httpx.ReadTimeout("MiniMax timeout"), httpx.Response(500)])
@respx.mock
async def test_irishka_retries_transient_minimax_failures(test_app, failure, monkeypatch):
 await add_ai_topics(test_app,"Нужен совет")
 monkeypatch.setattr("asyncio.sleep",AsyncMock())
 route=respx.post("https://api.minimax.io/v1/chat/completions").mock(side_effect=[failure,failure,httpx.Response(200,json={"choices":[{"message":{"content":"Ответ после retry"}}]})])
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==1
 assert route.call_count==3


async def test_irishka_uses_explicit_30_second_minimax_timeout(test_app, monkeypatch):
 await add_ai_topics(test_app,"Нужен совет")
 observed=[]
 class Client:
  def __init__(self, *, timeout): observed.append(timeout)
  async def __aenter__(self): return self
  async def __aexit__(self, *_): return False
  async def post(self, *_args, **_kwargs): return httpx.Response(200,request=httpx.Request("POST","https://api.minimax.io/v1/chat/completions"),json={"choices":[{"message":{"content":"Ответ"}}]})
 monkeypatch.setattr("app.services.minimax.httpx.AsyncClient",Client)
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==1
 assert observed==[httpx.Timeout(30.0)]


@pytest.mark.parametrize("status", [401,403])
@respx.mock
async def test_irishka_does_not_retry_minimax_auth_errors(test_app, status):
 await add_ai_topics(test_app,"Нужен совет")
 route=respx.post("https://api.minimax.io/v1/chat/completions").mock(return_value=httpx.Response(status))
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==0
 assert route.call_count==1


@respx.mock
async def test_irishka_logs_and_skips_failed_topic_then_processes_next(test_app, caplog, monkeypatch):
 failed_topic_id,healthy_topic_id=await add_ai_topics(test_app,"Первый совет","Второй совет")
 monkeypatch.setattr("asyncio.sleep",AsyncMock())
 route=respx.post("https://api.minimax.io/v1/chat/completions").mock(side_effect=[httpx.ConnectError("MiniMax unavailable"),httpx.ConnectError("MiniMax unavailable"),httpx.ConnectError("MiniMax unavailable"),httpx.Response(200,json={"choices":[{"message":{"content":"Ответ второй теме"}}]})])
 caplog.set_level(logging.ERROR,logger="app.services.irishka")
 assert await run(test_app.state.database.session_factory,test_app.state.settings)==1
 assert route.call_count==4
 assert "MiniMax" in caplog.text
 async with test_app.state.database.session_factory() as s:
  failed_messages=(await s.scalars(select(ForumMessage).where(ForumMessage.topic_id==failed_topic_id))).all()
  healthy_messages=(await s.scalars(select(ForumMessage).where(ForumMessage.topic_id==healthy_topic_id))).all()
  assert not failed_messages
  assert len(healthy_messages)==1 and healthy_messages[0].body=="Ответ второй теме"
