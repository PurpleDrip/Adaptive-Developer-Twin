from fastapi import APIRouter, HTTPException
import os
import httpx
from typing import List, Dict, Any
from shared.database.mongo import get_collection
from shared.services.audit_logger import AuditLogger

router = APIRouter()

@router.get("/audit-log")
async def get_audit_trail(user_id: str = None, action: str = None, limit: int = 100):
    """
    Fetches the global audit trail.
    """
    db = get_collection("audit_log").database
    logger = AuditLogger(db)
    
    if action:
        return await logger.get_by_action(action, limit)
    return await logger.get_recent(limit, user_id)

@router.get("/system-health")
async def get_system_health():
    """
    Checks health of all critical microservices.
    """
    services = {
        "auth": os.getenv("AUTH_URL", "http://auth-service:8000"),
        "telemetry": os.getenv("TELEMETRY_URL", "http://telemetry-service:8000"),
        "fusion": os.getenv("FUSION_URL", "http://fusion-service:8000"),
        "thg": os.getenv("THG_URL", "http://thg-service:8000"),
        "allocation": os.getenv("ALLOCATION_URL", "http://allocation-engine:8000"),
        "task": os.getenv("TASK_URL", "http://task-service:8000"),
        "analytics": os.getenv("ANALYTICS_URL", "http://analytics-service:8000")
    }
    
    results = {}
    async with httpx.AsyncClient(timeout=2.0) as client:
        for name, url in services.items():
            try:
                resp = await client.get(f"{url}/api/v1/{name}/health")
                results[name] = resp.json() if resp.status_code == 200 else "unhealthy"
            except:
                results[name] = "offline"
                
    return {
        "status": "all_monitored",
        "timestamp": os.getenv("CURRENT_TIME", "2026-05-02T12:00:00Z"),
        "services": results
    }

@router.get("/batch-status")
async def get_batch_processing_status():
    """
    Status of recent telemetry batches.
    """
    db_batches = get_collection("telemetry_batches")
    cursor = db_batches.find().sort("created_at", -1).limit(10)
    results = []
    async for b in cursor:
        results.append({
            "batch_id": b["batch_id"],
            "user_id": b["user_id"],
            "status": b["status"],
            "records": b["record_count"],
            "timestamp": b["created_at"]
        })
    return results
