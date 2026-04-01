from fastapi import APIRouter
from app.schemas.fusion import SkillUpdateDTO, FusionInputDTO
from app.services.weight_engine import WeightEngine
from app.services.normalizer import Normalizer
from typing import Dict, List

router = APIRouter(prefix="/fusion", tags=["fusion"])

@router.post("/{user_id}/run", status_code=201)
async def run_fusion(user_id: str, data: FusionInputDTO):
    """
    Run the weighted fusion engine for a user.
    Aggregates Telemetry, Resume, and Project signals into a single skill state.
    """
    # 1. Normalize Telemetry summary data
    telemetry_signals = Normalizer.extract_telemetry_signals(data.telemetry_summary)
    
    # 2. Extract profile signals (from resume and project metadata)
    resume_signals = Normalizer.extract_profile_signals(data.resume_profile)
    project_signals = Normalizer.extract_profile_signals(data.project_profile)
    
    # 3. Consolidate into skill-wise evidence maps
    all_evidence = {}
    skills = ["backend", "frontend", "devops", "ml", "neo4j", "testing"]
    
    for skill in skills:
        all_evidence[skill] = {
            "telemetry": telemetry_signals.get(skill, 0.0),
            "resume": resume_signals.get(skill, 0.0),
            "projects": project_signals.get(skill, 0.0)
        }
        
        # Pull in weekly test scores if available
        if data.weekly_tests:
            latest_test = data.weekly_tests[-1] # Simplification for prototype
            scores = latest_test.get("skill_breakdown", {})
            if skill in scores:
                all_evidence[skill]["weekly_test"] = scores[skill]

    # 4. Apply weighting and calculate final strength/confidence
    fused_results = WeightEngine.fuse_all_skills(all_evidence)
    
    return {
        "status": "fusion_complete",
        "user_id": user_id, 
        "fused_at": "2026-04-01T11:45:00Z",
        "skill_updates": fused_results
    }

@router.get("/{user_id}/latest")
async def get_latest_fusion(user_id: str):
    return {"user_id": user_id, "timestamp": "2026-04-01T11:45:00Z", "status": "stable"}
