import uuid
import os
import httpx
from datetime import datetime
from typing import Any, Dict
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from shared.models.user import AdminCreateAccountDTO, UserDocument
from shared.database.mongo import get_collection
from passlib.context import CryptContext

from shared.auth.rbac import role_required
from passlib.context import CryptContext

router = APIRouter(dependencies=[Depends(role_required(["tech"]))])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.post("/create-manager", status_code=201)
async def create_manager(dto: AdminCreateAccountDTO):
    """
    Tech Support creates a Manager account and syncs it to the Graph.
    """
    users_col = get_collection("users")
    
    # 1. Mongo Registration
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
    
    # 2. Sync to Neo4j (THG)
    THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{THG_URL}/api/v1/thg/thg/create-manager", json={
                "dev_id": user_id, # Reusing DTO structure
                "name": dto.name,
                "primary_domain": "management"
            })
    except Exception as e:
        print(f"THG Manager Sync failed: {e}")

    return {"status": "created", "user_id": user_id, "role": dto.role}

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

@router.get("/explorer/collections")
async def list_collections():
    """List all collections in the database."""
    db = get_collection("users").database
    cols = await db.list_collection_names()
    return {"collections": cols}

@router.get("/explorer/{collection}")
async def get_collection_data(collection: str, limit: int = 100, skip: int = 0, filter_key: str = None, filter_val: str = None):
    """Fetch documents from a collection with simple filtering."""
    col = get_collection(collection)
    query = {}
    if filter_key and filter_val:
        query[filter_key] = {"$regex": filter_val, "$options": "i"}
        
    cursor = col.find(query).skip(skip).limit(limit)
    data = await cursor.to_list(length=limit)
    
    # Serialize ObjectId
    for doc in data:
        doc["_id"] = str(doc["_id"])
        
    return {"data": data, "count": await col.count_documents(query)}

@router.patch("/explorer/{collection}/{doc_id}")
async def update_document_field(collection: str, doc_id: str, updates: Dict[str, Any]):
    """Update specific fields in a document (Universal Resolver)."""
    col = get_collection(collection)
    
    # Try multiple identifier strategies
    query_strategies = []
    try:
        query_strategies.append({"_id": ObjectId(doc_id)})
    except: pass
    query_strategies.extend([{"_id": doc_id}, {"user_id": doc_id}, {"key": doc_id}, {"task_id": doc_id}])

    for query in query_strategies:
        result = await col.update_one(query, {"$set": updates})
        if result.matched_count > 0:
            return {"status": "success", "resolved_id": str(query)}
            
    raise HTTPException(status_code=404, detail="Document not found via any identifier strategy")

@router.post("/explorer/{collection}/{doc_id}/field")
async def add_document_field(collection: str, doc_id: str, field_name: str, field_value: Any):
    """Inject a new field into an existing document (Schema Expansion)."""
    col = get_collection(collection)
    return await update_document_field(collection, doc_id, {field_name: field_value})

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
