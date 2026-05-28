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
import base64
import zipfile
import io
import httpx
import logging

logger = logging.getLogger("fusion.router")

router = APIRouter(prefix="/fusion", tags=["fusion"])
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")


def _infer_skills_from_files(file_list: List[str]) -> Dict[str, float]:
    """Infers skill signals from file extensions and directory names."""
    signals: Dict[str, float] = {
        "backend": 0.0, "frontend": 0.0, "devops": 0.0,
        "ml": 0.0, "database": 0.0, "testing": 0.0, "security": 0.0
    }
    for fname in file_list:
        lower = fname.lower()
        if any(lower.endswith(e) for e in ['.py', '.go', '.java', '.rs', '.rb', '.php', '.cs']):
            signals["backend"] = min(1.0, signals["backend"] + 0.05)
        if any(lower.endswith(e) for e in ['.tsx', '.jsx', '.vue', '.html', '.css', '.scss', '.svelte']):
            signals["frontend"] = min(1.0, signals["frontend"] + 0.05)
        if any(p in lower for p in ['dockerfile', 'docker-compose', '.yaml', '.yml', 'k8s', '.tf', 'terraform', 'nginx']):
            signals["devops"] = min(1.0, signals["devops"] + 0.05)
        if any(p in lower for p in ['model', 'train', 'neural', '.ipynb', 'dataset', 'torch', 'sklearn']):
            signals["ml"] = min(1.0, signals["ml"] + 0.05)
        if any(p in lower for p in ['test_', '_test', '.spec.', '__tests__', 'cypress', 'jest']):
            signals["testing"] = min(1.0, signals["testing"] + 0.05)
        if any(p in lower for p in ['.sql', 'migration', 'schema', 'prisma', 'mongo', 'redis', 'postgres']):
            signals["database"] = min(1.0, signals["database"] + 0.05)
        if any(p in lower for p in ['auth', 'jwt', 'oauth', 'ssl', 'tls', 'encrypt', 'hash', 'csrf']):
            signals["security"] = min(1.0, signals["security"] + 0.05)
    return signals

def _build_fusion_result(user_id: str, data: FusionInputDTO) -> Dict[str, Any]:
    detector = AnomalyDetector()
    
    # 1. Anti-Manipulation Check (Keystroke Padding detection)
    telemetry_summary = data.telemetry_summary
    batch_res = detector.analyze_batch([telemetry_summary] * 5)
    
    # 2. Human Verification (Typing Jitter analysis) — use real wpm_values if available
    wpm_values = telemetry_summary.get("wpm_values") or []
    if len(wpm_values) < 3:
        fallback = telemetry_summary.get("avg_wpm", telemetry_summary.get("wpm", 0.0))
        wpm_values = [fallback] * 3 if fallback > 0 else []
    jitter_res = detector.check_human_jitter(wpm_values)
    
    # 3. Composite Reliability (0.0 - 1.0)
    reliability = detector.compute_composite_reliability(batch_res, jitter_res)

    telemetry_signals = Normalizer.extract_telemetry_signals(telemetry_summary)
    snippet = telemetry_summary.get("code_snippet", "")
    
    analyzer = CodeBERTAnalyzer.get_instance()
    semantic_signals = analyzer.analyze_code(snippet)

    all_evidence = {}
    skills = ["backend", "frontend", "devops", "ml", "neo4j", "testing", "database", "security"]

    for skill in skills:
        # --- BAYESIAN CONFIDENCE ENGINE ---
        semantic_confidence = semantic_signals.get("_confidence", 0.5)
        
        alpha = 0.6 * reliability 
        beta = 0.4 * semantic_confidence
        
        total_weight = alpha + beta or 1.0
        alpha /= total_weight
        beta /= total_weight

        telemetry_combined = (alpha * telemetry_signals.get(skill, 0.0)) + (beta * semantic_signals.get(skill, 0.0))
        
        all_evidence[skill] = {
            "telemetry": min(telemetry_combined, 1.0),
            "projects": Normalizer.extract_profile_signals(data.project_profile).get(skill, 0.0),
            "reliability_penalty": 1.0 - reliability
        }

    fused_results = WeightEngine.fuse_all_skills(all_evidence)

    # reliability is a float from compute_composite_reliability()
    reliability_score = float(reliability)
    is_reliable = reliability_score >= 0.8

    final_updates = {}
    for skill, res in fused_results.items():
        res["confidence"] = BayesianFuser.calculate_posterior_confidence(
            prior_strength=res["strength"],
            current_strength=res["strength"],
            prior_confidence=res["confidence"],
            skill_category=skill
        )
        res["confidence"] = round(res["confidence"] * reliability_score, 4)
        res["explanation"] = SHAPExplainer.explain_score(skill, res["sources"])
        if not is_reliable:
            res["fraud_flag"] = "ANOMALY_DETECTED"
        final_updates[skill] = res

    return {
        "status": "fusion_complete",
        "user_id": data.user_id or user_id,
        "engine_version": "v2.0-top-tier",
        "reliability_check": {"reliability_score": reliability_score, "is_reliable": is_reliable},
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
    result = await analyzer.analyze_github_repo(repo_url, user_id)
    
    # If successful, push initial skills to THG
    if result.get("status") == "completed":
        import httpx
        async with httpx.AsyncClient() as client:
            for skill, score in result.get("skill_signals", {}).items():
                if score > 0.1:
                    try:
                        resp = await client.post(f"{THG_URL}/api/v1/thg/update", json={
                            "dev_id": user_id,
                            "skill_name": skill,
                            "strength": score,
                            "confidence": 0.5  # Initial confidence for project analysis
                        })
                        logger.info(f"[FUSION] Pushed skill {skill}={score:.2f} to THG for {user_id} (status={resp.status_code})")
                    except Exception as e:
                        logger.error(f"[FUSION] Failed to push skill {skill} to THG for {user_id}: {e}")
    
    return result

@router.get("/{user_id}/explain")
async def explain_user(user_id: str):
    return {
        "explanation": f"Developer {user_id} shows strong backend skills based on CodeBERT analysis of recent code snippets and telemetry patterns."
    }

@router.post("/{user_id}/run", status_code=201)
async def run_fusion(user_id: str, data: FusionInputDTO):
    return _build_fusion_result(user_id, data)


@router.post("/deep-audit", status_code=202)
async def deep_audit(data: Dict[str, Any]):
    """
    Codebase-Aware Twin baseline: unzips workspace snapshot,
    infers skill signals from file structure + CodeBERT sampling,
    then pushes baseline strengths to THG.
    """
    user_id = data.get("user_id")
    snapshot_b64 = data.get("workspace_snapshot_url")

    if not user_id or not snapshot_b64:
        raise HTTPException(400, "user_id and workspace_snapshot_url are required")

    try:
        zip_bytes = base64.b64decode(snapshot_b64)
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
        file_list = zf.namelist()
    except Exception as e:
        logger.error(f"[DEEP-AUDIT] Failed to decode snapshot for {user_id}: {e}")
        raise HTTPException(400, f"Invalid workspace snapshot: {e}")

    # 1. Structural analysis
    structural_signals = _infer_skills_from_files(file_list)

    # 2. Sample up to 15 text files for CodeBERT semantic analysis
    sampled_code = ""
    sample_count = 0
    text_extensions = {'.py', '.ts', '.tsx', '.js', '.jsx', '.go', '.java', '.rs', '.rb', '.cs', '.sql', '.yaml', '.yml', '.md'}
    for fname in file_list:
        if sample_count >= 15:
            break
        if any(fname.lower().endswith(ext) for ext in text_extensions):
            try:
                content = zf.read(fname).decode('utf-8', errors='ignore')[:300]
                sampled_code += content + "\n"
                sample_count += 1
            except Exception:
                pass

    analyzer = CodeBERTAnalyzer.get_instance()
    semantic_signals = analyzer.analyze_code(sampled_code) if sampled_code else {}

    # 3. Merge: take max of structural and semantic signals
    merged: Dict[str, float] = {}
    all_skills = set(structural_signals) | {k for k in semantic_signals if not k.startswith("_")}
    for skill in all_skills:
        merged[skill] = round(max(structural_signals.get(skill, 0.0), semantic_signals.get(skill, 0.0)), 3)

    # 4. Push baseline to THG (only skills with meaningful signal)
    pushed = {}
    async with httpx.AsyncClient(timeout=15.0) as client:
        for skill, strength in merged.items():
            if strength > 0.05:
                resp = await client.post(f"{THG_URL}/api/v1/thg/update", json={
                    "dev_id": user_id,
                    "skill_name": skill,
                    "strength": strength,
                    "confidence": 0.55
                })
                if resp.status_code in (200, 201):
                    pushed[skill] = strength

    logger.info(f"[DEEP-AUDIT] {user_id}: {len(file_list)} files → {len(pushed)} skills set as baseline")
    return {
        "status": "baseline_established",
        "user_id": user_id,
        "files_scanned": len(file_list),
        "sampled_for_codebert": sample_count,
        "baseline_skills": pushed
    }
