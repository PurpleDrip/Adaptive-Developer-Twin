"""
ADT Weekly Test & Feedback Models.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class WeeklyTestSubmitDTO(BaseModel):
    """Developer submits weekly test results."""
    user_id: str
    week_number: int = Field(..., ge=1, le=52)
    year: int = Field(..., ge=2024, le=2100)
    test_scores: Dict[str, float] = Field(
        ...,
        description="skill_domain → score (0-1). e.g. {'backend': 0.85, 'neo4j': 0.6}"
    )
    time_taken_minutes: Optional[float] = Field(default=None, ge=0, le=300)


class WeeklyFeedbackDTO(BaseModel):
    """Peer/self feedback submission."""
    user_id: str  # Who the feedback is about
    submitted_by: str  # Who submitted it
    week_number: int = Field(..., ge=1, le=52)
    year: int = Field(..., ge=2024, le=2100)
    feedback_type: str = Field(..., pattern=r'^(peer|self|manager)$')
    ratings: Dict[str, float] = Field(
        ...,
        description="category → score (0-1). Categories: teamwork, communication, initiative, code_quality, reliability"
    )
    comment: Optional[str] = Field(default=None, max_length=2000)


class WeeklyTestDocument:
    """MongoDB document for weekly_tests collection."""
    @staticmethod
    def create(dto: WeeklyTestSubmitDTO) -> dict:
        return {
            "user_id": dto.user_id,
            "week_number": dto.week_number,
            "year": dto.year,
            "test_scores": dto.test_scores,
            "time_taken_minutes": dto.time_taken_minutes,
            "thg_calibration_result": None,  # Filled after THG comparison
            "submitted_at": datetime.utcnow(),
        }


class ProjectAnalysisDocument:
    """MongoDB document for project_analyses collection."""
    @staticmethod
    def create(user_id: str, source: str, url_or_path: str) -> dict:
        return {
            "user_id": user_id,
            "source": source,  # "github" or "zip"
            "github_url": url_or_path if source == "github" else None,
            "zip_path": url_or_path if source == "zip" else None,
            "status": "pending",  # pending → analyzing → completed → failed
            "analysis_result": None,
            "skill_scores": None,
            "file_count": 0,
            "languages_detected": {},
            "frameworks_detected": [],
            "code_quality_score": None,
            "analyzed_at": None,
            "created_at": datetime.utcnow(),
        }
