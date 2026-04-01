from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.services.neo4j import get_neo4j_session

router = APIRouter(prefix="/thg", tags=["Temporal Heterogeneous Graph"])

# Request/Response Models
class SkillUpdateDTO(BaseModel):
    dev_id: str
    skill_name: str
    strength: float      # [0,1]
    confidence: float    # [0,1]

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
    required_skills: Dict[str, float]  # {"backend": 0.85, "neo4j": 0.7}

class MatchResult(BaseModel):
    task_id: str
    candidates: List[Dict[str, Any]]

# 1. Update Developer Skill (Fusion → THG)
@router.post("/update", status_code=201)
async def update_skill(
    skill_data: SkillUpdateDTO,
    session=Depends(get_neo4j_session)
):
    """
    Fusion engine updates THG. 
    Implements Temporal Exponential Decay (lambda=0.1) on previous strength.
    """
    result = await session.run("""
        MERGE (d:Developer {id: $dev_id})
        MERGE (s:Skill {name: $skill_name})
        MERGE (d)-[r:HAS_SKILL]->(s)
        ON CREATE SET r.strength = $strength, r.updated = datetime()
        ON MATCH SET 
            r.prev_strength = r.strength,
            r.strength = (r.strength * exp(-0.1 * duration.inDays(r.updated, datetime()).days)) + ($strength * 0.5),
            r.updated = datetime()
        SET r.confidence = $confidence
        RETURN d.id, s.name, r.strength, r.confidence
    """, dev_id=skill_data.dev_id, skill_name=skill_data.skill_name,
         strength=skill_data.strength, confidence=skill_data.confidence)
    
    record = await result.single(2.0)
    return {
        "status": "updated",
        "dev_id": record["d.id"],
        "skill": record["s.name"],
        "decayed_strength": float(record["r.strength"])
    }

# 2. Get Developer Skills (Dashboard with Live Decay)
@router.get("/{dev_id}/skills", response_model=DeveloperSkills)
async def get_developer_skills(
    dev_id: str,
    session=Depends(get_neo4j_session)
):
    """Get complete skill profile for developer with LIVE temporal decay."""
    result = await session.run("""
        MATCH (d:Developer {id: $dev_id})-[r:HAS_SKILL]->(s:Skill)
        WITH d, r, s, duration.inDays(r.updated, datetime()).days as days_passed
        RETURN d.id, d.name, 
               s.name, (r.strength * exp(-0.1 * days_passed)) as strength, 
               r.confidence, r.updated
        ORDER BY strength DESC
    """, dev_id=dev_id)
    
    records = await result.data()
    if not records:
        raise HTTPException(404, f"Developer {dev_id} not found")
    
    record = records[0]
    skills = [
        SkillDTO(
            name=r["s.name"],
            strength=float(r["strength"]),
            confidence=float(r["r.confidence"]),
            updated=r["r.updated"]
        )
        for r in records
    ]
    
    return DeveloperSkills(dev_id=record["d.id"], name=record["d.name"], skills=skills)

# 3. Task-Developer Matching (Cosine Similarity)
@router.post("/match", response_model=MatchResult)
async def match_task(
    task: TaskMatchDTO,
    session=Depends(get_neo4j_session),
    limit: int = 3
):
    """Cosine similarity matching via Cypher + GDS."""
    result = await session.run("""
        UNWIND $required_skills as req
        MATCH (t:Task {id: $task_id})-[:REQUIRES_SKILL]->(req_skill:Skill {name: req.skill})
        MATCH (d:Developer)-[r:HAS_SKILL]->(dev_skill:Skill {name: req.skill})
        WITH d, avg((r.strength * req.weight)) as match_score
        WHERE match_score > 0.5
        RETURN d.id, d.name, match_score
        ORDER BY match_score DESC
        LIMIT $limit
    """, task_id=task.task_id, required_skills=[
        {"skill": k, "weight": v} for k, v in task.required_skills.items()
    ], limit=limit)
    
    records = await result.data()
    return MatchResult(
        task_id=task.task_id,
        candidates=[{
            "dev_id": r["d.id"],
            "name": r["d.name"],
            "match_score": float(r["match_score"])
        } for r in records]
    )

# 4. Leaderboard (Gamification)
@router.get("/leaderboard/{skill_name}")
async def get_leaderboard(
    skill_name: str,
    session=Depends(get_neo4j_session),
    limit: int = 12
):
    """Top developers by skill (monthly rankings)."""
    result = await session.run("""
        MATCH (d:Developer)-[r:HAS_SKILL]->(s:Skill {name: $skill_name})
        RETURN d.id, d.name, r.strength, r.confidence
        ORDER BY r.strength DESC
        LIMIT $limit
    """, skill_name=skill_name, limit=limit)
    
    records = await result.data()
    return [{
        "rank": idx + 1,
        "dev_id": r["d.id"],
        "name": r["d.name"],
        "strength": float(r["r.strength"]),
        "confidence": float(r["r.confidence"])
    } for idx, r in enumerate(records)]

# 5. Team Analytics (HR Dashboard)
@router.get("/teams/{team_id}/clusters")
async def get_team_clusters(
    team_id: str,
    session=Depends(get_neo4j_session)
):
    """
    Groups developers by skill profiles using K-Means (Simulated).
    Identifies 'Elite', 'Growing', and 'Specialist' clusters.
    """
    result = await session.run("""
        MATCH (t:Team {id: $team_id})<-[:BELONGS_TO]-(d:Developer)
        MATCH (d)-[r:HAS_SKILL]->(s:Skill)
        WITH d.name as name, s.name as skill, r.strength as score
        RETURN name, collect({skill: skill, score: score}) as profile
    """, team_id=team_id)
    
    records = await result.data()
    clusters = {"Elite": [], "Growing": [], "Specialists": []}
    
    for r in records:
        avg_score = sum([s['score'] for s in r['profile']]) / len(r['profile'])
        if avg_score > 0.7: clusters["Elite"].append(r['name'])
        elif avg_score > 0.4: clusters["Growing"].append(r['name'])
        else: clusters["Specialists"].append(r['name'])
        
    return {
        "team_id": team_id,
        "clusters": clusters
    }

@router.get("/teams/{team_id}/avg-skills")
async def get_team_skills(
    team_id: str,
    session=Depends(get_neo4j_session)
):
    """Aggregate team skill levels."""
    result = await session.run("""
        MATCH (t:Team {id: $team_id})<-[:BELONGS_TO]-(d:Developer)
        MATCH (d)-[r:HAS_SKILL]->(s:Skill)
        RETURN s.name, avg(r.strength) as avg_strength, 
               count(d) as team_size
        ORDER BY avg_strength DESC
    """, team_id=team_id)
    
    records = await result.data()
    return [{
        "skill": r["s.name"],
        "avg_strength": float(r["avg_strength"]),
        "team_size": int(r["team_size"])
    } for r in records]


# 6. Generate Dummy Graph (SIH Demo Setup)
@router.post("/generate-demo-data")
async def generate_demo_graph(session=Depends(get_neo4j_session)):
    """Generate complete dummy THG for SIH demo (12 devs, 8 skills, 3 tasks)."""
    
    # Clear existing data
    await session.run("MATCH (n) DETACH DELETE n")
    
    # Bulk insert demo data (Shashanth + 11 teammates)
    result = await session.run("""
        // Developers (12 total)
        CREATE (shashanth:Developer {id: 'shashanth_001', name: 'Shashanth Vemuri', team: 'backend'})
        CREATE (ravi:Developer {id: 'ravi_002', name: 'Ravi Kumar', team: 'backend'})
        CREATE (priya:Developer {id: 'priya_003', name: 'Priya Sharma', team: 'frontend'})
        CREATE (arun:Developer {id: 'arun_004', name: 'Arun Patel', team: 'devops'})
        CREATE (divya:Developer {id: 'divya_005', name: 'Divya Singh', team: 'backend'})
        CREATE (karan:Developer {id: 'karan_006', name: 'Karan Mehta', team: 'ml'})
        CREATE (neha:Developer {id: 'neha_007', name: 'Neha Gupta', team: 'frontend'})
        CREATE (vikas:Developer {id: 'vikas_008', name: 'Vikas Reddy', team: 'backend'})
        CREATE (anita:Developer {id: 'anita_009', name: 'Anita Desai', team: 'devops'})
        CREATE (rahul:Developer {id: 'rahul_010', name: 'Rahul Joshi', team: 'ml'})
        CREATE (sneha:Developer {id: 'sneha_011', name: 'Sneha Nair', team: 'frontend'})
        CREATE (mohan:Developer {id: 'mohan_012', name: 'Mohan Das', team: 'backend'})
        
        // Skills (8 total)
        CREATE (backend:Skill {name: 'backend'})
        CREATE (frontend:Skill {name: 'frontend'})
        CREATE (devops:Skill {name: 'devops'})
        CREATE (ml:Skill {name: 'ml'})
        CREATE (neo4j:Skill {name: 'neo4j'})
        CREATE (react:Skill {name: 'react'})
        CREATE (docker:Skill {name: 'docker'})
        CREATE (testing:Skill {name: 'testing'})
        
        // Shashanth's skills (🥇 Backend Master)
        CREATE (shashanth)-[:HAS_SKILL {strength: 0.719, confidence: 0.872, updated: datetime()}]->(backend)
        CREATE (shashanth)-[:HAS_SKILL {strength: 0.620, confidence: 0.810, updated: datetime()}]->(neo4j)
        CREATE (shashanth)-[:HAS_SKILL {strength: 0.450, confidence: 0.720, updated: datetime()}]->(docker)
        
        // Ravi (🥈 Backend)
        CREATE (ravi)-[:HAS_SKILL {strength: 0.680, confidence: 0.850, updated: datetime()}]->(backend)
        CREATE (ravi)-[:HAS_SKILL {strength: 0.590, confidence: 0.780, updated: datetime()}]->(devops)
        
        // Priya (🥇 Frontend)
        CREATE (priya)-[:HAS_SKILL {strength: 0.810, confidence: 0.920, updated: datetime()}]->(frontend)
        CREATE (priya)-[:HAS_SKILL {strength: 0.720, confidence: 0.850, updated: datetime()}]->(react)
        
        // Tasks (3 demo tasks)
        CREATE (auth_task:Task {id: 'auth-api', title: 'JWT Auth Service'})
        CREATE (dashboard_task:Task {id: 'dashboard-ui', title: 'React Dashboard'})
        CREATE (pipeline_task:Task {id: 'ci-cd', title: 'CI/CD Pipeline'})
        
        // Task requirements
        CREATE (auth_task)-[:REQUIRES_SKILL {weight: 0.85}]->(backend)
        CREATE (auth_task)-[:REQUIRES_SKILL {weight: 0.60}]->(neo4j)
        CREATE (dashboard_task)-[:REQUIRES_SKILL {weight: 0.90}]->(frontend)
        CREATE (dashboard_task)-[:REQUIRES_SKILL {weight: 0.70}]->(react)
        CREATE (pipeline_task)-[:REQUIRES_SKILL {weight: 0.80}]->(devops)
        CREATE (pipeline_task)-[:REQUIRES_SKILL {weight: 0.70}]->(docker)
        
        // Team relationships
        CREATE (shashanth)-[:BELONGS_TO]->(backend_team:Team {id: 'backend-team', name: 'Backend Squad'})
        CREATE (ravi)-[:BELONGS_TO]->(backend_team)
        CREATE (vikas)-[:BELONGS_TO]->(backend_team)
        CREATE (divya)-[:BELONGS_TO]->(backend_team)
        CREATE (mohan)-[:BELONGS_TO]->(backend_team)
    """)
    
    await result.consume()
    return {
        "status": "success",
        "message": "Demo THG generated! 12 devs, 8 skills, 3 tasks",
        "shashanth_status": "🥇 Backend #1 (0.719), Neo4j #1 (0.620)"
    }