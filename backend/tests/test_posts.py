import hashlib,hmac,time
import httpx,pytest
from sqlalchemy import select
from app.api.posts import slugify
from app.models.post import Post
from app.models.setting import Setting
from app.models.user import Role,User

def tg(user_id=99):
 d={"id":user_id,"first_name":"Editor","auth_date":int(time.time())};d["hash"]=hmac.new(hashlib.sha256(b"test-auth-bot-token").digest(),"\n".join(f"{k}={d[k]}" for k in sorted(d)).encode(),hashlib.sha256).hexdigest();return d
@pytest.fixture
async def client(test_app):
 async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app),base_url="http://x") as c:yield c
async def token(client,test_app,editor=False,user_id=None):
 user_id = user_id if user_id is not None else (100 if editor else 99)
 t=(await client.post("/api/v1/auth/telegram",json=tg(user_id))).json()["access_token"]
 if editor:
  async with test_app.state.database.session_factory() as s:
   u=await s.scalar(select(User).where(User.tg_id == user_id));u.role=Role.EDITOR;await s.commit()
 return {"Authorization":f"Bearer {t}"}

async def test_drafts_are_visible_only_to_their_author_and_publish_without_a_duplicate(client,test_app):
 author = await token(client, test_app, editor=True, user_id=100)
 other_author = await token(client, test_app, editor=True, user_id=101)
 own = await client.post("/api/v1/posts", json={"type":"article","title":"Мой черновик","body":"Текст","status":"draft"}, headers=author)
 foreign = await client.post("/api/v1/posts", json={"type":"article","title":"Чужой черновик","body":"Секрет","status":"draft"}, headers=other_author)
 assert own.status_code == 201 and foreign.status_code == 201

 listed = await client.get("/api/v1/posts/drafts", headers=author)
 assert listed.status_code == 200
 assert [item["id"] for item in listed.json()] == [own.json()["id"]]
 assert listed.json()[0]["title"] == "Мой черновик"
 assert listed.json()[0]["updated_at"]

 detail = await client.get(f"/api/v1/posts/drafts/{own.json()['id']}", headers=author)
 assert detail.status_code == 200
 assert detail.json()["id"] == own.json()["id"]
 assert detail.json()["body"] == "Текст"
 assert detail.json()["status"] == "draft"
 assert (await client.get(f"/api/v1/posts/drafts/{foreign.json()['id']}", headers=author)).status_code == 404

 published = await client.patch(f"/api/v1/posts/{own.json()['id']}", json={"status":"published"}, headers=author)
 assert published.status_code == 200
 assert published.json()["status"] == "published"
 async with test_app.state.database.session_factory() as s:
  post = await s.get(Post, own.json()["id"])
  assert post is not None and post.published_at is not None
 assert [item["id"] for item in (await client.get("/api/v1/posts")).json()] == [own.json()["id"]]
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

async def test_public_feed_excludes_fishki_but_keeps_type_and_author_filters(client, test_app):
 editor = await token(client, test_app, True)
 article = await client.post("/api/v1/posts", json={"type":"article", "title":"Статья для ленты", "body":"Текст", "status":"published"}, headers=editor)
 video = await client.post("/api/v1/posts", json={"type":"video_review", "title":"Видео для ленты", "body":"Текст", "shot_at":"2026-08-26", "status":"published"}, headers=editor)
 fishka = await client.post("/api/v1/posts", json={"type":"fishka", "title":"Фишка вне ленты", "body":"Текст", "emoji":"💡", "status":"published"}, headers=editor)
 assert article.status_code == video.status_code == fishka.status_code == 201

 public_feed = await client.get("/api/v1/posts")
 assert public_feed.status_code == 200
 assert {item["id"] for item in public_feed.json()} == {article.json()["id"], video.json()["id"]}

 fishki = await client.get("/api/v1/posts?type=fishka")
 assert fishki.status_code == 200
 assert [item["id"] for item in fishki.json()] == [fishka.json()["id"]]

 author_posts = await client.get(f"/api/v1/posts?author_id={article.json()['author']['id']}")
 assert author_posts.status_code == 200
 assert {item["id"] for item in author_posts.json()} == {article.json()["id"], video.json()["id"], fishka.json()["id"]}


async def test_fishki_expose_categories_and_support_exact_category_filter(client, test_app):
 editor = await token(client, test_app, True)
 transfer = await client.post("/api/v1/posts", json={"type":"fishka", "title":"Трансфер", "body":"Текст", "emoji":"🚖", "category":"Трансфер и дорога в аэропорт", "status":"published"}, headers=editor)
 hotel = await client.post("/api/v1/posts", json={"type":"fishka", "title":"Заселение", "body":"Текст", "emoji":"🏨", "category":"Отель и заселение", "status":"published"}, headers=editor)
 legacy = await client.post("/api/v1/posts", json={"type":"fishka", "title":"Старая фишка", "body":"Текст", "emoji":"💡", "status":"published"}, headers=editor)
 assert transfer.status_code == hotel.status_code == legacy.status_code == 201
 assert transfer.json()["category"] == "Трансфер и дорога в аэропорт"
 assert legacy.json()["category"] is None

 filtered = await client.get("/api/v1/posts", params={"type":"fishka", "category":"Отель и заселение"})
 assert filtered.status_code == 200
 assert [item["id"] for item in filtered.json()] == [hotel.json()["id"]]

 categories = await client.get("/api/v1/posts/fishki/categories")
 assert categories.status_code == 200
 assert categories.json() == ["Трансфер и дорога в аэропорт", "Отель и заселение"]

async def test_cover_url_persists_through_patch_and_post_get_endpoints(client, test_app):
 editor = await token(client, test_app, True)
 published = await client.post("/api/v1/posts", json={"type":"article", "title":"С обложкой", "body":"Текст", "status":"published"}, headers=editor)
 assert published.status_code == 201

 cover_url = "/media/cover.webp"
 patched = await client.patch(f"/api/v1/posts/{published.json()['id']}", json={"cover_url": cover_url}, headers=editor)
 assert patched.status_code == 200
 assert patched.json()["cover_url"] == cover_url
 assert (await client.get("/api/v1/posts")).json()[0]["cover_url"] == cover_url
 assert (await client.get(f"/api/v1/posts/{published.json()['slug']}")).json()["cover_url"] == cover_url

 draft = await client.post("/api/v1/posts", json={"type":"article", "title":"Черновик с обложкой", "body":"Текст", "status":"draft"}, headers=editor)
 assert draft.status_code == 201
 assert (await client.patch(f"/api/v1/posts/{draft.json()['id']}", json={"cover_url": cover_url}, headers=editor)).status_code == 200
 assert (await client.get(f"/api/v1/posts/drafts/{draft.json()['id']}", headers=editor)).json()["cover_url"] == cover_url

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

async def test_rich_text_body_allows_only_the_strict_image_carousel_markup(client, test_app):
 editor = await token(client, test_app, True)
 body = '<figure data-carousel="images" class="evil" style="display:none" onclick="alert(1)" data-extra="x"><img src="/media/one.webp" alt="Первое" onclick="alert(1)"><img src="/media/two.webp" alt="Второе" style="display:none"></figure><script>alert(1)</script>'

 created = await client.post("/api/v1/posts", json={"type": "article", "title": "Карусель", "body": body, "status": "published"}, headers=editor)

 assert created.status_code == 201
 assert created.json()["body"] == '<figure data-carousel="images"><img src="/media/one.webp" alt="Первое"><img src="/media/two.webp" alt="Второе"></figure>'

def test_slugify_cyrillic_edge_letters():
 assert slugify("Щука, южная Ялта и ёлка") == "shchuka-yuzhnaya-yalta-i-yolka"


async def enable_fishka_submissions(test_app):
 async with test_app.state.database.session_factory() as s:
  setting = await s.get(Setting, "fishka_submissions_enabled")
  if setting is None:
   s.add(Setting(key="fishka_submissions_enabled", value="true"))
  else:
   setting.value = "true"
  await s.commit()


async def disable_fishka_submissions(test_app):
 async with test_app.state.database.session_factory() as s:
  setting = await s.get(Setting, "fishka_submissions_enabled")
  setting.value = "false"; await s.commit()


async def test_reader_can_submit_only_enabled_fishka_with_pending_status_and_emoji(client, test_app):
 reader = await token(client, test_app, user_id=501)
 payload = {"type":"fishka", "title":"Собирайте аптечку", "body":"Возьмите пластыри.", "emoji":"💡", "status":"published"}
 assert (await client.post("/api/v1/posts", json=payload, headers=reader)).status_code == 403
 await enable_fishka_submissions(test_app)

 created = await client.post("/api/v1/posts", json=payload, headers=reader)
 assert created.status_code == 201
 assert created.json()["type"] == "fishka"
 assert created.json()["emoji"] == "💡"
 assert created.json()["status"] == "pending"
 assert created.json()["published_at"] is None
 assert (await client.get("/api/v1/posts?type=fishka")).json() == []
 assert (await client.post("/api/v1/posts", json={**payload, "emoji":""}, headers=reader)).status_code == 422
 assert (await client.post("/api/v1/posts", json={**payload, "type":"article"}, headers=reader)).status_code == 403
 assert (await client.patch(f"/api/v1/posts/{created.json()['id']}", json={"status":"published"}, headers=reader)).status_code == 403


async def test_staff_publishes_fishka_immediately_and_moderates_reader_submission(client, test_app):
 reader = await token(client, test_app, user_id=502)
 await enable_fishka_submissions(test_app)
 pending = await client.post("/api/v1/posts", json={"type":"fishka", "title":"Проверить страховку", "body":"До оплаты.", "emoji":"🧳", "status":"published"}, headers=reader)
 assert pending.status_code == 201

 editor = await token(client, test_app, editor=True, user_id=503)
 await disable_fishka_submissions(test_app)
 published = await client.post("/api/v1/posts", json={"type":"fishka", "title":"Оплатить картой", "body":"Проверьте лимиты.", "emoji":"💳", "status":"published"}, headers=editor)
 assert published.status_code == 201
 assert published.json()["status"] == "published"
 assert published.json()["emoji"] == "💳"

 assert (await client.patch(f"/api/v1/posts/{pending.json()['id']}/moderate", json={"action":"approve"}, headers=reader)).status_code == 403
 approved = await client.patch(f"/api/v1/posts/{pending.json()['id']}/moderate", json={"action":"approve"}, headers=editor)
 assert approved.status_code == 200
 assert approved.json()["status"] == "published"
 await enable_fishka_submissions(test_app)
 rejected = await client.post("/api/v1/posts", json={"type":"fishka", "title":"Отклонить", "body":"На модерации.", "emoji":"⛔"}, headers=reader)
 assert rejected.status_code == 201
 rejection = await client.patch(f"/api/v1/posts/{rejected.json()['id']}/moderate", json={"action":"reject"}, headers=editor)
 assert rejection.status_code == 200
 assert rejection.json()["status"] == "rejected"
 assert {item["id"] for item in (await client.get("/api/v1/posts?type=fishka")).json()} == {pending.json()["id"], published.json()["id"]}
