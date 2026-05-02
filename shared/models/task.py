"""
ADT Task Model — Task creation, assignment, review, and completion.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class TaskCreateDTO(BaseModel):
    """Senior Dev creates a task."""
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=10000)
    required_skills: Dict[str, float] = Field(..., description="skill_name → importance weight (0-1)")
    priority: str = Field(default="medium", pattern=r'^(low|medium|high|critical)$')
    estimated_hours: Optional[float] = Field(default=None, ge=0.5, le=500)
    created_by: str = Field(..., description="user_id of senior dev")


class TaskAssignDTO(BaseModel):
    """Assign a task to a developer."""
    task_id: str
    assigned_to: str = Field(..., description="user_id of developer")
    assigned_by: str = Field(..., description="user_id of senior dev")


class TaskReviewDTO(BaseModel):
    """Senior Dev reviews completed task."""
    task_id: str
    reviewed_by: str = Field(..., description="user_id of reviewer")
    review_comment: str = Field(..., min_length=2, max_length=2000,
                                description="e.g., 'good job', 'needs practice', etc.")
    review_score: float = Field(..., ge=0.0, le=1.0,
                                description="0.0 = terrible, 0.5 = average, 1.0 = exceptional")
    skills_demonstrated: Optional[Dict[str, float]] = Field(
        default=None,
        description="Override which skills were demonstrated and how well"
    )


class TaskDocument:
    """MongoDB document for tasks collection."""
    @staticmethod
    def create(dto: TaskCreateDTO, task_id: str) -> dict:
        return {
            "task_id": task_id,
            "title": dto.title,
            "description": dto.description,
            "required_skills": dto.required_skills,
            "priority": dto.priority,
            "estimated_hours": dto.estimated_hours,
            "created_by": dto.created_by,
            "assigned_to": None,
            "assigned_by": None,
            "status": "open",  # open → assigned → in_progress → review → completed
            "ranked_candidates": [],
            "review_comment": None,
            "review_score": None,
            "reviewed_by": None,
            "skills_demonstrated": None,
            "created_at": datetime.utcnow(),
            "assigned_at": None,
            "started_at": None,
            "completed_at": None,
            "reviewed_at": None,
        }
