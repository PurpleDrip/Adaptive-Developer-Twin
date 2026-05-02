from pydantic import BaseModel
from typing import Optional, List

class UserCreateDTO(BaseModel):
    user_id: str
    userName: str
    email: str
    bio: Optional[str] = None
    gender: Optional[str] = "Other"
    experience_level: Optional[str] = "Junior"
    primary_domain: str
    resume: Optional[str] = None
