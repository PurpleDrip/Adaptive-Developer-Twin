from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class Question(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_option: int # 0-3 index
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
    submission_id: str
    test_id: str
    user_id: str
    answers: Dict[str, int] # question_id -> selected_option
    score: float = 0.0
    verified_at: datetime = Field(default_factory=datetime.utcnow)
    is_legit: bool = True # Flagged by anti-cheat logic
