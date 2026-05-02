from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import httpx
import os
import uuid
from datetime import datetime
from typing import List, Optional
from shared.models.user import UserRegistrationDTO, UserDocument, UserProfileResponse
from shared.database.mongo import get_collection
from passlib.context import CryptContext

router = APIRouter(prefix="/users", tags=["users"])
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/register", status_code=201)
async def register_user(dto: UserRegistrationDTO, background_tasks: BackgroundTasks):
    """
    Registers a new developer and triggers initial project analysis.
    Returns a unique extension_id that must be used for telemetry.
    """
    users_col = get_collection("users")
    
    # Check for existing user
    existing = await users_col.find_one({"$or": [{"username": dto.username}, {"email": dto.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    user_id = str(uuid.uuid4())
    extension_id = f"ADT-{uuid.uuid4().hex[:8].upper()}"
    
    # Hash password
    dto.password = pwd_context.hash(dto.password)
    
    # Create document
    user_doc = UserDocument.create(dto, user_id, extension_id)
    await users_col.insert_one(user_doc)
    
    # Initialize in THG (Neo4j)
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{THG_URL}/api/v1/thg/thg/create-dev", json={
                "dev_id": user_id,
                "name": dto.name,
                "bio": "Expert in " + ", ".join(dto.strong_domains),
                "gender": dto.gender,
                "primary_domain": dto.strong_domains[0] if dto.strong_domains else "backend"
            })
    except Exception as e:
        print(f"THG Init failed: {e}")
    
    # Trigger Project Analysis in background
    if dto.github_project_urls:
        background_tasks.add_task(trigger_project_analysis, user_id, dto.github_project_urls)
    
    return {
        "status": "registered",
        "user_id": user_id,
        "extension_id": extension_id,
        "message": "Please save your extension_id. It is required for VS Code extension telemetry."
    }

async def trigger_project_analysis(user_id: str, urls: List[str]):
    """Background task to call Fusion Engine for repo analysis."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        for url in urls:
            try:
                resp = await client.post(f"{FUSION_URL}/api/v1/fusion/fusion/analyze-project", json={
                    "user_id": user_id,
                    "github_url": url
                })
                if resp.status_code == 200:
                    # Update status in Mongo
                    users_col = get_collection("users")
                    await users_col.update_one(
                        {"user_id": user_id},
                        {"$set": {"project_analysis_status": "completed"}}
                    )
            except Exception as e:
                print(f"Project analysis failed for {url}: {e}")

@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    users_col = get_collection("users")
    user = await users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/validate-extension")
async def validate_extension(extension_id: str):
    """Checks if an extension_id is valid and returns the user_id."""
    users_col = get_collection("users")
    user = await users_col.find_one({"extension_id": extension_id, "is_active": True})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid extension ID")
    
    return {"user_id": user["user_id"], "name": user["name"]}
