"""
ADT System Config Model — Monitoring window, holidays, batch settings.
Managed by the Technical Support team.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date


class SystemConfigDTO(BaseModel):
    """Technical Support updates system configuration."""
    monitoring_window_start: Optional[str] = Field(
        default=None, pattern=r'^\d{2}:\d{2}$',
        description="Start time in HH:MM (24h). Default: 09:00"
    )
    monitoring_window_end: Optional[str] = Field(
        default=None, pattern=r'^\d{2}:\d{2}$',
        description="End time in HH:MM (24h). Default: 18:00"
    )
    telemetry_interval_seconds: Optional[int] = Field(
        default=None, ge=10, le=300,
        description="How often the extension sends data. Default: 30"
    )
    batch_interval_minutes: Optional[int] = Field(
        default=None, ge=5, le=120,
        description="How often telemetry is batch-processed. Default: 30"
    )
    is_monitoring_paused: Optional[bool] = Field(
        default=None,
        description="Pause all telemetry collection globally"
    )


class HolidayDTO(BaseModel):
    """Declare a holiday — stops monitoring for that date."""
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$', description="YYYY-MM-DD")
    reason: str = Field(..., min_length=2, max_length=200)
    is_half_day: bool = Field(default=False)
    half_day_end: Optional[str] = Field(
        default=None, pattern=r'^\d{2}:\d{2}$',
        description="If half day, monitoring resumes at this time"
    )


class RemoveHolidayDTO(BaseModel):
    """Remove a previously declared holiday."""
    date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')


# Default system configuration document
DEFAULT_SYSTEM_CONFIG = {
    "key": "global_config",
    "monitoring_window_start": "09:00",
    "monitoring_window_end": "18:00",
    "telemetry_interval_seconds": 30,
    "batch_interval_minutes": 30,
    "is_monitoring_paused": False,
    "holidays": [],  # List of {"date": "YYYY-MM-DD", "reason": "...", "is_half_day": false}
    "updated_at": None,
    "updated_by": None,
}


class SystemConfigResponse(BaseModel):
    """Response model for current system config."""
    monitoring_window_start: str = "09:00"
    monitoring_window_end: str = "18:00"
    telemetry_interval_seconds: int = 30
    batch_interval_minutes: int = 30
    is_monitoring_paused: bool = False
    holidays: list = []
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None
