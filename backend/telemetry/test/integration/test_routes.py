import sys
import os

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
_SERVICE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
for p in (_PROJECT_ROOT, _SERVICE_ROOT):
    if p not in sys.path:
        sys.path.insert(0, p)

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration


@pytest.fixture
async def telemetry_app():
    mock_col = MagicMock()
    mock_col.find_one = AsyncMock(return_value={
        "extension_id": "ADT-TEST1234",
        "user_id": "u1",
        "is_active": True,
        "machine_id": None,
    })
    mock_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="id"))
    mock_col.count_documents = AsyncMock(return_value=5)
    mock_col.update_one = AsyncMock(return_value=None)

    mock_bp = MagicMock()
    mock_bp.start = MagicMock()

    # Clear cached app modules so patches apply to a fresh import
    for mod_name in list(sys.modules.keys()):
        if mod_name.startswith("app.") or mod_name == "app":
            del sys.modules[mod_name]

    with patch("shared.database.mongo.connect_mongo", AsyncMock()), \
         patch("shared.database.mongo.close_mongo", AsyncMock()), \
         patch("shared.database.mongo.get_collection", return_value=mock_col), \
         patch("app.services.batch_processor.BatchProcessor", return_value=mock_bp):
        from app.main import app
        yield app


@pytest.fixture
async def client(telemetry_app):
    async with AsyncClient(
        transport=ASGITransport(app=telemetry_app), base_url="http://test"
    ) as c:
        yield c


class TestTelemetryRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/telemetry/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    async def test_status_endpoint_returns_count(self, client):
        resp = await client.get("/api/v1/telemetry/telemetry/status/ADT-TEST1234")
        assert resp.status_code == 200
        assert "pending_records" in resp.json()

    async def test_handshake_missing_params_returns_422(self, client):
        # handshake requires query params: extension_id, current_hash, machine_id
        resp = await client.post("/api/v1/telemetry/telemetry/handshake")
        assert resp.status_code == 422

    async def test_ingest_missing_body_returns_422(self, client):
        # ingest requires a TelemetryIngestDTO body; empty dict fails validation
        resp = await client.post("/api/v1/telemetry/telemetry/ingest", json={})
        assert resp.status_code == 422
