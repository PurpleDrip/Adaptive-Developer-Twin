from pydantic import BaseModel

class UserCreateDTO(BaseModel):
    user_id: str
    name: str
    email: str
    experience_level: str
    primary_domain: str
