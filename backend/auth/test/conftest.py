import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.fixture
def mock_collection():
    col = MagicMock()
    col.find_one = AsyncMock(return_value=None)
    col.insert_one = AsyncMock(return_value=MagicMock(inserted_id="mock_id"))
    col.update_one = AsyncMock(return_value=None)
    col.update_many = AsyncMock(return_value=None)
    return col

@pytest.fixture
def patch_get_collection(mock_collection):
    with patch("shared.database.mongo.get_collection", return_value=mock_collection):
        yield mock_collection
