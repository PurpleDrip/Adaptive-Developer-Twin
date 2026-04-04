from fastapi import APIRouter, Depends
from app.services.neo4j import get_neo4j_session

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/team-skills")
async def get_team_skills(team: str = "backend-team", session=Depends(get_neo4j_session)):
    result = await session.run("""
        MATCH (d:Developer)-[r:HAS_SKILL]->(s:Skill)
        WHERE d.primary_domain = $team
        RETURN s.name AS skill, avg(r.strength) AS avg_strength, count(d) AS dev_count
        ORDER BY avg_strength DESC
    """, team=team)
    
    skills = []
    async for record in result:
        skills.append({
            "skill": record["skill"],
            "avg_strength": float(record["avg_strength"]),
            "dev_count": record["dev_count"]
        })
    
    return {"team": team, "skills": skills}