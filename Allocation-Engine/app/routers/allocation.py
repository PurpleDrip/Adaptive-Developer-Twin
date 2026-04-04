from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import os
from datetime import datetime
from app.services.skill_matcher import SkillMatcher

class TaskRequest(BaseModel):
    task_desc: str
    min_confidence: float = 0.5

router = APIRouter(tags=["allocation"])
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")

@router.post("/rank", status_code=200)
@router.post("/allocation/rank", status_code=200)
async def rank_devs(request: TaskRequest):
    """
    Production-Level Smart Allocation Algorithm.
    1. Embeds Task Description using CodeBERT (Semantic Core).
    2. Fetches all active Developers' Skill Vectors from the Live Graph (THG).
    3. Calculates Cosine Similarity with Multi-Factor weighting.
    """
    async with httpx.AsyncClient() as client:
        # 1. SEMANTIC VECTORIZATION: Call CodeBERT to understand the task
        try:
            f_resp = await client.post(f"{FUSION_URL}/api/v1/fusion/fusion/analyze-text", json={"text": request.task_desc})
            task_vector = f_resp.json().get("vector", {"general": 1.0})
        except:
            task_vector = {"general": 1.0}
    
        # 2. FETCH LATEST DATA: Query all developers and their skill states from Neo4j
        try:
            thg_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/developers")
            developers = thg_resp.json()
        except:
            developers = []
    
    # 3. Calculate Scores
    ranked = []
    for dev in developers:
        skills = dev.get("skills", {})
        if not skills: skills = {"general": 0.1}
        
        # Calculate match using real AI vector vs graph skills
        match_score = SkillMatcher.calculate_match(task_vector, skills)
        conf = dev.get("confidence", 0.5)
        # Final Score: 70% skill match, 30% confidence in data
        final_score = (match_score * 0.7) + (float(conf) * 0.3)
        
        ranked.append({
            "user_id": dev["id"],
            "name": dev["name"],
            "match_score": round(final_score, 2),
            "primary_skill": max(skills, key=skills.get) if skills else "General"
        })
        
    # Sort by descending match score
    ranked.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "task": request.task_desc,
        "ranked_candidates": ranked,
        "algorithm": "Semantic-Weighted-Rank-v2"
    }

@router.post("/select", status_code=200)
@router.post("/allocation/select", status_code=200)
async def select_dev(user_id: str, task_id: str):
    """
    Updates THG when a developer is manually selected for a task.
    Commits the 'ASSIGNED_TO' relationship to Neo4j.
    """
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(f"{THG_URL}/api/v1/thg/thg/record-assignment", json={
                "dev_id": user_id,
                "task_id": task_id
            })
            resp.raise_for_status()
            return {
                "status": "success",
                "message": f"Developer {user_id} assigned to task {task_id}. Graph Persistent.",
                "assigned_at": datetime.now().isoformat()
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database Commitment Failed: {str(e)}")
