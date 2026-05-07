from pydantic import BaseModel
from typing import Dict, List, Any

class SkillUpdateDTO(BaseModel):
    skill_name: str
    strength: float
    confidence: float
    sources: Dict[str, float]

class FusionInputDTO(BaseModel):
    user_id: str | None = None
    telemetry_summary: Dict[str, Any]
    project_profile: Dict[str, Any]
    weekly_tests: List[Dict[str, Any]] = []

class InvestorAssessmentDTO(BaseModel):
    user_id: str | None = None
    telemetry_summary: Dict[str, Any]
    project_profile: Dict[str, Any] = {}
    weekly_tests: List[Dict[str, Any]] = []
    telemetry_batch: List[Dict[str, Any]] = []
    expected_skills: Dict[str, float] = {}
