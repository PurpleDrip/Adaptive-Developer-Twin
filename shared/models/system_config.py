"""
ADT System Config Model — SHEC intervals, batch settings, and perimeter security.
Managed by the Technical Support team.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SystemConfigDTO(BaseModel):
    """Technical Support updates system configuration."""
    telemetry_interval_seconds: Optional[int] = Field(
        default=None, ge=10, le=300,
        description="How often the extension sends data. Default: 30"
    )
    batch_interval_minutes: Optional[int] = Field(
        default=None, ge=5, le=120,
        description="How often telemetry is batch-processed. Default: 5"
    )
    is_monitoring_paused: Optional[bool] = Field(
        default=None,
        description="Pause all telemetry collection globally"
    )
    shec_handshake_interval_ms: Optional[int] = Field(
        default=5000,
        description="SHEC Protocol handshake frequency"
    )
    office_network_whitelist: Optional[List[str]] = Field(
        default=["127.0.0.1", "192.168.1.0/24"],
        description="List of CIDR ranges or IPs for office premises"
    )


# Default system configuration document
DEFAULT_SYSTEM_CONFIG = {
    "key": "global_config",
    "telemetry_interval_seconds": 30,
    "batch_interval_minutes": 5,
    "is_monitoring_paused": False,
    "shec_handshake_interval_ms": 5000,
    "office_network_whitelist": ["127.0.0.1", "10.0.0.0/8"],
    "updated_at": None,
    "updated_by": None,
}


class SystemConfigResponse(BaseModel):
    """Response model for current system config."""
    telemetry_interval_seconds: int = 30
    batch_interval_minutes: int = 5
    is_monitoring_paused: bool = False
    shec_handshake_interval_ms: int = 5000
    office_network_whitelist: List[str] = []
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
