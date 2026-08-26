import hashlib
import hmac
import json
import logging
import time
from datetime import UTC, datetime

import httpx
import pytest
import respx
from sqlalchemy import select

from app.models.notification import Notification
from app.models.question import Question, QuestionTarget
from app.models.user import User
from app.services import tg_relay


def telegram_payload(user_id: int = 501):
    payload = {"id": user_id, "first_name": "Клиент", "auth_date": int(time.time())}
    check = "\n".join(f"{key}={payload[key]}" for key in sorted(payload))
    payload["hash"] = hmac.new(hashlib.sha256(b"test-auth-bot-token").digest(), check.encode(), hashlib.sha256).hexdigest()
    return payload


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as async_client:
        yield async_client


async def headers(client, user_id: int = 501):
    response = await client.post("/api/v1/auth/telegram", json=telegram_payload(user_id))
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


async def open_question(test_app, target: QuestionTarget) -> int:
    async with test_app.state.database.session_factory() as session:
        user = User(email=f"webhook-{target.value}@example.com", name="Клиент")
        session.add(user)
        await session.flush()
        question = Question(user_id=user.id, target=target, body="Нужен ответ")
        session.add(question)
        await session.commit()
        return question.id


def telegram_reply_payload(question_id: int, chat_id: int) -> dict:
    return {
        "update_id": 10,
        "message": {
            "message_id": 20,
            "from": {"id": 30, "first_name": "Павел", "last_name": "Менеджеров"},
            "chat": {"id": chat_id, "type": "supergroup"},
            "text": "Ответ из Telegram",
            "reply_to_message": {"message_id": 19, "text": f"#Q{question_id}\nНужен ответ"},
        },
    }


@pytest.mark.parametrize("secret", [None, "wrong-secret"])
async def test_telegram_webhook_rejects_missing_or_invalid_secret(client, test_app, secret):
    question_id = await open_question(test_app, QuestionTarget.MANAGER)
    headers = {} if secret is None else {"X-Telegram-Bot-Api-Secret-Token": secret}

    response = await client.post(
        "/api/v1/internal/telegram-webhook",
        headers=headers,
        json=telegram_reply_payload(question_id, -100100),
    )

    assert response.status_code == 401
    async with test_app.state.database.session_factory() as session:
        assert (await session.get(Question, question_id)).answer is None


@pytest.mark.parametrize(
    ("target", "chat_id"),
    [(QuestionTarget.MANAGER, -100100), (QuestionTarget.LAWYER, 200200)],
)
async def test_telegram_webhook_saves_manager_and_lawyer_replies(client, test_app, target, chat_id):
    question_id = await open_question(test_app, target)

    response = await client.post(
        "/api/v1/internal/telegram-webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-test-secret"},
        json=telegram_reply_payload(question_id, chat_id),
    )

    assert response.status_code == 200
    async with test_app.state.database.session_factory() as session:
        question = await session.get(Question, question_id)
        assert question.answer == "Ответ из Telegram"
        assert question.answered_by_name == "Павел Менеджеров"


@respx.mock
async def test_telegram_relay_error_logs_without_bot_token(test_app, caplog):
    relay_token = test_app.state.settings.relay_bot_token
    route = respx.post(f"https://api.telegram.org/bot{relay_token}/sendMessage").mock(
        return_value=httpx.Response(503, json={"ok": False})
    )
    question = Question(id=77, target=QuestionTarget.MANAGER, body="Проверка")
    caplog.set_level(logging.ERROR, logger="app.services.tg_relay")

    with pytest.raises(Exception) as error:
        await tg_relay.send(test_app.state.settings, question)

    assert route.called
    assert relay_token not in str(error.value)
    assert "Telegram relay failed" in caplog.text
    assert relay_token not in caplog.text


@respx.mock
async def test_qa_relay_answer_and_notification(client):
    route = respx.post("https://api.telegram.org/bottest-relay-bot-token/sendMessage").mock(return_value=httpx.Response(200, json={"ok": True, "result": {"message_id": 88}}))
    created = await client.post("/api/v1/qa", headers=await headers(client), json={"target": "manager", "body": "Нужна помощь"})
    assert created.status_code == 201
    question_id = created.json()["id"]
    assert route.called and f"#Q{question_id}" in json.loads(route.calls[0].request.content)["text"]
    mine = await client.get("/api/v1/qa/my", headers=await headers(client))
    assert mine.json()[0]["tg_message_id"] == 88
    answered = await client.post("/api/v1/internal/qa-answer", headers={"X-Bot-Bridge-Secret": "bridge-secret"}, json={"question_id": question_id, "answer": "Ответ", "answered_by_name": "Менеджер"})
    assert answered.status_code == 200
    assert answered.json()["status"] == "answered"
    assert (await client.get("/api/v1/qa/my", headers=await headers(client))).json()[0]["answer"] == "Ответ"


async def test_qa_rejects_invalid_target_and_secret(client):
    assert (await client.post("/api/v1/qa", headers=await headers(client), json={"target": "other", "body": "x"})).status_code == 422
    assert (await client.post("/api/v1/internal/qa-answer", json={"question_id": 1, "answer": "x", "answered_by_name": "x"})).status_code == 401


async def test_archive_my_questions_hides_them_without_deleting_or_touching_foreign_rows(client, test_app):
    owner_headers = await headers(client, 601)
    foreign_headers = await headers(client, 602)
    async with test_app.state.database.session_factory() as session:
        owner = await session.scalar(select(User).where(User.tg_id == 601))
        foreign = await session.scalar(select(User).where(User.tg_id == 602))
        own_questions = [
            Question(user_id=owner.id, target=QuestionTarget.MANAGER, body="Первый вопрос"),
            Question(user_id=owner.id, target=QuestionTarget.LAWYER, body="Второй вопрос"),
        ]
        foreign_question = Question(user_id=foreign.id, target=QuestionTarget.MANAGER, body="Чужой вопрос")
        session.add_all([*own_questions, foreign_question])
        await session.commit()
        own_ids = [question.id for question in own_questions]
        foreign_id = foreign_question.id

    assert (await client.patch("/api/v1/qa/my/archive")).status_code == 401
    response = await client.patch("/api/v1/qa/my/archive", headers=owner_headers)

    assert response.status_code == 200
    assert response.json() == {"archived_count": 2}
    assert (await client.get("/api/v1/qa/my", headers=owner_headers)).json() == []
    assert [item["id"] for item in (await client.get("/api/v1/qa/my", headers=foreign_headers)).json()] == [foreign_id]
    async with test_app.state.database.session_factory() as session:
        archived = [await session.get(Question, question_id) for question_id in own_ids]
        untouched = await session.get(Question, foreign_id)
        assert all(question is not None and question.archived_at is not None for question in archived)
        assert untouched is not None and untouched.archived_at is None


async def test_late_telegram_reply_restores_an_archived_question(client, test_app):
    owner_headers = await headers(client, 603)
    async with test_app.state.database.session_factory() as session:
        owner = await session.scalar(select(User).where(User.tg_id == 603))
        question = Question(
            user_id=owner.id,
            target=QuestionTarget.MANAGER,
            body="Архивированный открытый вопрос",
            archived_at=datetime.now(UTC),
        )
        session.add(question)
        await session.commit()
        question_id = question.id

    response = await client.post(
        "/api/v1/internal/telegram-webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-test-secret"},
        json=telegram_reply_payload(question_id, -100100),
    )

    assert response.status_code == 200
    async with test_app.state.database.session_factory() as session:
        restored = await session.get(Question, question_id)
        assert restored.answer == "Ответ из Telegram"
        assert restored.archived_at is None
        notification = await session.scalar(select(Notification).where(Notification.user_id == owner.id))
        assert notification is not None and notification.payload == {"question_id": question_id}
    assert [item["id"] for item in (await client.get("/api/v1/qa/my", headers=owner_headers)).json()] == [question_id]


@respx.mock
async def test_qa_answer_is_idempotent_only_for_exactly_matching_payload(client, test_app):
    respx.post("https://api.telegram.org/bottest-relay-bot-token/sendMessage").mock(
        return_value=httpx.Response(200, json={"ok": True, "result": {"message_id": 89}})
    )
    created = await client.post("/api/v1/qa", headers=await headers(client), json={"target": "manager", "body": "Нужна помощь"})
    question_id = created.json()["id"]
    payload = {"question_id": question_id, "answer": "Точный ответ", "answered_by_name": "Менеджер"}

    assert (await client.post("/api/v1/internal/qa-answer", headers={"X-Bot-Bridge-Secret": "bridge-secret"}, json=payload)).status_code == 200
    assert (await client.post("/api/v1/internal/qa-answer", headers={"X-Bot-Bridge-Secret": "bridge-secret"}, json=payload)).status_code == 200
    conflicting = await client.post(
        "/api/v1/internal/qa-answer",
        headers={"X-Bot-Bridge-Secret": "bridge-secret"},
        json={**payload, "answer": "Точный ответ "},
    )
    assert conflicting.status_code == 409
    async with test_app.state.database.session_factory() as session:
        notifications = (await session.scalars(select(Notification))).all()
        assert len(notifications) == 1
        question = await session.get(Question, question_id)
        assert question.answer == "Точный ответ"
        assert question.answered_by_name == "Менеджер"


@respx.mock
async def test_irishka_answers_with_relevant_knowledge_without_creating_question(client, test_app):
    route = respx.post("https://api.minimax.io/v1/chat/completions").mock(
        return_value=httpx.Response(200, json={"choices": [{"message": {"content": "В Шардже много пляжей."}}]})
    )

    response = await client.post(
        "/api/v1/qa/irishka",
        headers=await headers(client),
        json={"text": "Что посмотреть в Шарджу?"},
    )

    assert response.status_code == 200
    assert response.json() == {"answer": "В Шардже много пляжей."}
    assert route.call_count == 1
    payload = json.loads(route.calls[0].request.content)
    assert "Шарджа" in payload["messages"][0]["content"]
    assert "Что посмотреть в Шарджу?" == payload["messages"][1]["content"]
    async with test_app.state.database.session_factory() as session:
        assert (await session.scalars(select(Question))).all() == []


@pytest.mark.parametrize(
    ("raw_answer", "visible_answer"),
    [
        ("<think>Internal reasoning that must stay hidden.</think>\nФинальный ответ для путешественника.", "Финальный ответ для путешественника."),
        ("Ответ без reasoning возвращается как есть.", "Ответ без reasoning возвращается как есть."),
        ("<think>Незакрытый служебный блок", "<think>Незакрытый служебный блок"),
    ],
)
@respx.mock
async def test_irishka_hides_only_a_closed_leading_reasoning_block(client, raw_answer, visible_answer):
    respx.post("https://api.minimax.io/v1/chat/completions").mock(
        return_value=httpx.Response(200, json={"choices": [{"message": {"content": raw_answer}}]})
    )

    response = await client.post(
        "/api/v1/qa/irishka",
        headers=await headers(client),
        json={"text": "Что посмотреть в Шардже?"},
    )

    assert response.status_code == 200
    assert response.json() == {"answer": visible_answer}


@respx.mock
async def test_irishka_rejects_irrelevant_question_without_minimax_call(client):
    route = respx.post("https://api.minimax.io/v1/chat/completions").mock(
        return_value=httpx.Response(200, json={"choices": [{"message": {"content": "Не должен быть вызван"}}]})
    )

    response = await client.post(
        "/api/v1/qa/irishka",
        headers=await headers(client),
        json={"text": "Какая погода на Марсе?"},
    )

    assert response.status_code == 200
    assert "менеджер" in response.json()["answer"].casefold()
    assert route.call_count == 0


async def test_irishka_rate_limit_is_per_authenticated_user(client):
    auth_headers = await headers(client)
    responses = [
        await client.post("/api/v1/qa/irishka", headers=auth_headers, json={"text": f"qxznottravel{index}"})
        for index in range(11)
    ]

    assert all(response.status_code == 200 for response in responses[:10])
    assert responses[-1].status_code == 429
    assert responses[-1].json()["detail"] == "Слишком много запросов. Попробуйте через минуту."
