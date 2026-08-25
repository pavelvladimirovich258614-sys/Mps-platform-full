import asyncio
import os

import fakeredis.aioredis
import httpx,pytest,pytest_asyncio
from sqlalchemy import event, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import Settings
from app.db import Base
from app.main import create_app
from app.models.post import Country
from app.models.user import User,Role
from app.models.forum import ForumMessage,ForumTopic
from app.models.notification import Notification
from app.rate_limit import limiter
from app.services.tokens import create_access_token
@pytest.fixture
async def client(test_app):
 async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app),base_url="http://test") as c:yield c
async def user(test_app,email,role=Role.READER):
 async with test_app.state.database.session_factory() as s:
  u=User(email=email,name=email,role=role);s.add(u);await s.commit();await s.refresh(u);return u
def hdr(app,u):return {"Authorization":"Bearer "+create_access_token(u.id,app.state.settings)}
async def country(app):
 async with app.state.database.session_factory() as s:
  c=Country(name="Тест",flag_emoji="🏖️",sort_order=1);s.add(c);await s.commit();await s.refresh(c);return c


@pytest_asyncio.fixture
async def postgresql_forum_client(tmp_path):
 database_url=os.getenv("MPS_TEST_POSTGRES_URL")
 if not database_url:
  pytest.skip("MPS_TEST_POSTGRES_URL is required for PostgreSQL forum search verification")
 limiter.reset()
 settings=Settings(database_url=database_url,jwt_secret="test-secret-key-with-32-characters",auth_bot_token="test-auth-bot-token",relay_bot_token="test-relay-bot-token",bot_bridge_secret="bridge-secret",unisender_go_api_key="key",unisender_from_email="noreply@example.com",minimax_api_key="test-minimax-key",minimax_model="test-model",media_dir=str(tmp_path/"media"))
 app=create_app(settings);app.state.redis=fakeredis.aioredis.FakeRedis(decode_responses=False);engine=app.state.database.engine
 async with engine.begin() as connection:
  await connection.run_sync(Base.metadata.drop_all);await connection.run_sync(Base.metadata.create_all)
 try:
  async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url="http://test") as client:
   yield client,app
 finally:
  async with engine.begin() as connection: await connection.run_sync(Base.metadata.drop_all)
  await app.state.database.dispose();await app.state.redis.aclose()
async def test_forum_limit_search_messages_and_notifications(client,test_app):
 c=await country(test_app);reader=await user(test_app,"r@x.ru");premium=await user(test_app,"p@x.ru",Role.PREMIUM);editor=await user(test_app,"e@x.ru",Role.EDITOR);other=await user(test_app,"o@x.ru")
 rh,ph,eh,oh=hdr(test_app,reader),hdr(test_app,premium),hdr(test_app,editor),hdr(test_app,other)
 ids=[]
 for title in ["Какую СИМку брать","Виза","Отели"]:
  r=await client.post(f"/api/v1/countries/{c.id}/topics",headers=rh,json={"title":title});assert r.status_code==201;ids.append(r.json()["id"])
 limit=await client.post(f"/api/v1/countries/{c.id}/topics",headers=rh,json={"title":"Четвёртая"});assert limit.status_code==403 and "лимит" in limit.json()["detail"].lower()
 for n in range(3):assert (await client.post(f"/api/v1/countries/{c.id}/topics",headers=ph,json={"title":f"P{n}"})).status_code==201
 assert (await client.post(f"/api/v1/countries/{c.id}/topics",headers=ph,json={"title":"P4"})).status_code==403
 for n in range(4):assert (await client.post(f"/api/v1/countries/{c.id}/topics",headers=eh,json={"title":f"E{n}"})).status_code==201
 m=await client.post(f"/api/v1/topics/{ids[0]}/messages",headers=oh,json={"body":"Ответ"});assert m.status_code==201
 async with test_app.state.database.session_factory() as s:
  t=await s.get(ForumTopic,ids[0]);assert t.messages_count==1 and t.last_message_at is not None
  notifications=(await s.scalars(select(Notification))).all();assert len(notifications)==1
  assert notifications[0].payload=={"topic_id":ids[0],"message_id":m.json()["id"]}
 assert (await client.post(f"/api/v1/topics/{ids[0]}/messages",headers=rh,json={"body":"Сам"})).status_code==201
 async with test_app.state.database.session_factory() as s:assert len((await s.scalars(select(Notification))).all())==1


async def test_forum_rejects_messages_in_locked_topic(client, test_app):
 c=await country(test_app);author=await user(test_app,"author@x.ru");reply_author=await user(test_app,"reply@example.com")
 topic=(await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,author),json={"title":"Закрытая тема"})).json()
 async with test_app.state.database.session_factory() as s:
  saved_topic=await s.get(ForumTopic,topic["id"]);saved_topic.is_locked=True;await s.commit()

 response=await client.post(f"/api/v1/topics/{topic['id']}/messages",headers=hdr(test_app,reply_author),json={"body":"Поздний ответ"})

 assert response.status_code==423
 async with test_app.state.database.session_factory() as s:
  saved_topic=await s.get(ForumTopic,topic["id"])
  assert saved_topic.messages_count==0
  assert await s.scalar(select(ForumMessage).where(ForumMessage.topic_id==topic["id"])) is None
  assert await s.scalar(select(Notification).where(Notification.user_id==author.id)) is None


async def test_forum_messages_include_author_and_ai_marker(client, test_app):
 c=await country(test_app);author=await user(test_app,"author@x.ru");irishka=await user(test_app,"irishka@system.local")
 topic=(await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,author),json={"title":"Нужен совет"})).json()
 async with test_app.state.database.session_factory() as s:
  s.add(ForumMessage(topic_id=topic["id"],author_id=irishka.id,body="Совет от Иришки",is_ai=True));await s.commit()
 response=await client.get(f"/api/v1/topics/{topic['id']}/messages")
 assert response.status_code==200
 assert response.json()=={"items":[{"id":1,"body":"Совет от Иришки","author":{"id":irishka.id,"name":"irishka@system.local","avatar_url":None},"is_ai":True}],"next_cursor":None}


async def test_forum_topics_use_keyset_pages_and_sql_search(client, test_app):
 c=await country(test_app);editor=await user(test_app,"pages-editor@example.com",Role.EDITOR);headers=hdr(test_app,editor)
 created=[]
 for title in ["Первый маршрут", "симка в поездке", "Третий маршрут"]:
  response=await client.post(f"/api/v1/countries/{c.id}/topics",headers=headers,json={"title":title})
  assert response.status_code==201;created.append(response.json()["id"])

 first=await client.get(f"/api/v1/countries/{c.id}/topics",params={"limit":2})
 assert first.status_code==200
 first_page=first.json()
 assert len(first_page["items"])==2
 assert first_page["next_cursor"]
 second=await client.get(f"/api/v1/countries/{c.id}/topics",params={"limit":2,"cursor":first_page["next_cursor"]})
 assert second.status_code==200
 second_page=second.json()
 assert [item["id"] for item in first_page["items"]+second_page["items"]]==list(reversed(created))
 assert second_page["next_cursor"] is None

 statements=[]
 def record(_, __, statement, ___, ____, _____): statements.append(statement)
 engine=test_app.state.database.engine.sync_engine;event.listen(engine,"before_cursor_execute",record)
 try:
  search=await client.get(f"/api/v1/countries/{c.id}/topics",params={"search":"симка","limit":2})
 finally:
  event.remove(engine,"before_cursor_execute",record)
 assert search.status_code==200
 assert [item["title"] for item in search.json()["items"]]==["симка в поездке"]
 forum_selects=[statement.upper() for statement in statements if "FORUM_TOPICS" in statement.upper() and statement.lstrip().upper().startswith("SELECT")]
 assert len(forum_selects)==1
 assert "LIKE" in forum_selects[0] and "LIMIT" in forum_selects[0]


async def test_forum_messages_use_keyset_pages(client, test_app):
 c=await country(test_app);author=await user(test_app,"page-author@example.com",Role.EDITOR);reply_author=await user(test_app,"page-reply@example.com")
 topic=(await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,author),json={"title":"Страницы сообщений"})).json()
 created=[]
 for body in ["Первое", "Второе", "Третье"]:
  response=await client.post(f"/api/v1/topics/{topic['id']}/messages",headers=hdr(test_app,reply_author),json={"body":body})
  assert response.status_code==201;created.append(response.json()["id"])

 first=await client.get(f"/api/v1/topics/{topic['id']}/messages",params={"limit":2})
 assert first.status_code==200
 first_page=first.json()
 assert len(first_page["items"])==2
 assert first_page["next_cursor"]
 second=await client.get(f"/api/v1/topics/{topic['id']}/messages",params={"limit":2,"cursor":first_page["next_cursor"]})
 assert second.status_code==200
 second_page=second.json()
 assert [item["id"] for item in first_page["items"]+second_page["items"]]==list(reversed(created))
 assert second_page["next_cursor"] is None


async def test_forum_countries_use_one_grouped_count_query(client, test_app):
 first=await country(test_app)
 async with test_app.state.database.session_factory() as session:
  session.add_all([Country(name="Вторая",flag_emoji="🏝️",sort_order=2),Country(name="Третья",flag_emoji="🏔️",sort_order=3)])
  await session.commit()
 editor=await user(test_app,"counts-editor@example.com",Role.EDITOR)
 for title in ["Один", "Два"]:
  assert (await client.post(f"/api/v1/countries/{first.id}/topics",headers=hdr(test_app,editor),json={"title":title})).status_code==201

 statements=[]
 def record(_, __, statement, ___, ____, _____): statements.append(statement)
 engine=test_app.state.database.engine.sync_engine;event.listen(engine,"before_cursor_execute",record)
 try:
  response=await client.get("/api/v1/countries")
 finally:
  event.remove(engine,"before_cursor_execute",record)
 assert response.status_code==200
 assert next(item for item in response.json() if item["id"]==first.id)["topics_count"]==2
 selects=[statement.upper() for statement in statements if statement.lstrip().upper().startswith("SELECT")]
 assert len(selects)==1
 assert "GROUP BY" in selects[0] and "COUNT" in selects[0]


async def test_forum_postgresql_search_is_cyrillic_case_insensitive(postgresql_forum_client):
 client,app=postgresql_forum_client
 c=await country(app);editor=await user(app,"postgres-search@example.com",Role.EDITOR)
 created=await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(app,editor),json={"title":"СИМка в поездке"})
 assert created.status_code==201

 response=await client.get(f"/api/v1/countries/{c.id}/topics",params={"search":"симка"})

 assert response.status_code==200
 assert [item["id"] for item in response.json()["items"]]==[created.json()["id"]]


async def test_forum_postgresql_concurrent_topic_limit_is_atomic(postgresql_forum_client, monkeypatch):
 client,app=postgresql_forum_client
 c=await country(app);reader=await user(app,"concurrent-topics@example.com")
 async with app.state.database.session_factory() as s:
  s.add_all([ForumTopic(country_id=c.id,author_id=reader.id,title="Уже первая"),ForumTopic(country_id=c.id,author_id=reader.id,title="Уже вторая")]);await s.commit()

 original_scalar=AsyncSession.scalar
 async def delayed_topic_count(self,statement,*args,**kwargs):
  if "FORUM_TOPICS" in str(statement).upper() and "COUNT" in str(statement).upper():
   statement=statement.add_columns(func.pg_sleep(0.15))
  return await original_scalar(self,statement,*args,**kwargs)
 monkeypatch.setattr(AsyncSession,"scalar",delayed_topic_count)

 responses=await asyncio.gather(*[
  client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(app,reader),json={"title":f"Параллельная {n}"})
  for n in range(5)
 ])

 assert [response.status_code for response in responses].count(201)==1
 assert [response.status_code for response in responses].count(403)==4
 assert all("лимит" in response.json()["detail"].lower() for response in responses if response.status_code==403)


async def test_forum_postgresql_concurrent_messages_increment_counter_atomically(postgresql_forum_client, monkeypatch):
 client,app=postgresql_forum_client
 c=await country(app);author=await user(app,"message-author@example.com");sender=await user(app,"message-sender@example.com")
 async with app.state.database.session_factory() as s:
  topic=ForumTopic(country_id=c.id,author_id=author.id,title="Счётчик");s.add(topic);await s.commit();await s.refresh(topic);topic_id=topic.id

 original_get=AsyncSession.get
 async def delayed_topic_read(self,entity,ident,*args,**kwargs):
  value=await original_get(self,entity,ident,*args,**kwargs)
  if entity is ForumTopic:
   await asyncio.sleep(0.15)
  return value
 monkeypatch.setattr(AsyncSession,"get",delayed_topic_read)

 responses=await asyncio.gather(*[
  client.post(f"/api/v1/topics/{topic_id}/messages",headers=hdr(app,sender),json={"body":f"Сообщение {n}"})
  for n in range(5)
 ])

 assert all(response.status_code==201 for response in responses)
 async with app.state.database.session_factory() as s:
  topic=await s.get(ForumTopic,topic_id)
  assert topic.messages_count==5


async def test_forum_topic_rate_limit_is_per_authenticated_user(client,test_app):
 c=await country(test_app);first=await user(test_app,"topic-rate-first@example.com",Role.EDITOR);second=await user(test_app,"topic-rate-second@example.com",Role.EDITOR)
 for n in range(5):
  response=await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,first),json={"title":f"Тема {n}"})
  assert response.status_code==201

 limited=await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,first),json={"title":"Лишняя тема"})
 other_user=await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,second),json={"title":"Тема другого"})

 assert limited.status_code==429
 assert "слишком много" in limited.json()["detail"].lower()
 assert other_user.status_code==201


async def test_forum_message_rate_limit_returns_russian_429(client,test_app):
 c=await country(test_app);author=await user(test_app,"message-rate-author@example.com",Role.EDITOR);sender=await user(test_app,"message-rate-sender@example.com")
 topic=(await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,author),json={"title":"Тема для лимита"})).json()
 for n in range(10):
  response=await client.post(f"/api/v1/topics/{topic['id']}/messages",headers=hdr(test_app,sender),json={"body":f"Сообщение {n}"})
  assert response.status_code==201

 limited=await client.post(f"/api/v1/topics/{topic['id']}/messages",headers=hdr(test_app,sender),json={"body":"Лишнее сообщение"})

 assert limited.status_code==429
 assert "слишком много" in limited.json()["detail"].lower()
