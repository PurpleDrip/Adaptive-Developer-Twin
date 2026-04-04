from fastapi import APIRouter
import httpx
import os
from app.schemas.telemetry import TelemetryDTO

router = APIRouter(prefix="/telemetry", tags=["telemetry"])
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

@router.post("", status_code=201)
async def receive_telemetry(data: TelemetryDTO):
    """
    RECEIVES live developer activity, RUNS fusion analysis, UPDATES skill graph.
    This is the core of the ADT-PRO engine.
    """
    async with httpx.AsyncClient() as client:
        try:
            # 1. Trigger Fusion Engine Analysis (Real AI Workflow)
            # We summarize the telemetry into the format expected by Fusion
            fusion_payload = {
                "telemetry_summary": {
                    "avg_wpm": data.wpm,
                    "total_commands": data.commands_executed,
                    "code_snippet": data.code_snippet
                },
                "resume_profile": {}, # In prod, these would be cached/fetched
                "project_profile": {},
                "weekly_tests": []
            }
            
            f_resp = await client.post(f"{FUSION_URL}/api/v1/fusion/fusion/{data.user_id}/run", json=fusion_payload)
            f_data = f_resp.json()
            
            # 2. Extract Skill Updates and push to THG (Neo4j)
            updates_sent = 0
            if f_data.get("status") == "fusion_complete":
                skill_updates = f_data.get("skill_updates", {})
                for skill, details in skill_updates.items():
                    # Only push meaningful updates (>0.05 strength)
                    if details["strength"] > 0.05:
                        await client.post(f"{THG_URL}/api/v1/thg/thg/update", json={
                            "dev_id": data.user_id,
                            "skill_name": skill,
                            "strength": details["strength"],
                            "confidence": details["confidence"]
                        })
                        updates_sent += 1

            return {
                "status": "processed",
                "user_id": data.user_id,
                "engine": "Fusion-v2.0",
                "graph_updates_committed": updates_sent
            }
            
        except Exception as e:
            return {"status": "error", "reason": str(e)}

@router.post("/{user_id}/summarize")
async def summarize_telemetry(user_id: str):
    return {"status": "deprecated", "message": "Telemetry is now processed in real-time."}
