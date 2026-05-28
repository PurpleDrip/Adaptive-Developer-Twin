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
async def task_app():
    mock_col = MagicMock()
    mock_col.find_one = AsyncMock(return_value=None)
    mock_col.find = MagicMock(return_value=MagicMock(to_list=AsyncMock(return_value=[])))
    mock_col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="id"))

    with _service_path_priority(_SERVICE_ROOT):
        with patch("shared.database.mongo.connect_mongo", AsyncMock()), \
             patch("shared.database.mongo.close_mongo", AsyncMock()), \
             patch("shared.database.mongo.get_collection", return_value=mock_col):
            from app.main import app
            yield app


@pytest.fixture
async def client(task_app):
    async with AsyncClient(
        transport=ASGITransport(app=task_app), base_url="http://test"
    ) as c:
        yield c


class TestTaskRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/task/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    async def test_match_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/task/match", json={})
        assert resp.status_code == 422

    async def test_create_task_missing_body_returns_422(self, client):
        resp = await client.post("/api/v1/task/create", json={})
        assert resp.status_code == 422
