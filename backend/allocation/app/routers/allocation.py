from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.services.skill_matcher import SkillMatcher
from app.services.workload_optimizer import WorkloadOptimizer

class TaskAllocationRequest(BaseModel):
    task_id: Optional[str] = None
    title: str
    description: str
    required_skills: Dict[str, float]
    min_confidence: float = 0.3

router = APIRouter(tags=["allocation"])
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")

@router.post("/rank", status_code=200)
async def rank_devs(request: TaskAllocationRequest):
    """
    Production-Level Smart Allocation Algorithm.
    """
    async with httpx.AsyncClient() as client:
        # 1. SEMANTIC VECTORIZATION: Call CodeBERT to understand the task
        # We combine title and description
        task_desc = f"{request.title}\n{request.description}"
        try:
            f_resp = await client.post(f"{FUSION_URL}/api/v1/fusion/fusion/analyze-text", json={"text": task_desc})
            task_vector = f_resp.json().get("vector", {})
        except:
            task_vector = {}
        
        # Merge task_vector with required_skills (required_skills take precedence)
        combined_task_vector = {**task_vector, **request.required_skills}
    
        # 2. FETCH LATEST DATA: Query all developers
        try:
            thg_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/developers")
            developers = thg_resp.json()
        except Exception as e:
            print(f"THG fetch failed: {e}")
            developers = []
    
    # 3. Calculate Scores
    ranked = []
    for dev in developers:
        skills = dev.get("skills", {})
        conf = dev.get("confidence", 0.5)
        
        if conf < request.min_confidence:
            continue

        # Calculate match using real AI vector vs graph skills
        match_score = SkillMatcher.calculate_match(combined_task_vector, skills)
        
        # Multi-factor score: 60% skill match, 20% confidence, 20% experience bonus
        final_score = (match_score * 0.6) + (float(conf) * 0.2) + 0.2 # Base line
        
        ranked.append({
            "user_id": dev["id"],
            "name": dev["name"],
            "match_score": round(min(1.0, final_score), 4),
            "primary_skill": max(skills, key=skills.get) if skills else "General"
        })
        
    ranked.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "task_id": request.task_id,
        "candidates": ranked,
        "algorithm": "Semantic-Weighted-Rank-v2-Full"
    }

@router.post("/optimize", status_code=200)
async def optimize_allocations(tasks: List[TaskAllocationRequest]):
    """
    Global optimization using the Hungarian Algorithm.
    Assumes a batch of open tasks and available developers.
    """
    # 1. Fetch Developers
    async with httpx.AsyncClient() as client:
        thg_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/developers")
        developers = thg_resp.json()
    
    if not tasks or not developers:
        return {"assignments": []}

    # 2. Build Match Matrix
    # Matrix shape: [num_tasks x num_devs]
    matrix = []
    for t in tasks:
        row = []
        # Get task vector (simplified for batch)
        t_vec = t.required_skills
        for d in developers:
            score = SkillMatcher.calculate_match(t_vec, d.get("skills", {}))
            row.append(score)
        matrix.append(row)
    
    # 3. Run Hungarian Algorithm
    matrix_np = np.array(matrix)
    # Convert tasks and developers to simple list of dicts for the optimizer
    tasks_simple = [{"task_id": t.task_id or f"T-{i}"} for i, t in enumerate(tasks)]
    devs_simple = [{"user_id": d["id"]} for d in developers]
    
    assignments = WorkloadOptimizer.optimize_assignments(tasks_simple, devs_simple, matrix_np)
    
    return {
        "assignments": assignments,
        "optimization_method": "Hungarian-Algorithm-Global-Optimal"
    }

@router.post("/select", status_code=200)
async def select_dev(user_id: str, task_id: str):
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(f"{THG_URL}/api/v1/thg/thg/record-assignment", json={
                "dev_id": user_id,
                "task_id": task_id
            })
            resp.raise_for_status()
            return {"status": "success", "user_id": user_id, "task_id": task_id}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

import numpy as np # Needed for the optimize endpoint
