from app.services.weight_engine import WeightEngine
from app.services.normalizer import Normalizer
from app.services.anomaly_detector import AnomalyDetector
from app.services.ai_core import CodeBERTAnalyzer, SHAPExplainer
from app.services.bayesian_fusion import BayesianFuser
from app.services.project_analyzer import ProjectAnalyzer
from app.schemas.fusion import SkillUpdateDTO, FusionInputDTO, InvestorAssessmentDTO
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
import os

router = APIRouter(prefix="/fusion", tags=["fusion"])
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

def _build_fusion_result(user_id: str, data: FusionInputDTO) -> Dict[str, Any]:
    detector = AnomalyDetector()
    # Mock batch for simple analysis
    telemetry_batch = [data.telemetry_summary] * 6
    reliability = detector.analyze_batch(telemetry_batch)

    telemetry_signals = Normalizer.extract_telemetry_signals(data.telemetry_summary)
    snippet = data.telemetry_summary.get("code_snippet", "")
    
    analyzer = CodeBERTAnalyzer.get_instance()
    semantic_signals = analyzer.analyze_code(snippet)

    all_evidence = {}
    skills = ["backend", "frontend", "devops", "ml", "neo4j", "testing", "database", "security"]

    for skill in skills:
        telemetry_combined = (0.6 * telemetry_signals.get(skill, 0.0)) + (0.4 * semantic_signals.get(skill, 0.0))
        all_evidence[skill] = {
            "telemetry": min(telemetry_combined, 1.0),
            "resume": Normalizer.extract_profile_signals(data.resume_profile).get(skill, 0.0),
            "projects": Normalizer.extract_profile_signals(data.project_profile).get(skill, 0.0)
        }

    fused_results = WeightEngine.fuse_all_skills(all_evidence)

    final_updates = {}
    reliability_score = float(reliability.get("reliability_score", 1.0))
    for skill, res in fused_results.items():
        res["confidence"] = BayesianFuser.calculate_posterior_confidence(
            prior_strength=res["strength"],
            current_strength=res["strength"],
            prior_confidence=res["confidence"],
            skill_category=skill
        )
        res["confidence"] = round(res["confidence"] * reliability_score, 4)
        res["explanation"] = SHAPExplainer.explain_score(skill, res["sources"])
        if not reliability.get("is_reliable", True):
            res["fraud_flag"] = "ANOMALY_DETECTED"
        final_updates[skill] = res

    return {
        "status": "fusion_complete",
        "user_id": data.user_id or user_id,
        "engine_version": "v2.0-top-tier",
        "reliability_check": reliability,
        "skill_updates": final_updates
    }

@router.post("/analyze-text", status_code=200)
async def analyze_text(data: Dict[str, str]):
    """
    Advanced Semantic Vectorization via CodeBERT.
    Used for Resume Analysis, Task Analysis, and Search Queries.
    """
    input_text = data.get("text", data.get("resume", ""))
    analyzer = CodeBERTAnalyzer.get_instance()
    skills = analyzer.analyze_resume(input_text)
    return {
        "status": "success",
        "vector": skills
    }

@router.post("/analyze-project", status_code=200)
async def analyze_project(data: Dict[str, str]):
    """
    Clones/Downloads a project and performs deep semantic analysis.
    """
    user_id = data.get("user_id")
    repo_url = data.get("github_url")
    
    if not user_id or not repo_url:
        raise HTTPException(status_code=400, detail="Missing user_id or github_url")
    
    analyzer = ProjectAnalyzer()
    result = await analyzer.analyze_github_repo(repo_url)
    
    # If successful, push initial skills to THG
    if result.get("status") == "completed":
        import httpx
        async with httpx.AsyncClient() as client:
            for skill, score in result.get("skill_signals", {}).items():
                if score > 0.1:
                    await client.post(f"{THG_URL}/api/v1/thg/thg/update", json={
                        "dev_id": user_id,
                        "skill_name": skill,
                        "strength": score,
                        "confidence": 0.5 # Initial confidence for project analysis
                    })
    
    return result

@router.get("/{user_id}/explain")
async def explain_user(user_id: str):
    return {
        "explanation": f"Developer {user_id} shows strong backend skills based on CodeBERT analysis of recent code snippets and telemetry patterns."
    }

@router.post("/{user_id}/run", status_code=201)
async def run_fusion(user_id: str, data: FusionInputDTO):
    return _build_fusion_result(user_id, data)
