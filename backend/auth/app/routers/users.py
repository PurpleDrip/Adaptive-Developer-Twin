from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import httpx
import os
import uuid
import redis
import json
from datetime import datetime
from typing import List, Optional
from shared.models.user import UserRegistrationDTO, UserDocument, UserProfileResponse
from shared.database.mongo import get_collection
from passlib.context import CryptContext

router = APIRouter(prefix="/users", tags=["users"])
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

r_client = redis.from_url(REDIS_URL, decode_responses=True)

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
    
    # Bcrypt has a 72-byte limit for passwords
    raw_password = dto.password[:72]
    dto.password = pwd_context.hash(raw_password)
    
    # Create document
    user_doc = UserDocument.create(dto, user_id, extension_id)
    await users_col.insert_one(user_doc)

    # Add to Whitelist for hardware locking
    whitelist_col = get_collection("whitelist")
    await whitelist_col.insert_one({
        "extension_id": extension_id,
        "user_id": user_id,
        "is_active": True,
        "machine_id": None, # Will be locked on first extension handshake
        "created_at": datetime.utcnow()
    })
    
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

@router.post("/save-session")
async def save_reg_session(session_id: str, data: dict):
    """Saves partial registration data to Redis (expires in 24h)."""
    r_client.setex(f"reg_session:{session_id}", 86400, json.dumps(data))
    return {"status": "saved"}

@router.get("/get-session/{session_id}")
async def get_reg_session(session_id: str):
    """Retrieves partial registration data from Redis."""
    data = r_client.get(f"reg_session:{session_id}")
    if not data:
        return {}
    return json.loads(data)

@router.get("/validate")
async def validate_field(field: str, value: str):
    """Checks if a username, email, or phone is already in use."""
    users_col = get_collection("users")
    if field not in ["username", "email", "phone_number"]:
        return {"available": True}
    
    existing = await users_col.find_one({field: value})
    return {"available": existing is None}

@router.get("/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    users_col = get_collection("users")
    user = await users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/hardware-lock")
async def hardware_lock(extension_id: str, machine_id: str):
    """
    Performs the hardware handshake. Locks an extension_id to a specific machine_id.
    """
    whitelist_col = get_collection("whitelist")
    entry = await whitelist_col.find_one({"extension_id": extension_id, "is_active": True})
    
    if not entry:
        raise HTTPException(status_code=401, detail="Extension ID not found or inactive")
    
    # Trust on First Use (TOFU)
    if entry.get("machine_id") is None:
        await whitelist_col.update_one(
            {"extension_id": extension_id},
            {"$set": {"machine_id": machine_id, "locked_at": datetime.utcnow()}}
        )
        return {"status": "locked", "message": "Hardware successfully bound to this twin."}
    
    # Verification
    if entry["machine_id"] != machine_id:
        raise HTTPException(status_code=403, detail="Hardware Mismatch: This extension ID is locked to another device.")
    
    return {"status": "verified", "message": "Connection authenticated."}

@router.post("/validate-extension")
async def validate_extension(extension_id: str, machine_id: str):
    """Checks if an extension_id is valid and matches the locked machine_id."""
    whitelist_col = get_collection("whitelist")
    entry = await whitelist_col.find_one({
        "extension_id": extension_id, 
        "machine_id": machine_id, 
        "is_active": True
    })
    
    if not entry:
        raise HTTPException(status_code=401, detail="Invalid extension ID or hardware mismatch")
    
    users_col = get_collection("users")
    user = await users_col.find_one({"extension_id": extension_id})
    return {"user_id": user["user_id"], "name": user["name"]}

@router.get("/by-role/{role}")
async def get_users_by_role(role: str):
    """Fetches all active users of a specific role."""
    users_col = get_collection("users")
    
    # Simple logic: Senior/Lead/Principal are PMs, others are Developers
    if role == "project_manager":
        users = await users_col.find({"experience_level": {"$in": ["Senior", "Lead", "Principal"]}}).to_list(100)
    else:
        users = await users_col.find({"experience_level": {"$in": ["Intern", "Junior", "Mid"]}}).to_list(100)
        
    return [{"user_id": u["user_id"], "name": u["name"], "username": u["username"], "manager_id": u.get("manager_id")} for u in users]

@router.post("/assign-manager")
async def assign_manager(developer_id: str, manager_id: str):
    """Binds a developer to a specific Project Manager."""
    users_col = get_collection("users")
    result = await users_col.update_one(
        {"user_id": developer_id},
        {"$set": {"manager_id": manager_id}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Developer not found or assignment unchanged")
    
    return {"status": "success", "message": f"Developer {developer_id} assigned to Manager {manager_id}"}
