from pydantic import BaseModel
from typing import Dict

class SkillUpdateDTO(BaseModel):
    skill_name: str
    strength: float
    confidence: float
    sources: Dict[str, float]

class FusionInputDTO(BaseModel):
    user_id: str
    telemetry_summary: Dict
    resume_profile: Dict
    project_profile: Dict
    weekly_tests: List[Dict] = []
