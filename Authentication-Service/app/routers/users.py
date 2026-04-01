from fastapi import APIRouter
from app.schemas.user import UserCreateDTO

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/create", status_code=201)
async def create_user(user: UserCreateDTO):
    # For prototype: Just echo back
    return {
        "status": "success", 
        "message": "User created in lab environment",
        "user_id": user.user_id,
        "details": user
    }

@router.get("/{user_id}")
async def get_user(user_id: str):
    # Dummy data
    return {
        "user_id": user_id,
        "name": "Dummy User",
        "email": f"{user_id}@test.com"
    }

@router.post("/{user_id}/resume")
async def upload_resume(user_id: str, data: dict):
    return {"status": "success", "user_id": user_id, "evidence": "resume_uploaded"}

@router.post("/{user_id}/projects")
async def upload_projects(user_id: str, data: dict):
    return {"status": "success", "user_id": user_id, "evidence": "projects_uploaded"}

@router.post("/{user_id}/weekly-test")
async def upload_test(user_id: str, data: dict):
    return {"status": "success", "user_id": user_id, "evidence": "test_uploaded"}
