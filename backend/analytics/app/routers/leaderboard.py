from fastapi import APIRouter
from app.api.clients import THGClient

router = APIRouter(prefix="/api/v1/analytics/leaderboard")

@router.get("")
async def get_global_leaderboard(skill: str = "backend"):
    """
    Combines Skill Strength (from THG) and Influence (PageRank) 
    to create a composite ranking.
    """
    # 1. Fetch Skill Strengths
    skills_data = await THGClient.get_skills_leaderboard(skill)

    # 2. Fetch Influence (PageRank)
    raw_influence = await THGClient.get_influence()
    influence_data = {r["dev_id"]: r["influence_score"] for r in raw_influence} if isinstance(raw_influence, list) else {}

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
