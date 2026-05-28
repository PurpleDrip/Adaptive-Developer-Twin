import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

import pytest
from unittest.mock import MagicMock
from backend.gateway.app.main import IPWhitelistMiddleware

pytestmark = pytest.mark.unit


@pytest.fixture
def middleware():
    app_mock = MagicMock()
    mw = IPWhitelistMiddleware(app_mock, monitoring_url="http://mock-monitoring:8000")
    mw._whitelist = ["127.0.0.1", "::1", "10.0.0.0/8", "192.168.1.0/24"]
    return mw


class TestIsAllowed:
    def test_localhost_ipv4_allowed(self, middleware):
        assert middleware._is_allowed("127.0.0.1") is True

    def test_localhost_ipv6_allowed(self, middleware):
        assert middleware._is_allowed("::1") is True

    def test_office_network_cidr_allowed(self, middleware):
        assert middleware._is_allowed("10.0.1.5") is True
        assert middleware._is_allowed("10.255.255.255") is True

    def test_subnet_192_168_1_x_allowed(self, middleware):
        assert middleware._is_allowed("192.168.1.100") is True

    def test_external_ip_blocked(self, middleware):
        assert middleware._is_allowed("8.8.8.8") is False
        assert middleware._is_allowed("203.0.113.1") is False

    def test_invalid_ip_blocked(self, middleware):
        assert middleware._is_allowed("not-an-ip") is False

    def test_empty_whitelist_blocks_all(self, middleware):
        middleware._whitelist = []
        assert middleware._is_allowed("127.0.0.1") is False

    def test_exact_ip_entry_allowed(self, middleware):
        middleware._whitelist = ["192.168.50.10"]
        assert middleware._is_allowed("192.168.50.10") is True
        assert middleware._is_allowed("192.168.50.11") is False
