"""
ADT Telemetry Models — Raw telemetry ingestion and batch processing.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict
from datetime import datetime


from enum import Enum

class SyncType(str, Enum):
    INITIAL = "initial"   # Full project sync at start of day
    DELTA = "delta"       # 30-second diff
    FINAL = "final"       # End of day verification

class TelemetryIngestDTO(BaseModel):
    """Payload sent by VS Code extension every 30 seconds (or on handshake)."""
    extension_id: str = Field(..., min_length=1, max_length=255)
    user_id: str = Field(..., min_length=1, max_length=255)
    machine_id: str = Field(..., min_length=1, max_length=255)
    sync_type: SyncType = SyncType.DELTA
    
    # Differential Payloads
    active_file: Optional[str] = Field(default=None, max_length=500)
    diff_payload: Optional[str] = Field(default=None, description="Unified diff for the active window")
    workspace_snapshot_url: Optional[str] = Field(default=None, description="URL/Base64 of full zip for INITIAL/FINAL sync")
    
    # Metrics
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    wpm: float = Field(..., ge=0, le=300)
    keystrokes: int = Field(default=0, ge=0)
    commands_executed: int = Field(default=0, ge=0)
    idle_seconds: float = Field(default=0.0, ge=0)
    git_branch: Optional[str] = Field(default="main", max_length=255)


class TelemetryRawDocument:
    """MongoDB document for telemetry_raw collection."""
    @staticmethod
    def create(dto: TelemetryIngestDTO) -> dict:
        return {
            "user_id": dto.user_id,
            "extension_id": dto.extension_id,
            "machine_id": dto.machine_id,
            "sync_type": dto.sync_type,
            "timestamp": dto.timestamp,
            "wpm": dto.wpm,
            "keystrokes": dto.keystrokes,
            "commands_executed": dto.commands_executed,
            "idle_seconds": dto.idle_seconds,
            "active_file": dto.active_file,
            "diff_payload": dto.diff_payload,
            "workspace_snapshot_url": dto.workspace_snapshot_url,
            "git_branch": dto.git_branch,
            "processed": False,
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
