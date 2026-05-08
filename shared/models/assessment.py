from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class Question(BaseModel):
    id: str
    text: str
    options: List[str]
    correct_option: int # Index of the correct option
    domain: str # e.g. "python", "rust"

class AssessmentCreateDTO(BaseModel):
    manager_id: str
    title: str
    domain: str
    questions: List[Question] # Exactly 10 questions as per requirement
    expiry_date: Optional[datetime] = None

class AssessmentSubmissionDTO(BaseModel):
    user_id: str
    assessment_id: str
    answers: List[int] # List of selected option indices

class AssessmentResult(BaseModel):
    user_id: str
    assessment_id: str
    score: float # 0 to 1
    domain: str
    skill_delta: float # How much to increase/decrease in THG
    created_at: datetime = Field(default_factory=datetime.utcnow)
