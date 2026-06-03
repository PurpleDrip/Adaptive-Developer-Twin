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

# All known service roots — used to isolate imports between services.
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


def _make_mock_col():
    col = MagicMock()
    col.find_one = AsyncMock(return_value=None)
    col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock-id"))
    col.update_one = AsyncMock(return_value=None)
    cursor = MagicMock()
    cursor.to_list = AsyncMock(return_value=[])
    col.find = MagicMock(return_value=cursor)
    return col


@pytest.fixture
async def mgmt_ctx():
    """Yields (client, mock_col) and mocks httpx so THG sync calls don't hit the network."""
    mock_redis = MagicMock()
    mock_redis.setex = MagicMock()
    mock_redis.get = MagicMock(return_value=None)

    mock_col = _make_mock_col()

    mock_httpx = MagicMock()
    mock_httpx.__aenter__ = AsyncMock(return_value=mock_httpx)
    mock_httpx.__aexit__ = AsyncMock(return_value=False)
    mock_httpx.post = AsyncMock(return_value=MagicMock(status_code=200))

    with _service_path_priority(_SERVICE_ROOT):
        with patch("redis.from_url", return_value=mock_redis), \
             patch("shared.database.mongo.connect_mongo", AsyncMock()), \
             patch("shared.database.mongo.close_mongo", AsyncMock()), \
             patch("shared.database.mongo.get_collection", return_value=mock_col), \
             patch("httpx.AsyncClient", return_value=mock_httpx):
            from app.main import app
            async with AsyncClient(
                transport=ASGITransport(app=app), base_url="http://test"
            ) as c:
                yield c, mock_col


@pytest.fixture
async def auth_app():
    mock_redis = MagicMock()
    mock_redis.setex = MagicMock()
    mock_redis.get = MagicMock(return_value=None)
    mock_redis.publish = MagicMock()

    mock_col = _make_mock_col()

    with _service_path_priority(_SERVICE_ROOT):
        with patch("redis.from_url", return_value=mock_redis), \
             patch("shared.database.mongo.connect_mongo", AsyncMock()), \
             patch("shared.database.mongo.close_mongo", AsyncMock()), \
             patch("shared.database.mongo.get_collection", return_value=mock_col):
            from app.main import app
            yield app


@pytest.fixture
async def client(auth_app):
    async with AsyncClient(
        transport=ASGITransport(app=auth_app), base_url="http://test"
    ) as c:
        yield c


class TestAuthHealthRoute:
    async def test_health_returns_200(self, client):
        resp = await client.get("/api/v1/auth/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


class TestLoginRoute:
    async def test_login_unknown_user_returns_401(self, client):
        resp = await client.post(
            "/api/v1/auth/users/login",
            json={"username": "ghost", "password": "wrong"},
        )
        assert resp.status_code == 401

    async def test_login_missing_fields_returns_422(self, client):
        resp = await client.post(
            "/api/v1/auth/users/login", json={"username": "alice"}
        )
        assert resp.status_code == 422


class TestRegisterRoute:
    VALID_PAYLOAD = {
        "name": "Test Dev",
        "username": "testdev_unique",
        "email": "testdev@example.com",
        "phone_number": "1234567890",
        "gender": "Male",
        "experience_level": "Mid",
        "password": "SecurePass123!",
        "strong_domains": ["backend"],
        "github_project_urls": [],
    }

    async def test_register_returns_201_and_extension_id(self, client):
        resp = await client.post(
            "/api/v1/auth/users/register", json=self.VALID_PAYLOAD
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "extension_id" in body
        assert body["extension_id"].startswith("ADT-")
        assert "user_id" in body

    async def test_register_missing_name_returns_422(self, client):
        data = {**self.VALID_PAYLOAD}
        del data["name"]
        resp = await client.post("/api/v1/auth/users/register", json=data)
        assert resp.status_code == 422


TECH_HEADER = {"X-User-Role": "tech"}


class TestManagersDirectory:
    async def test_list_managers_as_tech_returns_200_list(self, mgmt_ctx):
        client, col = mgmt_ctx
        col.find.return_value.to_list = AsyncMock(return_value=[
            {"user_id": "mgr_001", "name": "Aarav Kapoor", "department": "AI"}
        ])
        resp = await client.get("/api/v1/auth/users/managers", headers=TECH_HEADER)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert body[0]["user_id"] == "mgr_001"

    async def test_list_managers_forbidden_for_developer(self, mgmt_ctx):
        client, _ = mgmt_ctx
        resp = await client.get(
            "/api/v1/auth/users/managers", headers={"X-User-Role": "developer"}
        )
        assert resp.status_code == 403


class TestCreateManager:
    VALID = {
        "name": "Nora Manager",
        "username": "nora.manager",
        "email": "nora.manager@adt.ai",
        "phone_number": "9876543210",
        "gender": "Female",
        "department": "Backend",
        "password": "SecurePass123!",
    }

    async def test_create_manager_valid_returns_201(self, mgmt_ctx):
        client, col = mgmt_ctx
        col.find_one = AsyncMock(return_value=None)  # no duplicate
        resp = await client.post(
            "/api/v1/auth/admin/create-manager", json=self.VALID, headers=TECH_HEADER
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["role"] == "manager"
        assert body["user_id"].startswith("mgr_")
        # Verify it was written to the managers collection (insert called once)
        col.insert_one.assert_awaited_once()

    async def test_create_manager_duplicate_returns_400(self, mgmt_ctx):
        client, col = mgmt_ctx
        col.find_one = AsyncMock(return_value={"username": "nora.manager"})
        resp = await client.post(
            "/api/v1/auth/admin/create-manager", json=self.VALID, headers=TECH_HEADER
        )
        assert resp.status_code == 400

    async def test_create_manager_missing_department_returns_422(self, mgmt_ctx):
        client, _ = mgmt_ctx
        data = {**self.VALID}
        del data["department"]
        resp = await client.post(
            "/api/v1/auth/admin/create-manager", json=data, headers=TECH_HEADER
        )
        assert resp.status_code == 422

    async def test_create_manager_forbidden_for_developer(self, mgmt_ctx):
        client, _ = mgmt_ctx
        resp = await client.post(
            "/api/v1/auth/admin/create-manager",
            json=self.VALID,
            headers={"X-User-Role": "developer"},
        )
        assert resp.status_code == 403


class TestAssignManager:
    async def test_assign_manager_returns_success(self, mgmt_ctx):
        client, _ = mgmt_ctx
        resp = await client.post(
            "/api/v1/auth/users/assign-manager",
            params={"developer_id": "dev_001", "manager_id": "mgr_001"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"
