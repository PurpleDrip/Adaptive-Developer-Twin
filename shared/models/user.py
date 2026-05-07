from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re

class UserRegistrationDTO(BaseModel):
    """Full registration payload from Website."""
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_]+$')
    email: str = Field(..., max_length=255)
    phone_number: str = Field(..., min_length=10, max_length=15)
    gender: str = Field(..., pattern=r'^(Male|Female|Other)$')
    password: str = Field(..., min_length=8, max_length=128)
    strong_domains: List[str] = Field(..., min_length=1, max_length=10)
    experience_level: str = Field(..., pattern=r'^(Intern|Junior|Mid|Senior|Lead|Principal)$')
    github_project_urls: Optional[List[str]] = Field(default=None, max_length=5)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()

class LoginDTO(BaseModel):
    """Payload for user login."""
    username: str
    password: str

class UserDocument(BaseModel):
    """MongoDB document structure for users collection."""
    user_id: str
    extension_id: str
    name: str
    username: str
    email: str
    role: str
    experience_level: str
    strong_domains: List[str]
    registered_at: datetime = Field(default_factory=datetime.utcnow)
    machine_id: Optional[str] = None
    last_known_state_hash: Optional[str] = None
    last_sync_at: Optional[datetime] = None

    @staticmethod
    def create(dto: UserRegistrationDTO, user_id: str, extension_id: str) -> dict:
        return {
            "user_id": user_id,
            "extension_id": extension_id,
            "name": dto.name,
            "username": dto.username,
            "email": dto.email,
            "phone_number": dto.phone_number,
            "gender": dto.gender,
            "password_hash": dto.password, # Note: Already hashed in router
            "strong_domains": dto.strong_domains,
            "experience_level": dto.experience_level,
            "github_project_urls": dto.github_project_urls or [],
            "role": "developer",
            "registered_at": datetime.utcnow(),
            "is_active": True,
            "project_analysis_status": "pending",
            "last_known_state_hash": None,
            "last_sync_at": None
        }

class UserProfileResponse(BaseModel):
    """Safe response model for frontend."""
    user_id: str
    extension_id: str
    name: str
    email: str
    role: str
    experience_level: str
    strong_domains: List[str]
    registered_at: datetime
    project_analysis_status: Optional[str] = "pending"

class AdminCreateAccountDTO(BaseModel):
    """Payload for Tech Support to create internal roles."""
    name: str
    username: str
    email: str
    phone_number: str
    gender: str
    password: str
    role: str = Field(..., pattern=r'^(senior_manager|hrm|tech_support)$')
