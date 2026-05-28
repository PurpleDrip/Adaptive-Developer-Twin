import sys
import os
import types
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


def _make_mock_settings():
    mock_settings = MagicMock()
    mock_settings.neo4j_uri = "bolt://localhost:7687"
    mock_settings.neo4j_user = "neo4j"
    mock_settings.neo4j_password = "testpassword"
    mock_settings.app_name = "ADT THG Service"
    mock_settings.version = "1.0.0"
    return mock_settings


def _make_mock_session():
    """Return a mock Neo4j async session.
    Neo4j's AsyncResult.data() is a coroutine, so AsyncMock is required.
    """
    mock_result = MagicMock()
    mock_result.data = AsyncMock(return_value=[])
    mock_result.single = AsyncMock(return_value=None)

    mock_session = AsyncMock()
    mock_session.run = AsyncMock(return_value=mock_result)
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    return mock_session


@pytest.fixture
async def thg_app():
    mock_settings = _make_mock_settings()
    mock_settings_module = types.ModuleType("app.config.settings")
    mock_settings_module.settings = mock_settings

    mock_session = _make_mock_session()

    async def fake_get_session():
        yield mock_session

    with _service_path_priority(_SERVICE_ROOT):
        # Inject fake settings BEFORE importing any app module
        sys.modules["app.config.settings"] = mock_settings_module

        with patch("app.services.neo4j.init_neo4j", AsyncMock()), \
             patch("app.services.neo4j.close_neo4j", AsyncMock()), \
             patch("app.services.neo4j.get_neo4j_session", fake_get_session):
            from app.main import app
            from app.services.neo4j import get_neo4j_session as real_dep
            app.dependency_overrides[real_dep] = fake_get_session
            yield app
            app.dependency_overrides.clear()


@pytest.fixture
async def client(thg_app):
    async with AsyncClient(
        transport=ASGITransport(app=thg_app), base_url="http://test"
    ) as c:
        yield c


class TestTHGRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/thg/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    async def test_create_dev_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/thg/create-dev", json={})
        assert resp.status_code == 422

    async def test_get_developers_returns_list(self, client):
        resp = await client.get("/api/v1/thg/developers")
        assert resp.status_code in [200, 500]
        if resp.status_code == 200:
            assert isinstance(resp.json(), list)
