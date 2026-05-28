import sys
import os
import contextlib
import importlib

# Structure: backend/<service>/test/integration/test_routes.py
#   service root = 2 dirs up   (backend/<service>)
#   project root = 4 dirs up   (ADT-v1/)
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
_SERVICE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

for p in (_PROJECT_ROOT, _SERVICE_ROOT):
    if p not in sys.path:
        sys.path.insert(0, p)

_ALL_SERVICE_ROOTS = [
    os.path.abspath(os.path.join(_PROJECT_ROOT, 'backend', svc))
    for svc in ['auth', 'telemetry', 'thg', 'monitoring', 'task',
                'fusion', 'allocation', 'analytics', 'gateway']
]

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration

MOCK_CONFIG = {
    "batch_interval_minutes": 5,
    "heartbeat_interval_seconds": 30,
    "is_monitoring_paused": False,
    "office_network_whitelist": ["127.0.0.1"],
    "shec_handshake_interval_ms": 5000,
}


@contextlib.contextmanager
def _service_path_priority(service_root: str):
    """Temporarily prioritize service_root and exclude all other service roots from sys.path."""
    saved_entries = [p for p in sys.path if p in _ALL_SERVICE_ROOTS]
    clean_path = [p for p in sys.path if p not in _ALL_SERVICE_ROOTS]
    sys.path[:] = [service_root] + clean_path

    for k in list(sys.modules.keys()):
        if k.startswith("app.") or k == "app":
            del sys.modules[k]
    importlib.invalidate_caches()

    try:
        yield
    finally:
        sys.path[:] = clean_path
        for p in saved_entries:
            if p not in sys.path:
                sys.path.append(p)
        for k in list(sys.modules.keys()):
            if k.startswith("app.") or k == "app":
                del sys.modules[k]
        importlib.invalidate_caches()


@pytest.fixture
async def monitoring_app():
    mock_col = MagicMock()
    mock_col.find_one = AsyncMock(return_value=MOCK_CONFIG)
    mock_col.update_one = AsyncMock(return_value=None)

    mock_audit_cursor = MagicMock()
    mock_audit_cursor.__aiter__ = MagicMock(return_value=iter([]))
    mock_col.find = MagicMock(return_value=mock_audit_cursor)

    mock_redis = MagicMock()
    mock_pubsub = AsyncMock()
    mock_pubsub.__aenter__ = AsyncMock(return_value=mock_pubsub)
    mock_pubsub.__aexit__ = AsyncMock(return_value=None)
    mock_redis.pubsub = MagicMock(return_value=mock_pubsub)

    with _service_path_priority(_SERVICE_ROOT):
        with patch("redis.asyncio.from_url", return_value=mock_redis), \
             patch("shared.database.mongo.connect_mongo", AsyncMock()), \
             patch("shared.database.mongo.close_mongo", AsyncMock()), \
             patch("shared.database.mongo.get_collection", return_value=mock_col):
            from app.main import app
            yield app


@pytest.fixture
async def client(monitoring_app):
    async with AsyncClient(
        transport=ASGITransport(app=monitoring_app), base_url="http://test"
    ) as c:
        yield c


class TestMonitoringRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/monitoring/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

    async def test_system_config_returns_200(self, client):
        resp = await client.get("/api/v1/monitoring/system-config")
        assert resp.status_code == 200
        data = resp.json()
        assert "batch_interval_minutes" in data

    async def test_audit_log_returns_list(self, client):
        resp = await client.get("/api/v1/monitoring/audit-log")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
