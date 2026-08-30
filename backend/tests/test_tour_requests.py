import json
import logging

import httpx
import pytest
import respx
from sqlalchemy import text


VALID_REQUEST = {
    "name": "Анна",
    "contact": "+7 900 000-00-00",
    "destination": "Таиланд",
    "budget": "до 200 000 ₽",
    "comment": "Отель у моря",
    "personal_data_consent": True,
}


@pytest.fixture
async def client(test_app):
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=test_app, raise_app_exceptions=False),
        base_url="http://test",
    ) as async_client:
        yield async_client


@respx.mock
async def test_public_tour_request_is_sanitized_persisted_and_relayed_to_managers(client, test_app):
    relay = respx.post("https://api.telegram.org/bottest-relay-bot-token/sendMessage").mock(
        return_value=httpx.Response(200, json={"ok": True, "result": {"message_id": 501}})
    )

    response = await client.post(
        "/api/v1/tour-requests",
        json={
            "name": "  <b>Анна</b><script>alert(1)</script>  ",
            "contact": "<i>@anna_travel</i>",
            "destination": "<strong>Таиланд</strong>",
            "budget": "<span>до 200 000 ₽</span>",
            "comment": "<p>Отель у моря</p>",
            "personal_data_consent": True,
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "new"
    assert response.json()["tg_message_id"] == 501
    assert relay.call_count == 1
    telegram_payload = json.loads(relay.calls[0].request.content)
    assert telegram_payload["chat_id"] == "-100100"
    assert "#T" in telegram_payload["text"]
    assert "Анна" in telegram_payload["text"]
    assert "@anna_travel" in telegram_payload["text"]
    assert "<script" not in telegram_payload["text"]

    async with test_app.state.database.session_factory() as session:
        row = (
            await session.execute(
                text(
                    "SELECT user_id, name, contact, destination, budget, comment, status, "
                    "tg_message_id, personal_data_consent FROM tour_requests"
                )
            )
        ).mappings().one()
    assert row == {
        "user_id": None,
        "name": "Анна",
        "contact": "@anna_travel",
        "destination": "Таиланд",
        "budget": "до 200 000 ₽",
        "comment": "Отель у моря",
        "status": "NEW",
        "tg_message_id": 501,
        "personal_data_consent": True,
    }


@pytest.mark.parametrize(
    "payload",
    [
        {key: value for key, value in VALID_REQUEST.items() if key != "personal_data_consent"},
        {**VALID_REQUEST, "personal_data_consent": False},
        {**VALID_REQUEST, "name": "А" * 101},
        {**VALID_REQUEST, "contact": "1" * 256},
        {**VALID_REQUEST, "destination": "<script>удалить</script>"},
        {**VALID_REQUEST, "budget": "1" * 101},
        {**VALID_REQUEST, "comment": "К" * 2001},
    ],
)
async def test_tour_request_validates_lengths_clean_content_and_required_consent(client, payload):
    response = await client.post("/api/v1/tour-requests", json=payload)

    assert response.status_code == 422


@respx.mock
async def test_tour_request_relay_failure_keeps_lead_and_hides_token(client, test_app, caplog):
    relay_token = test_app.state.settings.relay_bot_token
    respx.post(f"https://api.telegram.org/bot{relay_token}/sendMessage").mock(
        return_value=httpx.Response(503, json={"ok": False})
    )
    caplog.set_level(logging.ERROR, logger="app.services.tg_relay")

    response = await client.post("/api/v1/tour-requests", json=VALID_REQUEST)

    assert response.status_code == 502
    assert response.json() == {
        "detail": "Заявка сохранена, но уведомление менеджеру временно не доставлено"
    }
    assert relay_token not in response.text
    assert relay_token not in caplog.text
    async with test_app.state.database.session_factory() as session:
        row = (
            await session.execute(text("SELECT status, tg_message_id FROM tour_requests"))
        ).mappings().one()
    assert row == {"status": "NEW", "tg_message_id": None}


@respx.mock
async def test_tour_request_rate_limit_is_per_ip(client):
    respx.post("https://api.telegram.org/bottest-relay-bot-token/sendMessage").mock(
        return_value=httpx.Response(200, json={"ok": True, "result": {"message_id": 502}})
    )

    responses = [
        await client.post(
            "/api/v1/tour-requests",
            headers={"X-Real-IP": "203.0.113.10"},
            json={**VALID_REQUEST, "name": f"Клиент {index}"},
        )
        for index in range(6)
    ]
    other_ip = await client.post(
        "/api/v1/tour-requests",
        headers={"X-Real-IP": "203.0.113.11"},
        json={**VALID_REQUEST, "name": "Другой клиент"},
    )

    assert all(response.status_code == 201 for response in responses[:5])
    assert responses[-1].status_code == 429
    assert other_ip.status_code == 201
    assert responses[-1].json()["detail"] == "Слишком много запросов. Попробуйте через минуту."
