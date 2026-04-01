from pydantic import BaseModel
from typing import Dict

class SkillUpdateDTO(BaseModel):
    skill_name: str
    strength: float
    confidence: float
    sources: Dict[str, float]
