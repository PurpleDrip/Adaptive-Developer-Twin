from fastapi import APIRouter, Depends, HTTPException
from shared.models.user import AdminCreateAccountDTO, UserDocument
from shared.database.mongo import get_collection
from passlib.context import CryptContext
import uuid
from datetime import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/create-account", status_code=201)
async def create_admin_account(dto: AdminCreateAccountDTO):
    """
    Tech Support creates HRM or Senior Dev accounts.
    """
    users_col = get_collection("users")
    
    # Check if user already exists
    existing = await users_col.find_one({"$or": [{"username": dto.username}, {"email": dto.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    user_id = str(uuid.uuid4())
    
    user_doc = {
        "user_id": user_id,
        "name": dto.name,
        "username": dto.username,
        "email": dto.email,
        "phone_number": dto.phone_number,
        "gender": dto.gender,
        "password_hash": pwd_context.hash(dto.password),
        "role": dto.role,
        "registered_at": datetime.utcnow(),
        "is_active": True
    }
    
    await users_col.insert_one(user_doc)
    
    return {"status": "created", "user_id": user_id, "role": dto.role}

@router.get("/config")
async def get_system_config():
    """
    Get global system configuration.
    """
    config_col = get_collection("system_config")
    config = await config_col.find_one({"key": "global_config"})
    if not config:
        return {"monitoring_window_start": "09:00", "monitoring_window_end": "18:00"}
    
    config["_id"] = str(config["_id"])
    return config
