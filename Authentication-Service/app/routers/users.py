from fastapi import APIRouter
import httpx
import os
from app.schemas.user import UserCreateDTO

router = APIRouter(prefix="/users", tags=["users"])
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")

@router.post("/create", status_code=201)
async def create_user(user: UserCreateDTO):
    """
    Creates user in Auth system and triggers THG initialization in Neo4j.
    """
    thg_status = "pending"
    seed_count = 0
    
    async with httpx.AsyncClient() as client:
        # 1. Initialize Developer Node in THG
        try:
            thg_payload = {
                "dev_id": user.user_id,
                "name": user.userName,
                "bio": user.bio,
                "gender": user.gender,
                "primary_domain": user.primary_domain
            }
            thg_init_resp = await client.post(f"{THG_URL}/api/v1/thg/thg/create-dev", json=thg_payload)
            thg_init_resp.raise_for_status()
            thg_status = "initialized"
        except Exception as e:
            thg_status = f"failed_thg_sync: {str(e)}"
            return {"status": "error", "message": f"Graph Sync Failed: {str(e)}", "thg_status": thg_status}

        # 2. SEED SKILLS: Analyze Resume via Fusion Engine (CodeBERT)
        if user.resume:
            try:
                fusion_resp = await client.post(f"{FUSION_URL}/api/v1/fusion/fusion/analyze-text", json={"text": user.resume})
                fusion_resp.raise_for_status()
                skills_data = fusion_resp.json().get("vector", {})
                
                # Seed these skills into the Graph
                for skill_name, strength in skills_data.items():
                    if strength > 0.1:
                        update_resp = await client.post(f"{THG_URL}/api/v1/thg/thg/update", json={
                            "dev_id": user.user_id,
                            "skill_name": skill_name,
                            "strength": strength,
                            "confidence": 0.30
                        })
                        update_resp.raise_for_status()
                        seed_count += 1
            except Exception as e:
                print(f"RESUME_ANALYSIS_ERROR: {str(e)}")
                # We don't fail the whole request for resume analysis failures, just log it

    return {
        "status": "success" if "failed" not in thg_status else "partial_success", 
        "thg_status": thg_status,
        "seeds_extracted": seed_count,
        "user_id": user.user_id
    }

@router.get("/{user_id}")
async def get_user(user_id: str):
    """Fetches real developer profile and current skill state from the Graph."""
    async with httpx.AsyncClient() as client:
        try:
            thg_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/{user_id}/skills")
            if thg_resp.status_code == 200:
                return thg_resp.json()
            return {"status": "partial", "user_id": user_id, "message": "User initialized but no skill telemetry yet."}
        except Exception as e:
            return {"error": f"Failed to reach Knowledge Graph: {str(e)}"}

@router.post("/{user_id}/resume")
async def upload_resume(user_id: str, data: dict):
    return {"status": "success", "user_id": user_id, "evidence": "resume_uploaded"}

@router.post("/{user_id}/projects")
async def upload_projects(user_id: str, data: dict):
    return {"status": "success", "user_id": user_id, "evidence": "projects_uploaded"}

@router.post("/{user_id}/weekly-test")
async def upload_test(user_id: str, data: dict):
    return {"status": "success", "user_id": user_id, "evidence": "test_uploaded"}
