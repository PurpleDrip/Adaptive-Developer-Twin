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

pytestmark = pytest.mark.integration


@contextlib.contextmanager
def _service_path_priority(service_root: str):
    """Temporarily prioritize service_root and exclude all other service roots."""
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
async def fusion_app():
    # Fusion has no external dependencies at startup — no DB, no Redis.
    with _service_path_priority(_SERVICE_ROOT):
        from app.main import app
        yield app


@pytest.fixture
async def client(fusion_app):
    async with AsyncClient(
        transport=ASGITransport(app=fusion_app), base_url="http://test"
    ) as c:
        yield c


class TestFusionRoutes:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/fusion/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    async def test_analyze_text_missing_body_returns_422(self, client):
        # The route expects a dict with a "text" key; an empty dict should still
        # return 200 (the route handles missing "text" gracefully via .get()),
        # but an entirely missing body returns 422.
        resp = await client.post("/api/v1/fusion/fusion/analyze-text")
        assert resp.status_code == 422

    async def test_analyze_text_with_text_returns_vector(self, client):
        resp = await client.post(
            "/api/v1/fusion/fusion/analyze-text",
            json={"text": "Build a REST API with FastAPI and PostgreSQL"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "vector" in body
        assert isinstance(body["vector"], dict)
