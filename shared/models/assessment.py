from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class Question(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_option: str # "A", "B", "C", "D"
    domain: str

class WeeklyTest(BaseModel):
    test_id: str
    title: str
    domain: str
    created_by: str # Manager ID
    questions: List[Question]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class TestSubmission(BaseModel):
    submission_id: Optional[str] = None
    test_id: str
    user_id: str
    answers: Dict[str, str] # question_id -> selected_option
    score: float = 0.0
    verified_at: datetime = Field(default_factory=datetime.utcnow)
    is_legit: bool = True # Flagged by anti-cheat logic
