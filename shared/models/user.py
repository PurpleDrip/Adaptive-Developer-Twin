"""
ADT User Model — Registration, profiles, extension metadata.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


class UserRegistrationDTO(BaseModel):
    """Full registration payload from VS Code extension."""
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

    @field_validator('strong_domains')
    @classmethod
    def validate_domains(cls, v):
        valid = {"backend", "frontend", "devops", "ml", "neo4j", "mobile", "data_engineering",
                 "security", "cloud", "testing", "database", "fullstack"}
        for d in v:
            if d.lower() not in valid:
                raise ValueError(f"Invalid domain: {d}. Valid: {valid}")
        return [d.lower() for d in v]


class UserDocument:
    """MongoDB document structure for users collection."""
    @staticmethod
    def create(registration: UserRegistrationDTO, user_id: str, extension_id: str) -> dict:
        return {
            "user_id": user_id,
            "name": registration.name,
            "username": registration.username,
            "email": registration.email,
            "phone_number": registration.phone_number,
            "gender": registration.gender,
            "password_hash": registration.password,  # Will be hashed in auth phase
            "strong_domains": registration.strong_domains,
            "experience_level": registration.experience_level,
            "role": "developer",  # default role
            "extension_id": extension_id,
            "extension_version": "1.0.0",
            "extension_installed_at": datetime.utcnow(),
            "github_project_urls": registration.github_project_urls or [],
            "project_analysis_status": "pending",
            "initial_skill_scores": {},
            "registered_at": datetime.utcnow(),
            "last_active": datetime.utcnow(),
            "is_active": True,
        }


class AdminCreateAccountDTO(BaseModel):
    """Tech Support creates HRM / Senior Dev accounts."""
    name: str = Field(..., min_length=2, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., max_length=255)
    phone_number: str = Field(..., min_length=10, max_length=15)
    gender: str = Field(default="Other")
    password: str = Field(..., min_length=8)
    role: str = Field(..., pattern=r'^(senior_dev|hrm|tech_support)$')


class UserProfileResponse(BaseModel):
    """Public user profile response."""
    user_id: str
    name: str
    username: str
    email: str
    gender: str
    strong_domains: List[str]
    experience_level: str
    role: str
    extension_id: Optional[str] = None
    registered_at: Optional[datetime] = None
    last_active: Optional[datetime] = None
    is_active: bool = True
