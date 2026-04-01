from fastapi import APIRouter
from app.schemas.telemetry import TelemetryDTO

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

@router.post("", status_code=201)
async def receive_telemetry(data: TelemetryDTO):
    # For prototype: Just confirm reception
    return {
        "status": "received", 
        "user_id": data.user_id, 
        "timestamp": data.timestamp,
        "message": "Telemetry record stored in lab environment"
    }

@router.get("/{user_id}")
async def get_raw_telemetry(user_id: str):
    # Dummy data
    return {"user_id": user_id, "records_found": 12}

@router.post("/{user_id}/summarize")
async def summarize_telemetry(user_id: str):
    # Dummy summary for now
    return {
        "status": "summarized",
        "user_id": user_id,
        "window": "2026-04-01T10:00:00Z - 11:00:00Z",
        "avg_wpm": 44.1,
        "primary_language": "python"
    }
