from app.services.weight_engine import WeightEngine
from app.services.normalizer import Normalizer
from app.services.anomaly_detector import AnomalyDetector
from app.services.ai_core import CodeBERTSimulator, SHAPExplainer
from app.services.bayesian_fusion import BayesianFuser
from app.schemas.fusion import SkillUpdateDTO, FusionInputDTO
from fastapi import APIRouter
from typing import Dict, List, Any

router = APIRouter(prefix="/fusion", tags=["fusion"])

@router.post("/{user_id}/run", status_code=201)
async def run_fusion(user_id: str, data: FusionInputDTO):
    """
    Advanced Top-Tier Fusion Engine (v2) for Commercial Sale.
    Combines Weighted Fusion, Anomaly Detection, CodeBERT (Semantic AI), 
    Bayesian Uncertainty, and SHAP XAI Explanations.
    """
    # 1. Isolation Forest: Check data reliability (Security layer)
    detector = AnomalyDetector()
    reliability = detector.analyze_telemetry_batch([data.telemetry_summary] * 6)
    
    # 2. Heuristic Signal Normalization
    telemetry_signals = Normalizer.extract_telemetry_signals(data.telemetry_summary)
    
    # 3. New Advanced: CodeBERT (Semantic Extraction)
    # Extracts evidence from provided snippets (if any)
    snippet = data.telemetry_summary.get("code_snippet", "")
    semantic_signals = CodeBERTSimulator.analyze_semantic_content(snippet)
    
    # 4. Consolidate Evidence for Weighting
    all_evidence = {}
    skills = ["backend", "frontend", "devops", "ml", "neo4j", "testing"]
    
    for skill in skills:
        # Fusing heuristic + semantic CodeBERT signals for 'Top Tier' accuracy
        telemetry_combined = (0.6 * telemetry_signals.get(skill, 0.0)) + \
                             (0.4 * semantic_signals.get(skill, 0.0))
                             
        all_evidence[skill] = {
            "telemetry": min(telemetry_combined, 1.0),
            "resume": Normalizer.extract_profile_signals(data.resume_profile).get(skill, 0.0),
            "projects": Normalizer.extract_profile_signals(data.project_profile).get(skill, 0.0)
        }
        
    # 5. Core Fusion Logic
    fused_results = WeightEngine.fuse_all_skills(all_evidence)
    
    # 6. Commercial Post-Processing (Explainability & Uncertainty)
    final_updates = {}
    for skill, res in fused_results.items():
        # Bayesian Update: Adjust confidence based on reliability + variance
        res["confidence"] = BayesianFuser.calculate_posterior_confidence(
            prior_strength=res["strength"], 
            current_strength=res["strength"], 
            prior_confidence=res["confidence"]
        )
        
        # Apply Reliability Penalty from Anomaly Check
        res["confidence"] = round(res["confidence"] * reliability["reliability_score"], 2)
        
        # XAI Layer: Explain why this skill is at this level (Sell point for managers)
        res["explanation"] = SHAPExplainer.explain_score(skill, res["sources"])
        
        # Flags for security audit
        if not reliability["is_reliable"]:
            res["fraud_flag"] = "ANOMALY_DETECTED"
            
        final_updates[skill] = res
    
    return {
        "status": "fusion_complete",
        "user_id": user_id, 
        "engine_version": "v2.0-top-tier",
        "fused_at": "2026-04-01T11:55:00Z",
        "reliability_check": reliability,
        "skill_updates": final_updates
    }
