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