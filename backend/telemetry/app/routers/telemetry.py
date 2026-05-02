from fastapi import APIRouter, HTTPException, Depends
import httpx
import os
from datetime import datetime, time
from shared.models.telemetry import TelemetryIngestDTO, TelemetryRawDocument
from shared.database.mongo import get_collection

router = APIRouter(prefix="/telemetry", tags=["telemetry"])
AUTH_URL = os.getenv("AUTH_URL", "http://auth-service:8000")

@router.post("/ingest", status_code=201)
async def ingest_telemetry(data: TelemetryIngestDTO):
    """
    Receives 30-second telemetry from VS Code extension.
    Validates extension_id and checks monitoring window.
    """
    # 1. Validate Monitoring Window & Global Pause
    if not await _check_monitoring_window():
        return {"status": "ignored", "reason": "outside_monitoring_window"}

    # 2. Validate Extension ID with Auth Service
    async with httpx.AsyncClient() as client:
        try:
            auth_resp = await client.post(
                f"{AUTH_URL}/api/v1/auth/users/validate-extension", 
                params={"extension_id": data.extension_id}
            )
            if auth_resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or inactive extension_id")
            
            auth_data = auth_resp.json()
            # Ensure the user_id in telemetry matches the extension owner
            if auth_data["user_id"] != data.user_id:
                raise HTTPException(status_code=403, detail="Extension ID does not match User ID")
        except httpx.RequestError:
            # Fallback if Auth is down: allow but log warning (or block based on policy)
            # For prod-grade, we block.
            raise HTTPException(status_code=503, detail="Auth Service unavailable for validation")

    # 3. Store Raw Telemetry
    db_raw = get_collection("telemetry_raw")
    doc = TelemetryRawDocument.create(data)
    await db_raw.insert_one(doc)

    return {
        "status": "ingested",
        "timestamp": datetime.utcnow().isoformat(),
        "user": auth_data["name"]
    }

async def _check_monitoring_window() -> bool:
    """Helper to check if current time is within allowed monitoring window."""
    db_config = get_collection("system_config")
    config = await db_config.find_one({"key": "global_config"})
    
    if config and config.get("is_monitoring_paused"):
        return False

    now = datetime.now()
    
    # Simple window check (reused logic from batch processor)
    start_str = config.get("monitoring_window_start", "09:00") if config else "09:00"
    end_str = config.get("monitoring_window_end", "18:00") if config else "18:00"
    
    start_time = time.fromisoformat(start_str)
    end_time = time.fromisoformat(end_str)
    
    return start_time <= now.time() <= end_time

@router.get("/status/{user_id}")
async def get_ingestion_status(user_id: str):
    db_raw = get_collection("telemetry_raw")
    count = await db_raw.count_documents({"user_id": user_id, "processed": False})
    return {"pending_records": count}
