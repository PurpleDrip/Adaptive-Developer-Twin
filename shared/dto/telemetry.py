from pydantic import BaseModel
from typing import List, Dict

class TelemetryDTO(BaseModel):
    user_id: str
    device_id: str
    timestamp: str
    session_duration: float
    files: Dict[str, float]
    wpm: float
    keystrokes: int
    commands_executed: int
    languages_used: Dict[str, float]
    code_snippet: str
    git_branch: str
    git_commits: int
    errors_fixed: int
    terminal_commands: List[str]
    active_extensions: List[str]
