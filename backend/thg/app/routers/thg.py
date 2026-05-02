from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from app.services.neo4j import get_neo4j_session

router = APIRouter(prefix="/thg", tags=["Temporal Heterogeneous Graph"])

# Request/Response Models
class SkillUpdateDTO(BaseModel):
    dev_id: str
    skill_name: str
    strength: float
    confidence: float

class SkillDTO(BaseModel):
    name: str
    strength: float
    confidence: float
    updated: datetime

class DeveloperSkills(BaseModel):
    dev_id: str
    name: str
    skills: List[SkillDTO]

class TaskMatchDTO(BaseModel):
    task_id: str
    required_skills: Dict[str, float]

class DeveloperCreateDTO(BaseModel):
    dev_id: str
    name: str
    bio: Optional[str] = "Professional Developer"
    gender: Optional[str] = "Other"
    primary_domain: str

class MatchResult(BaseModel):
    task_id: str
    candidates: List[Dict[str, Any]]

class AssignmentDTO(BaseModel):
    dev_id: str
    task_id: str

def _normalize_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if hasattr(value, "to_native"):
        return value.to_native()
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.utcnow()

# 0. Initialize Developer Node (Auth → THG)
@router.post("/create-dev", status_code=201)
async def create_dev(
    dev: DeveloperCreateDTO,
    session=Depends(get_neo4j_session)
):
    """Initializes a developer in the graph with safe defaults."""
    await session.run("""
        MERGE (d:Developer {id: $dev_id})
        SET d.name = $name,
            d.bio = coalesce($bio, 'Dev'),
            d.gender = coalesce($gender, 'Other'),
            d.primary_domain = $primary_domain,
            d.created_at = datetime()
    """, dev_id=dev.dev_id, name=dev.name, bio=dev.bio, 
         gender=dev.gender, primary_domain=dev.primary_domain)
    
    return {"status": "success", "message": f"Dev {dev.dev_id} sync'd to Neo4j"}

# 1. Update Developer Skill (Fusion → THG)
@router.post("/update", status_code=201)
async def update_skill(
    skill_data: SkillUpdateDTO,
    session=Depends(get_neo4j_session)
):
    """
    Updates skill in Neo4j. Implements temporal decay.
    """
    result = await session.run("""
        MATCH (d:Developer {id: $dev_id})
        MERGE (s:Skill {name: $skill_name})
        MERGE (d)-[r:HAS_SKILL]->(s)
        ON CREATE SET r.strength = $strength, r.updated = datetime(), r.prev_strength = 0.0
        ON MATCH SET 
            r.prev_strength = r.strength,
            r.strength = (coalesce(r.strength, 0.0) * exp(-0.1 * duration.inDays(coalesce(r.updated, datetime()), datetime()).days)) + ($strength * 0.5),
            r.updated = datetime()
        SET r.confidence = $confidence
        RETURN d.id AS dev_id, s.name AS skill_name, r.strength AS strength
    """, dev_id=skill_data.dev_id, skill_name=skill_data.skill_name,
         strength=skill_data.strength, confidence=skill_data.confidence)
    
    record = await result.single()
    if not record:
        raise HTTPException(404, "Developer not found in graph. Primary sync failed.")

    return {
        "status": "updated",
        "dev_id": record["dev_id"],
        "skill": record["skill_name"],
        "strength": float(record["strength"])
    }

# 2. Get Developer Skills (Live Profile)
@router.get("/{dev_id}/skills", response_model=DeveloperSkills)
async def get_developer_skills(
    dev_id: str,
    session=Depends(get_neo4j_session)
):
    """Fetches real profile with live decay math from Neo4j."""
    result = await session.run("""
        MATCH (d:Developer {id: $dev_id})
        OPTIONAL MATCH (d)-[r:HAS_SKILL]->(s:Skill)
        WITH d, r, s, duration.inDays(coalesce(r.updated, datetime()), datetime()).days as days_passed
        RETURN d.id AS dev_id, d.name AS name, 
               coalesce(s.name, 'none') AS skill_name, 
               coalesce(r.strength * exp(-0.1 * days_passed), 0.0) AS strength, 
               coalesce(r.confidence, 0.0) AS confidence, 
               coalesce(r.updated, datetime()) AS updated
        ORDER BY strength DESC
    """, dev_id=dev_id)
    
    records = await result.data()
    if not records:
        raise HTTPException(404, f"Dev {dev_id} not in Neo4j")
    
    skills = [
        SkillDTO(
            name=r["skill_name"],
            strength=float(r["strength"]),
            confidence=float(r["confidence"]),
            updated=_normalize_datetime(r["updated"])
        )
        for r in records if r["skill_name"] != "none"
    ]
    
    return DeveloperSkills(dev_id=records[0]["dev_id"], name=records[0]["name"], skills=skills)

# 3. Match Task
@router.post("/match", response_model=MatchResult)
async def match_task(task: TaskMatchDTO, session=Depends(get_neo4j_session)):
    result = await session.run("""
        UNWIND $required_skills as req
        MATCH (d:Developer)-[r:HAS_SKILL]->(s:Skill {name: req.skill})
        WITH d, avg(r.strength * req.weight) as score
        WHERE score > 0.3
        RETURN d.id AS dev_id, d.name AS name, score
        ORDER BY score DESC LIMIT 5
    """, required_skills=[{"skill": k, "weight": v} for k, v in task.required_skills.items()])
    
    records = await result.data()
    return MatchResult(task_id=task.task_id, candidates=[{
        "dev_id": r["dev_id"], "name": r["name"], "match_score": float(r["score"])
    } for r in records])

# 4. Leaderboard
@router.get("/leaderboard/{skill_name}")
async def get_leaderboard(skill_name: str, session=Depends(get_neo4j_session)):
    result = await session.run("""
        MATCH (d:Developer)-[r:HAS_SKILL]->(s:Skill {name: $skill_name})
        RETURN d.id AS dev_id, d.name AS name, r.strength AS strength, r.confidence AS confidence
        ORDER BY strength DESC LIMIT 10
    """, skill_name=skill_name)
    
    records = await result.data()
    return [{
        "rank": i+1, "dev_id": r["dev_id"], "name": r["name"], 
        "strength": float(r["strength"]), "confidence": float(r["confidence"])
    } for i, r in enumerate(records)]

@router.get("/developers")
async def get_all_developers(session=Depends(get_neo4j_session)):
    result = await session.run("""
        MATCH (d:Developer)
        OPTIONAL MATCH (d)-[r:HAS_SKILL]->(s:Skill)
        RETURN d.id AS dev_id, d.name AS name, 
               collect({skill: s.name, strength: r.strength}) AS skills,
               avg(r.confidence) AS avg_conf
    """)
    records = await result.data()
    return [{
        "id": r["dev_id"], "name": r["name"], 
        "skills": {s['skill']: float(s['strength']) for s in r['skills'] if s['skill'] is not None},
        "confidence": float(r["avg_conf"]) if r["avg_conf"] else 0.5
    } for r in records]

@router.post("/record-assignment", status_code=201)
async def record_assignment(data: AssignmentDTO, session=Depends(get_neo4j_session)):
    await session.run("MERGE (d:Developer {id:$d}) MERGE (t:Task {id:$t}) MERGE (d)-[r:ASSIGNED_TO]->(t) SET r.at = datetime()", d=data.dev_id, t=data.task_id)
    return {"status": "success"}

@router.post("/generate-demo-data")
async def generate_demo_graph(session=Depends(get_neo4j_session)):
    await session.run("MATCH (n) DETACH DELETE n")
    await session.run("""
        CREATE (d:Developer {id: 'shashanth_001', name: 'Shashanth Vemuri'})
        CREATE (s:Skill {name: 'backend'})
        CREATE (d)-[:HAS_SKILL {strength: 0.8, confidence: 0.9, updated: datetime()}]->(s)
    """)
    return {"status": "reset_complete"}

# 5. Graph Analytics - PageRank Influence
@router.get("/influence")
async def get_influence_ranking(session=Depends(get_neo4j_session)):
    """
    Uses Neo4j Graph Data Science (GDS) to compute developer influence.
    Measures how central a developer is to the skills/tasks graph.
    """
    try:
        # Create a projection if not exists (simplified for the endpoint)
        await session.run("""
            CALL gds.graph.project.cypher(
                'influence_graph',
                'MATCH (n) WHERE n:Developer OR n:Skill RETURN id(n) AS id',
                'MATCH (d:Developer)-[r:HAS_SKILL]->(s:Skill) RETURN id(d) AS source, id(s) AS target'
            ) YIELD graphName
        """)
    except:
        pass # Already exists or GDS not ready

    result = await session.run("""
        CALL gds.pageRank.stream('influence_graph')
        YIELD nodeId, score
        MATCH (d:Developer) WHERE id(d) = nodeId
        RETURN d.id AS dev_id, d.name AS name, score
        ORDER BY score DESC LIMIT 10
    """)
    
    records = await result.data()
    return [{"rank": i+1, "dev_id": r["dev_id"], "name": r["name"], "influence_score": round(r["score"], 4)} 
            for i, r in enumerate(records)]
