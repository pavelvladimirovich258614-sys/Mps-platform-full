import httpx
import pytest
from respx.models import AllMockedAssertionError


async def test_unmocked_http_request_is_blocked():
    """Тестовый раннер не должен разрешать выход в реальную сеть."""
    async with httpx.AsyncClient() as client:
        with pytest.raises(AllMockedAssertionError):
            await client.get("https://example.com")
