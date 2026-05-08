from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import httpx
import os
import uuid
import redis
import json
from datetime import datetime
from typing import List, Optional
from shared.models.user import UserRegistrationDTO, UserDocument, UserProfileResponse, LoginDTO
from shared.database.mongo import get_collection
from shared.auth.rbac import role_required
from passlib.context import CryptContext
import logging

logger = logging.getLogger("auth-service.users")

router = APIRouter(prefix="/api/v1/auth/users", tags=["users"])
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

r_client = redis.from_url(REDIS_URL, decode_responses=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/analysis-status/{user_id}")
async def get_analysis_progress(user_id: str):
    """Tracks Project analysis progress."""
    users_col = get_collection("users")
    user = await users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    status = user.get("project_analysis_status", "pending")
    is_done = (status == "completed")
    
    return {
        "status": status,
        "progress": 100 if is_done else 50,
        "message": "Initial baseline established!" if is_done else "Performing Deep Semantic Audit on Repositories..."
    }

@router.post("/login")
async def login_user(dto: LoginDTO):
    """
    Polymorphic Login: Checks across isolated collections (users, managers, tech_staff).
    """
    # 1. Try Users (Developers)
    users_col = get_collection("users")
    user = await users_col.find_one({"username": dto.username})
    source = "users"
    
    # 2. Try Managers
    if not user:
        managers_col = get_collection("managers")
        user = await managers_col.find_one({"username": dto.username})
        if user:
            user["role"] = "manager"
            source = "managers"

    # 3. Try Tech Staff
    if not user:
        tech_col = get_collection("tech_staff")
        user = await tech_col.find_one({"username": dto.username})
        if user:
            user["role"] = "tech"
            source = "tech_staff"

    if not user:
        logger.warning(f"[AUTH] Login FAILED: username '{dto.username}' not found in any collection")
        raise HTTPException(status_code=401, detail="User not found")
        
    if not pwd_context.verify(dto.password, user["password_hash"]):
        logger.warning(f"[AUTH] Login FAILED: invalid password for '{dto.username}' (source={source})")
        raise HTTPException(status_code=401, detail="Invalid password")
    
    logger.info(f"[AUTH] Login OK: '{dto.username}' authenticated from '{source}' collection (role={user.get('role')})")
    
    return {
        "status": "success",
        "user_id": user.get("user_id", user.get("username")),
        "name": user["name"],
        "role": user.get("role", "developer"),
        "extension_id": user.get("extension_id", "N/A")
    }

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
    users_col = get_collection("users")
    await users_col.update_one({"user_id": user_id}, {"$set": {"project_analysis_status": "analyzing"}})
    
    async with httpx.AsyncClient(timeout=300.0) as client:
        for url in urls:
            try:
                await client.post(f"{FUSION_URL}/api/v1/fusion/fusion/analyze-project", json={
                    "user_id": user_id,
                    "github_url": url
                })
            except Exception as e:
                print(f"Project analysis for {url} failed: {e}")
    
    await users_col.update_one({"user_id": user_id}, {"$set": {"project_analysis_status": "completed"}})

@router.post("/save-session")
async def save_reg_session(session_id: str, data: dict):
    """Saves partial registration data to Redis (expires in 24h)."""
    r_client.setex(f"reg_session:{session_id}", 86400, json.dumps(data))
    return {"status": "saved"}

@router.get("/get-session/{session_id}")
async def get_reg_session(session_id: str):
    """Retrieves partial registration data from Redis."""
    data = r_client.get(f"reg_session:{session_id}")
    if not data: return {}
    return json.loads(data)

@router.get("/validate")
async def validate_field(field: str, value: str):
    """Checks if a username, email, or phone is already in use."""
    users_col = get_collection("users")
    if field not in ["username", "email", "phone_number"]:
        return {"available": True}
    existing = await users_col.find_one({field: value})
    return {"available": existing is None}

@router.get("/all")
async def get_all_users(role: str = Depends(role_required(["manager", "PM", "tech"]))):
    """
    Returns the full user directory. Restricted to Managers and Tech.
    """
    users_col = get_collection("users")
    cursor = users_col.find({}, {"password_hash": 0})
    return await cursor.to_list(length=100)

@router.get("/squad/{manager_id}")
async def get_manager_squad(manager_id: str, role: str = Depends(role_required(["manager", "PM", "tech"]))):
    """
    Returns only the developers assigned to a specific manager.
    Used for isolated squad oversight.
    """
    users_col = get_collection("users")
    cursor = users_col.find({"manager_id": manager_id, "role": "developer"}, {"password_hash": 0})
    return await cursor.to_list(length=100)

@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: str):
    users_col = get_collection("users")
    user = await users_col.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/hardware-lock")
async def hardware_lock(extension_id: str, machine_id: str):
    whitelist_col = get_collection("whitelist")
    entry = await whitelist_col.find_one({"extension_id": extension_id, "is_active": True})
    if not entry:
        raise HTTPException(status_code=401, detail="Extension ID not found")
    
    if entry.get("machine_id") is None:
        await whitelist_col.update_one({"extension_id": extension_id}, {"$set": {"machine_id": machine_id, "locked_at": datetime.utcnow()}})
        return {"status": "locked"}
    
    if entry["machine_id"] != machine_id:
        raise HTTPException(status_code=403, detail="Hardware Mismatch")
    return {"status": "verified"}

@router.post("/validate-extension")
async def validate_extension(extension_id: str, machine_id: str):
    """
    Validates identity and enforces Immutable Hardware Anchor.
    """
    users_col = get_collection("users")
    
    # 1. Find the user by Extension ID
    user = await users_col.find_one({"extension_id": extension_id})
    if not user:
        raise HTTPException(status_code=401, detail="Identity not found")
        
    # 2. Check for existing hardware lock
    existing_lock = user.get("machine_id")
    
    if not existing_lock:
        # FIRST TIME HANDSHAKE: Anchor this machine to this identity
        # BUT: Ensure this machine isn't already anchored to someone else
        duplicate_machine = await users_col.find_one({"machine_id": machine_id})
        if duplicate_machine:
            raise HTTPException(status_code=403, detail="Machine already anchored to another identity")
            
        await users_col.update_one(
            {"extension_id": extension_id},
            {"$set": {"machine_id": machine_id, "locked_at": datetime.utcnow()}}
        )
        return {"user_id": user["user_id"], "name": user["name"], "status": "LOCKED_TO_HARDWARE"}

    # 3. Verify existing lock
    if existing_lock != machine_id:
        raise HTTPException(status_code=403, detail="Hardware mismatch: Identity is anchored to another machine")

    return {"user_id": user["user_id"], "name": user["name"], "status": "VERIFIED"}

@router.post("/assign-manager")
async def assign_manager(developer_id: str, manager_id: str):
    users_col = get_collection("users")
    await users_col.update_one({"user_id": developer_id}, {"$set": {"manager_id": manager_id}})
    
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{THG_URL}/api/v1/thg/thg/link-manager-dev", json={"manager_id": manager_id, "dev_id": developer_id})
    except Exception: pass
    return {"status": "success"}
