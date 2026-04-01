'''{
  "user_id": "shashanth_001",
  "device_id": "vscode-abc123-def456", 
  "timestamp": "2026-03-20T23:44:00Z",
  "session_duration": 5.23,           // minutes
  "files": {
    "api.py": 2.1,                   // hours edited
    "tests.py": 0.8,
    "docker-compose.yml": 0.3
  },
  "wpm": 45.2,                         // Words Per Minute (validated 10-120)
  "keystrokes": 342,                   // Total keystrokes
  "commands_executed": 18,             // Ctrl+C, git commit, etc.
  "languages_used": {
    "python": 0.85,                    // % time
    "yaml": 0.15
  },
  "code_snippet": "from fastapi import FastAPI\napp = FastAPI()\n@app.post(\"/telemetry\")\nasync def process(data):",  // Last 500 chars
  "git_branch": "feature/auth-v2",
  "git_commits": 2,
  "errors_fixed": 3,                   // Linting/telemetry
  "terminal_commands": ["pip install fastapi", "uvicorn app.main:app"],
  "active_extensions": ["python", "neo4j", "docker"]
}'''

class TelemetryDTO(BaseModel):
    user_id:str
    device_id:str
    timestamp:str
    session_duration:float
    files:Dict[str,float]
    wpm:float
    keystrokes:intj
    commands_executed:int
    languages_used:Dict[str,float]
    code_snippet:str
    git_branch:str
    git_commits:int
    errors_fixed:int
    terminal_commands:List[str]
    active_extensions:List[str]