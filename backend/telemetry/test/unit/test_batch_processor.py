import sys
import os

# Structure: backend/<service>/test/unit/test_X.py
#   service root = 2 dirs up   (backend/<service>)
#   project root = 4 dirs up   (ADT-v1/)
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
_SERVICE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
for p in (_PROJECT_ROOT, _SERVICE_ROOT):
    if p not in sys.path:
        sys.path.insert(0, p)

import contextlib
import importlib
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

pytestmark = pytest.mark.unit

_ALL_SERVICE_ROOTS = [
    os.path.abspath(os.path.join(_PROJECT_ROOT, 'backend', svc))
    for svc in ['auth', 'telemetry', 'thg', 'monitoring', 'task',
                'fusion', 'allocation', 'analytics', 'gateway']
]


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


def _reimport_batch_processor():
    """Force a fresh import of batch_processor so env patching takes effect."""
    # Ensure only telemetry service root is active before reimport
    saved = [p for p in sys.path if p in _ALL_SERVICE_ROOTS]
    clean = [p for p in sys.path if p not in _ALL_SERVICE_ROOTS]
    sys.path[:] = [_SERVICE_ROOT] + clean
    importlib.invalidate_caches()

    for mod_name in list(sys.modules.keys()):
        if 'batch_processor' in mod_name or (mod_name.startswith("app.") or mod_name == "app"):
            del sys.modules[mod_name]

    import app.services.batch_processor as bpm

    # Restore paths
    sys.path[:] = clean
    for p in saved:
        if p not in sys.path:
            sys.path.append(p)
    return bpm


class TestBatchProcessorInit:
    def test_init_uses_env_interval(self):
        with patch.dict("os.environ", {"BATCH_INTERVAL_MINUTES": "10"}, clear=False):
            bpm = _reimport_batch_processor()
            bp = bpm.BatchProcessor()
            assert bp.batch_interval == 10

    def test_init_defaults_to_5_minutes(self):
        saved = os.environ.pop("BATCH_INTERVAL_MINUTES", None)
        try:
            bpm = _reimport_batch_processor()
            bp = bpm.BatchProcessor()
            assert bp.batch_interval == 5
        finally:
            if saved is not None:
                os.environ["BATCH_INTERVAL_MINUTES"] = saved


class TestBatchProcessorProcessBatches:
    async def test_process_batches_skips_when_paused(self):
        """When _fetch_and_apply_config returns False (paused), find is never called."""
        from app.services.batch_processor import BatchProcessor

        bp = BatchProcessor()
        bp._fetch_and_apply_config = AsyncMock(return_value=False)

        mock_col = MagicMock()
        mock_col.find = MagicMock()

        with patch("app.services.batch_processor.get_collection", return_value=mock_col):
            await bp.process_batches()

        mock_col.find.assert_not_called()

    async def test_process_batches_returns_early_when_no_telemetry(self):
        """When there are no unprocessed records, processing stops after the empty check."""
        from app.services.batch_processor import BatchProcessor

        bp = BatchProcessor()
        bp._fetch_and_apply_config = AsyncMock(return_value=True)

        # Cursor mock: .find(...) returns a cursor, cursor.to_list() returns []
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[])

        mock_col = MagicMock()
        mock_col.find = MagicMock(return_value=mock_cursor)
        mock_col.insert_one = AsyncMock()

        # Patch get_collection in the batch_processor's own module namespace
        with patch("app.services.batch_processor.get_collection", return_value=mock_col):
            await bp.process_batches()

        # insert_one should NOT have been called (no records to batch)
        mock_col.insert_one.assert_not_called()

    async def test_fetch_and_apply_config_returns_true_on_http_failure(self):
        """If the monitoring endpoint is unreachable, returns True (don't pause)."""
        from app.services.batch_processor import BatchProcessor

        bp = BatchProcessor()

        import httpx

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.__aenter__ = AsyncMock(side_effect=httpx.ConnectError("unreachable"))
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await bp._fetch_and_apply_config()

        assert result is True
