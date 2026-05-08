from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class TaskDocument(BaseModel):
    """MongoDB document for task allotment."""
    task_id: str = Field(default_factory=lambda: f"TASK-{uuid.uuid4().hex[:8].upper()}")
    title: str
    description: str
    manager_id: str
    developer_id: str
    status: str = "allotted" # allotted | in_progress | completed | reviewed
    priority: str = "medium" # low | medium | high | urgent
    created_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    manager_review: Optional[str] = None
    rating: Optional[int] = None # 1-5

class NotificationDocument(BaseModel):
    """MongoDB document for user notifications."""
    notification_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    type: str # task_allotted | review_received | promotion | system
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    link: Optional[str] = None

class LeaderboardEntry(BaseModel):
    """DTO for the global ranking system."""
    rank: int
    user_id: str
    name: str
    primary_domain: str
    global_score: float
    trend: str = "stable" # up | down | stable
