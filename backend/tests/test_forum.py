import httpx,pytest
from sqlalchemy import select
from app.models.post import Country
from app.models.user import User,Role
from app.models.forum import ForumMessage,ForumTopic
from app.models.notification import Notification
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
 assert (await client.get(f"/api/v1/countries/{c.id}/topics",params={"search":"симка"})).json()[0]["id"]==ids[0]
 m=await client.post(f"/api/v1/topics/{ids[0]}/messages",headers=oh,json={"body":"Ответ"});assert m.status_code==201
 async with test_app.state.database.session_factory() as s:
  t=await s.get(ForumTopic,ids[0]);assert t.messages_count==1 and t.last_message_at is not None;assert len((await s.scalars(select(Notification))).all())==1
 assert (await client.post(f"/api/v1/topics/{ids[0]}/messages",headers=rh,json={"body":"Сам"})).status_code==201
 async with test_app.state.database.session_factory() as s:assert len((await s.scalars(select(Notification))).all())==1


async def test_forum_messages_include_author_and_ai_marker(client, test_app):
 c=await country(test_app);author=await user(test_app,"author@x.ru");irishka=await user(test_app,"irishka@system.local")
 topic=(await client.post(f"/api/v1/countries/{c.id}/topics",headers=hdr(test_app,author),json={"title":"Нужен совет"})).json()
 async with test_app.state.database.session_factory() as s:
  s.add(ForumMessage(topic_id=topic["id"],author_id=irishka.id,body="Совет от Иришки",is_ai=True));await s.commit()
 response=await client.get(f"/api/v1/topics/{topic['id']}/messages")
 assert response.status_code==200
 assert response.json()==[{"id":1,"body":"Совет от Иришки","author":{"id":irishka.id,"name":"irishka@system.local","avatar_url":None},"is_ai":True}]
