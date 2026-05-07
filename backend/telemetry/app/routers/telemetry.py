import ipaddress
import httpx
import os
from datetime import datetime, time
from fastapi import APIRouter, HTTPException, Depends, Request
from shared.models.telemetry import TelemetryIngestDTO, TelemetryRawDocument, SyncType
from shared.database.mongo import get_collection

router = APIRouter(prefix="/telemetry", tags=["telemetry"])
AUTH_URL = os.getenv("AUTH_URL", "http://auth-service:8000")

@router.post("/handshake")
async def telemetry_handshake(user_id: str, current_hash: str):
    """
    SHEC Protocol Handshake. 
    Verifies if developer worked overnight/offline.
    """
    users_col = get_collection("users")
    user = await users_col.find_one({"user_id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    last_hash = user.get("last_known_state_hash")
    
    if last_hash == current_hash:
        return {
            "status": "synchronized",
            "message": "Workspace state matches. Continue with delta sync."
        }
    else:
        return {
            "status": "mismatch",
            "message": "State mismatch detected. Please backfill missed diffs.",
            "last_known_hash": last_hash,
            "last_sync_at": user.get("last_sync_at")
        }

@router.post("/ingest", status_code=201)
async def ingest_telemetry(data: TelemetryIngestDTO, request: Request):
    """
    Continuous Monitoring Ingest.
    Receives diff-based telemetry heartbeats from office-issued laptops.
    """
    # Validate Extension ID with Auth Service
    async with httpx.AsyncClient() as client:
        try:
            auth_resp = await client.post(
                f"{AUTH_URL}/api/v1/auth/users/validate-extension", 
                params={"extension_id": data.extension_id, "machine_id": data.machine_id}
            )
            if auth_resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or inactive extension_id")
            
            auth_data = auth_resp.json()
            if auth_data["user_id"] != data.user_id:
                raise HTTPException(status_code=403, detail="Extension ID does not match User ID")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Auth Service unavailable")

    # Store Raw Telemetry (Always accepted in 'Continuous Mode')
    db_raw = get_collection("telemetry_raw")
    doc = TelemetryRawDocument.create(data)
    await db_raw.insert_one(doc)

    # Update SHEC state on the user document
    users_col = get_collection("users")
    if data.sync_type == SyncType.DELTA and data.diff_payload:
        # In a real system, we'd compute the new hash here or receive it from the extension
        # For now, we update the last_sync_at
        await users_col.update_one(
            {"user_id": data.user_id},
            {"$set": {"last_sync_at": datetime.utcnow()}}
        )

    return {
        "status": "ingested",
        "sync_mode": "continuous_shec",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/status/{user_id}")
async def get_ingestion_status(user_id: str):
    db_raw = get_collection("telemetry_raw")
    count = await db_raw.count_documents({"user_id": user_id, "processed": False})
    return {"pending_records": count}
