import sys
import os

# Add project root and service root so both 'shared' and 'app' resolve correctly
_PROJECT_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..', '..')
_SERVICE_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
for p in (_PROJECT_ROOT, _SERVICE_ROOT):
    p = os.path.abspath(p)
    if p not in sys.path:
        sys.path.insert(0, p)

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.integration


def _make_mock_col():
    """Returns a fresh mock collection for each fixture invocation."""
    col = MagicMock()
    col.find_one = AsyncMock(return_value=None)
    col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock-id"))
    col.update_one = AsyncMock(return_value=None)
    return col


@pytest.fixture
async def auth_app():
    mock_redis = MagicMock()
    mock_redis.setex = MagicMock()
    mock_redis.get = MagicMock(return_value=None)
    mock_redis.publish = MagicMock()

    mock_col = _make_mock_col()

    # Must patch redis.from_url BEFORE 'app.routers.users' is imported because
    # the module creates r_client = redis.from_url(...) at module level.
    with patch("redis.from_url", return_value=mock_redis), \
         patch("shared.database.mongo.connect_mongo", AsyncMock()), \
         patch("shared.database.mongo.close_mongo", AsyncMock()), \
         patch("shared.database.mongo.get_collection", return_value=mock_col):
        # Force re-import so patches are applied to a fresh module state.
        for mod_name in list(sys.modules.keys()):
            if mod_name.startswith("app.") or mod_name == "app":
                del sys.modules[mod_name]

        from app.main import app  # relative to backend/auth (service root in sys.path)
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
