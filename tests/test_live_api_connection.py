import pytest
import os
from backend.app.core.config import settings
from backend.app.connectors.quickcommerce import QuickCommerceConnector

@pytest.mark.asyncio
async def test_live_api_connection():
    """
    Live Data Test Rule:
    Makes an actual API call when QUICKCOMMERCE_API_KEY is configured.
    If the key is missing in test environment, SKIPS gracefully.
    NEVER substitutes with fake or mock data.
    """
    api_key = settings.QUICKCOMMERCE_API_KEY or os.getenv("QUICKCOMMERCE_API_KEY")
    if not api_key:
        pytest.skip("QUICKCOMMERCE_API_KEY not configured in environment. Skipping live network call gracefully per Zero-Mock policy.")

    connector = QuickCommerceConnector(api_key=api_key)
    res = await connector.test_connection()
    assert res is not None
    assert "latency_ms" in res
    assert "request_id" in res
