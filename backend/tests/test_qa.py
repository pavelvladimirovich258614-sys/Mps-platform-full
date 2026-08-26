import hashlib
import hmac
import json
import time

import httpx
import pytest
import respx
from sqlalchemy import select

from app.models.notification import Notification
from app.models.question import Question


def telegram_payload():
    payload = {"id": 501, "first_name": "Клиент", "auth_date": int(time.time())}
    check = "\n".join(f"{key}={payload[key]}" for key in sorted(payload))
    payload["hash"] = hmac.new(hashlib.sha256(b"test-auth-bot-token").digest(), check.encode(), hashlib.sha256).hexdigest()
    return payload


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as async_client:
        yield async_client


async def headers(client):
    response = await client.post("/api/v1/auth/telegram", json=telegram_payload())
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


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
