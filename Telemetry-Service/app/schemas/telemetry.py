from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
import re

class TelemetryDTO(BaseModel):
    user_id: str = Field(..., min_length=1, max_length=255, pattern=r'^[a-zA-Z0-9_-]+$')
    timestamp: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$')
    wpm: float = Field(..., ge=0, le=200)
    code_snippet: str = Field(..., max_length=100000)  # Max 100KB
    
    # Optional fields with defaults for demo flexibility
    device_id: Optional[str] = Field("ADT-PRO", max_length=255)
    session_duration: Optional[float] = Field(0.0, ge=0, le=86400)  # Max 24 hours
    files: Optional[Dict[str, float]] = Field(default_factory=dict)
    keystrokes: Optional[int] = Field(0, ge=0, le=1000000)
    commands_executed: Optional[int] = Field(0, ge=0, le=10000)
    languages_used: Optional[Dict[str, float]] = Field(default_factory=dict)
    git_branch: Optional[str] = Field("main", max_length=255)
    git_commits: Optional[int] = Field(0, ge=0, le=1000)
    errors_fixed: Optional[int] = Field(0, ge=0, le=10000)
    terminal_commands: Optional[List[str]] = Field(default_factory=list, max_items=1000)
    active_extensions: Optional[List[str]] = Field(default_factory=list, max_items=100)
    
    @validator('code_snippet')
    def validate_code_snippet(cls, v):
        if len(v) > 100000:
            raise ValueError('Code snippet too large')
        return v
    
    @validator('files', 'languages_used')
    def validate_dict_values(cls, v):
        if v:
            for key, value in v.items():
                if not isinstance(value, (int, float)) or value < 0:
                    raise ValueError(f'Invalid value for {key}: must be non-negative number')
        return v
