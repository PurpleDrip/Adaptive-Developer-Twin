"""
ADT Telemetry Models — Raw telemetry ingestion and batch processing.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from datetime import datetime


class TelemetryIngestDTO(BaseModel):
    """Payload sent by VS Code extension every 30 seconds."""
    extension_id: str = Field(..., min_length=1, max_length=255,
                               description="Unique extension ID assigned during registration")
    user_id: str = Field(..., min_length=1, max_length=255)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    session_duration: float = Field(..., ge=0, le=86400, description="Seconds since session start")
    wpm: float = Field(..., ge=0, le=300, description="Words per minute in the current window")
    keystrokes: int = Field(default=0, ge=0, le=1000000)
    commands_executed: int = Field(default=0, ge=0, le=10000)
    errors_encountered: int = Field(default=0, ge=0, le=10000)
    errors_fixed: int = Field(default=0, ge=0, le=10000)
    active_file: Optional[str] = Field(default=None, max_length=500)
    files_touched: Dict[str, float] = Field(default_factory=dict,
                                            description="filename → seconds spent")
    languages_used: Dict[str, float] = Field(default_factory=dict,
                                             description="language → percentage")
    code_snippet: str = Field(default="", max_length=100000,
                              description="Current active code context (up to 100KB)")
    git_branch: Optional[str] = Field(default="main", max_length=255)
    git_commits: int = Field(default=0, ge=0, le=1000)
    terminal_commands: List[str] = Field(default_factory=list, max_length=500)
    active_extensions: List[str] = Field(default_factory=list, max_length=100)
    cursor_movements: int = Field(default=0, ge=0, description="Number of cursor position changes")
    selections_made: int = Field(default=0, ge=0, description="Number of text selections")
    copy_paste_count: int = Field(default=0, ge=0, description="Copy-paste operations")
    idle_seconds: float = Field(default=0.0, ge=0, description="Seconds with no activity in window")


class TelemetryRawDocument:
    """MongoDB document for telemetry_raw collection."""
    @staticmethod
    def create(dto: TelemetryIngestDTO) -> dict:
        return {
            "user_id": dto.user_id,
            "extension_id": dto.extension_id,
            "timestamp": dto.timestamp,
            "session_duration": dto.session_duration,
            "wpm": dto.wpm,
            "keystrokes": dto.keystrokes,
            "commands_executed": dto.commands_executed,
            "errors_encountered": dto.errors_encountered,
            "errors_fixed": dto.errors_fixed,
            "active_file": dto.active_file,
            "files_touched": dto.files_touched,
            "languages_used": dto.languages_used,
            "code_snippet": dto.code_snippet,
            "git_branch": dto.git_branch,
            "git_commits": dto.git_commits,
            "terminal_commands": dto.terminal_commands,
            "active_extensions": dto.active_extensions,
            "cursor_movements": dto.cursor_movements,
            "selections_made": dto.selections_made,
            "copy_paste_count": dto.copy_paste_count,
            "idle_seconds": dto.idle_seconds,
            "processed": False,
            "batch_id": None,
            "ingested_at": datetime.utcnow(),
        }


class TelemetryBatchDocument:
    """MongoDB document for telemetry_batches collection."""
    @staticmethod
    def create(batch_id: str, user_id: str, records: list, window_start: datetime, window_end: datetime) -> dict:
        # Aggregate signals from raw records
        total_keystrokes = sum(r.get("keystrokes", 0) for r in records)
        total_commands = sum(r.get("commands_executed", 0) for r in records)
        total_errors = sum(r.get("errors_encountered", 0) for r in records)
        total_errors_fixed = sum(r.get("errors_fixed", 0) for r in records)
        total_commits = sum(r.get("git_commits", 0) for r in records)
        total_idle = sum(r.get("idle_seconds", 0.0) for r in records)
        wpm_values = [r.get("wpm", 0.0) for r in records if r.get("wpm", 0) > 0]
        avg_wpm = sum(wpm_values) / len(wpm_values) if wpm_values else 0.0

        # Merge files touched across all records
        all_files = {}
        for r in records:
            for f, t in r.get("files_touched", {}).items():
                all_files[f] = all_files.get(f, 0) + t

        # Merge languages
        all_langs = {}
        for r in records:
            for lang, pct in r.get("languages_used", {}).items():
                all_langs[lang] = all_langs.get(lang, 0) + pct
        # Normalize language percentages
        total_lang = sum(all_langs.values())
        if total_lang > 0:
            all_langs = {k: round(v / total_lang, 3) for k, v in all_langs.items()}

        # Collect all code snippets for semantic analysis
        code_snippets = [r.get("code_snippet", "") for r in records if r.get("code_snippet")]

        return {
            "batch_id": batch_id,
            "user_id": user_id,
            "window_start": window_start,
            "window_end": window_end,
            "record_count": len(records),
            "aggregated_signals": {
                "avg_wpm": round(avg_wpm, 2),
                "wpm_values": wpm_values,
                "total_keystrokes": total_keystrokes,
                "total_commands": total_commands,
                "total_errors": total_errors,
                "total_errors_fixed": total_errors_fixed,
                "total_commits": total_commits,
                "total_idle_seconds": round(total_idle, 2),
                "top_files": sorted(all_files.items(), key=lambda x: x[1], reverse=True)[:20],
                "language_distribution": all_langs,
                "code_snippets": code_snippets[:10],  # Cap at 10 for memory
                "total_copy_paste": sum(r.get("copy_paste_count", 0) for r in records),
            },
            "fusion_result": None,
            "thg_updates": None,
            "status": "pending",
            "created_at": datetime.utcnow(),
            "processed_at": None,
        }
