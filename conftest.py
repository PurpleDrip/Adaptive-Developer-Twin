import os
import pytest
from dotenv import load_dotenv

def pytest_configure(config):
    """Load .env before any test runs."""
    load_dotenv(override=False)
