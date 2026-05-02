from fastapi import APIRouter, HTTPException
import os
import httpx
from typing import List, Dict, Any

router = APIRouter()
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

@router.get("/")
async def get_global_leaderboard(skill: str = "backend"):
    """
    Combines Skill Strength (from THG) and Influence (PageRank) 
    to create a composite ranking.
    """
    async with httpx.AsyncClient() as client:
        # 1. Fetch Skill Strengths
        try:
            skill_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/leaderboard/{skill}")
            skills_data = skill_resp.json()
        except:
            skills_data = []

        # 2. Fetch Influence (PageRank)
        try:
            influence_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/influence")
            influence_data = {r["dev_id"]: r["influence_score"] for r in influence_resp.json()}
        except:
            influence_data = {}

    # 3. Composite Scoring: 70% Skill, 30% Influence
    leaderboard = []
    for s in skills_data:
        dev_id = s["dev_id"]
        influence = influence_data.get(dev_id, 1.0) # PageRank defaults to 1.0
        
        # Normalize influence (assuming PageRank scores are around 1.0-5.0)
        norm_influence = min(1.0, (influence - 1.0) / 4.0) if influence > 1.0 else 0.0
        
        composite_score = (s["strength"] * 0.7) + (norm_influence * 0.3)
        
        leaderboard.append({
            "dev_id": dev_id,
            "name": s["name"],
            "skill_strength": s["strength"],
            "influence_score": round(influence, 4),
            "composite_score": round(composite_score, 4)
        })

    leaderboard.sort(key=lambda x: x["composite_score"], reverse=True)
    return leaderboard
