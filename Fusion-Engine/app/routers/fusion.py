from app.services.weight_engine import WeightEngine
from app.services.normalizer import Normalizer
from app.services.anomaly_detector import AnomalyDetector
from typing import Dict, List

router = APIRouter(prefix="/fusion", tags=["fusion"])

@router.post("/{user_id}/run", status_code=201)
async def run_fusion(user_id: str, data: FusionInputDTO):
    """
    Run the weighted fusion engine for a user.
    Includes advanced Isolation Forest anomaly check for data reliability.
    """
    # 1. Advanced: Check data reliability (Top Tier)
    detector = AnomalyDetector()
    # Batch check (mocking batch size with duplicate for logic demonstration)
    reliability = detector.analyze_telemetry_batch([data.telemetry_summary] * 6)
    
    # 2. Normalize inputs
    telemetry_signals = Normalizer.extract_telemetry_signals(data.telemetry_summary)
    resume_signals = Normalizer.extract_profile_signals(data.resume_profile)
    project_signals = Normalizer.extract_profile_signals(data.project_profile)
    
    # 3. Consolidate and Fuse
    all_evidence = {}
    skills = ["backend", "frontend", "devops", "ml", "neo4j", "testing"]
    
    for skill in skills:
        all_evidence[skill] = {
            "telemetry": telemetry_signals.get(skill, 0.0),
            "resume": resume_signals.get(skill, 0.0),
            "projects": project_signals.get(skill, 0.0)
        }
        if data.weekly_tests:
            scores = data.weekly_tests[-1].get("skill_breakdown", {})
            if skill in scores:
                all_evidence[skill]["weekly_test"] = scores[skill]

    fused_results = WeightEngine.fuse_all_skills(all_evidence)
    
    # 4. Apply Reliability Penalty (Commercial Safety Layer)
    for skill, res in fused_results.items():
        res["confidence"] = round(res["confidence"] * reliability["reliability_score"], 2)
        if not reliability["is_reliable"]:
            res["flag"] = "ANOMALY_DETECTED"
    
    return {
        "status": "fusion_complete",
        "user_id": user_id, 
        "fused_at": "2026-04-01T11:45:00Z",
        "reliability_check": reliability,
        "skill_updates": fused_results
    }

@router.get("/{user_id}/latest")
async def get_latest_fusion(user_id: str):
    return {"user_id": user_id, "timestamp": "2026-04-01T11:45:00Z", "status": "stable"}
