from pydantic import BaseModel
from typing import Dict, List, Any

class SkillUpdateDTO(BaseModel):
    dev_id: str
    skill_name: str
    strength: float      # [0,1]
    confidence: float    # [0,1]

class GraphSearchDTO(BaseModel):
    user_id: str
