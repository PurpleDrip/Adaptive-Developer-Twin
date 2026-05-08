import ipaddress
import httpx
import os
from datetime import datetime, time
from fastapi import APIRouter, HTTPException, Depends, Request
from shared.models.telemetry import TelemetryIngestDTO, TelemetryRawDocument, SyncType
from shared.database.mongo import get_collection

router = APIRouter(prefix="/telemetry", tags=["telemetry"])
AUTH_URL = os.getenv("AUTH_URL", "http://auth-service:8000")
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")

@router.post("/handshake")
async def telemetry_handshake(extension_id: str, current_hash: str, machine_id: str):
    """
    SHEC Protocol Handshake via ExtensionID.
    """
    # 1. Resolve Identity
    async with httpx.AsyncClient() as client:
        auth_resp = await client.post(f"{AUTH_URL}/api/v1/auth/users/validate-extension", params={"extension_id": extension_id, "machine_id": machine_id})
        if auth_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid ExtensionID")
        user_id = auth_resp.json()["user_id"]

    users_col = get_collection("users")
    user = await users_col.find_one({"user_id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User profile not synced")
        
    last_hash = user.get("last_known_state_hash")
    if last_hash == current_hash:
        return {"status": "synchronized"}
    else:
        return {"status": "mismatch", "last_known_hash": last_hash}

@router.post("/ingest", status_code=201)
async def ingest_telemetry(data: TelemetryIngestDTO, request: Request):
    """
    Continuous Monitoring Ingest via ExtensionID.
    """
    # 1. Resolve Identity & Validate Lock
    async with httpx.AsyncClient() as client:
        auth_resp = await client.post(f"{AUTH_URL}/api/v1/auth/users/validate-extension", params={"extension_id": data.extension_id, "machine_id": data.machine_id})
        if auth_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Extension ID mismatch or hardware lock violation")
        resolved_user_id = auth_resp.json()["user_id"]

    # Store Raw Telemetry
    db_raw = get_collection("telemetry_raw")
    doc = TelemetryRawDocument.create(data)
    doc["user_id"] = resolved_user_id # Inject resolved identity
    await db_raw.insert_one(doc)

    # Update SHEC state
    users_col = get_collection("users")
    await users_col.update_one({"user_id": resolved_user_id}, {"$set": {"last_sync_at": datetime.utcnow()}})

    # INITIAL sync: forward workspace snapshot to Fusion for deep baseline audit
    if data.sync_type == SyncType.INITIAL and data.workspace_snapshot_url:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{FUSION_URL}/api/v1/fusion/fusion/deep-audit",
                    json={
                        "user_id": resolved_user_id,
                        "workspace_snapshot_url": data.workspace_snapshot_url
                    }
                )
        except Exception as e:
            # Non-blocking — deep audit is best-effort
            pass

    return {"status": "ingested", "timestamp": datetime.utcnow().isoformat()}

@router.get("/status/{extension_id}")
async def get_ingestion_status(extension_id: str):
    # This would also resolve user_id first in a full prod system
    db_raw = get_collection("telemetry_raw")
    count = await db_raw.count_documents({"extension_id": extension_id, "processed": False})
    return {"pending_records": count}
