import hashlib,hmac,time
import httpx,pytest
from sqlalchemy import select
from app.api.posts import slugify
from app.models.user import Role,User

def tg(user_id=99):
 d={"id":user_id,"first_name":"Editor","auth_date":int(time.time())};d["hash"]=hmac.new(hashlib.sha256(b"test-auth-bot-token").digest(),"\n".join(f"{k}={d[k]}" for k in sorted(d)).encode(),hashlib.sha256).hexdigest();return d
@pytest.fixture
async def client(test_app):
 async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app),base_url="http://x") as c:yield c
async def token(client,test_app,editor=False):
 user_id = 100 if editor else 99
 t=(await client.post("/api/v1/auth/telegram",json=tg(user_id))).json()["access_token"]
 if editor:
  async with test_app.state.database.session_factory() as s:
   u=await s.scalar(select(User).where(User.tg_id == user_id));u.role=Role.EDITOR;await s.commit()
 return {"Authorization":f"Bearer {t}"}
async def test_posts_verification(client,test_app):
 payload={"type":"article","title":"Тест статья","body":"<script>x</script>ok","status":"published"}
 reader=await token(client,test_app);assert (await client.post("/api/v1/posts",json=payload,headers=reader)).status_code==403
 editor=await token(client,test_app,True);r=await client.post("/api/v1/posts",json=payload,headers=editor);assert r.status_code==201;post=r.json()
 async with test_app.state.database.session_factory() as s:
  author=await s.scalar(select(User).where(User.tg_id==100))
 assert post["author"]=={"id":author.id,"name":"Editor","avatar_url":None}
 listed=(await client.get("/api/v1/posts")).json();assert listed[0]["author"]==post["author"]
 assert (await client.post("/api/v1/posts",json={**payload,"type":"video_review"},headers=editor)).status_code==422
 assert (await client.post(f"/api/v1/posts/{post['id']}/like",headers=reader)).json()["likes_count"]==1
 assert (await client.post(f"/api/v1/posts/{post['id']}/like",headers=reader)).json()["likes_count"]==0
 assert (await client.get(f"/api/v1/posts/{post['slug']}")).json()["views"]==1
 assert (await client.get(f"/api/v1/posts/{post['slug']}")).json()["views"]==2
 assert (await client.patch(f"/api/v1/posts/{post['id']}",json=payload,headers=reader)).status_code==403
 updated=await client.patch(f"/api/v1/posts/{post['id']}",json={"title":"Новое"},headers=editor)
 assert updated.status_code==200
 assert updated.json()["title"]=="Новое"
 assert updated.json()["body"]=="ok"
 assert updated.json()["type"]=="article"
 assert (await client.patch(f"/api/v1/posts/{post['id']}",json={"type":"video_review"},headers=editor)).status_code==422
 assert (await client.delete(f"/api/v1/posts/{post['id']}",headers=reader)).status_code==403
 assert (await client.delete(f"/api/v1/posts/{post['id']}",headers=editor)).status_code==204

async def test_rich_text_body_uses_the_explicit_allowlist_on_create_and_patch(client, test_app):
 editor = await token(client, test_app, True)
 rich_body = '<h1>Заголовок</h1><p><strong>Жирный</strong><em>Курсив</em><s>Зачёркнутый</s><br></p><ul><li>Пункт</li></ul><ol><li>Первый</li></ol><blockquote>Цитата</blockquote><a href="https://example.com">Ссылка</a><img src="https://cdn.example/image.jpg" alt="Море"><code>Не из редактора</code><iframe src="https://evil.example"></iframe><a href="javascript:alert(1)">XSS</a><p onclick="alert(1)">Без обработчика</p>'
 expected = '<h1>Заголовок</h1><p><strong>Жирный</strong><em>Курсив</em><s>Зачёркнутый</s><br></p><ul><li>Пункт</li></ul><ol><li>Первый</li></ol><blockquote>Цитата</blockquote><a href="https://example.com" rel="noopener noreferrer">Ссылка</a><img src="https://cdn.example/image.jpg" alt="Море">Не из редактора<a rel="noopener noreferrer">XSS</a><p>Без обработчика</p>'
 created = await client.post("/api/v1/posts", json={"type": "article", "title": "Rich text", "body": rich_body, "status": "published"}, headers=editor)
 assert created.status_code == 201
 assert created.json()["body"] == expected

 patched = await client.patch(f"/api/v1/posts/{created.json()['id']}", json={"body": '<h2>Обновлено</h2><img src="https://cdn.example/next.jpg" alt="Далее"><code>Убрать</code><script>alert(1)</script>'}, headers=editor)
 assert patched.status_code == 200
 assert patched.json()["body"] == '<h2>Обновлено</h2><img src="https://cdn.example/next.jpg" alt="Далее">Убрать'

def test_slugify_cyrillic_edge_letters():
 assert slugify("Щука, южная Ялта и ёлка") == "shchuka-yuzhnaya-yalta-i-yolka"
