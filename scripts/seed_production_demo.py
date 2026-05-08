import asyncio
import uuid
import os
import random
from datetime import datetime, timedelta
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from neo4j import GraphDatabase

# Config
MONGO_URI = "mongodb+srv://shashanth1239_db_user:aCEe1GwfqiAWxwcc@adt.dzyoggh.mongodb.net/adt_db?retryWrites=true&w=majority&appName=ADT"
client = AsyncIOMotorClient(MONGO_URI)
db = client.adt_db
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_mongo_elite():
    print("[MONGO] Synchronizing Data Vault with Elite THG Schema...")
    await db.users.delete_many({})
    await db.managers.delete_many({})
    await db.tech_staff.delete_many({})
    await db.tasks.delete_many({})
    await db.assessments.delete_many({})

    password_hash = pwd_context.hash("demo123")
    
    # 1. Seed Managers (Matching AI, Backend, Frontend logic)
    manager_ids = []
    for i in range(1, 11):
        m_id = f"mgr_{i:03d}"
        manager_ids.append(m_id)
        dept = "AI" if i <= 3 else "Backend" if i <= 6 else "Frontend"
        
        manager_doc = {
            "user_id": m_id,
            "username": f"manager_{i}",
            "name": f"Manager {i}",
            "role": "manager",
            "password_hash": password_hash,
            "department": dept,
            "email": f"mgr{i}@adt.ai",
            "is_active": True,
            "registered_at": datetime.utcnow() - timedelta(days=random.randint(100, 1000))
        }
        await db.users.insert_one(manager_doc)
        await db.managers.insert_one({
            "username": f"manager_{i}",
            "name": f"Manager {i}",
            "gender": "Male" if i % 2 == 0 else "Female",
            "email": f"mgr{i}@adt.ai",
            "phone_number": f"+1-555-010{i}",
            "password_hash": password_hash
        })

    # 2. Seed Developers
    for i in range(1, 11):
        dev_id = f"dev_{i:03d}"
        # Match the random manager assignment from Cypher (deterministic-ish for demo)
        assigned_manager = manager_ids[(i-1) % 10] 
        
        dev_doc = {
            "user_id": dev_id,
            "username": f"dev_{i}",
            "name": f"Developer {i}",
            "role": "developer",
            "password_hash": password_hash,
            "manager_id": assigned_manager,
            "email": f"dev{i}@adt.ai",
            "experience_level": "Senior" if i <= 3 else "Mid",
            "strong_domains": ["Python", "FastAPI"] if i <= 5 else ["React", "Rust"],
            "registered_at": datetime.utcnow() - timedelta(days=random.randint(30, 300)),
            "is_active": True,
            "extension_id": f"ADT-DX-{100+i}"
        }
        await db.users.insert_one(dev_doc)

    # 3. Seed Tasks (Matching Task #001 logic)
    for i in range(1, 16):
        task_id = f"task_{i:03d}"
        await db.tasks.insert_one({
            "task_id": task_id,
            "title": f"Task #{i}",
            "priority": random.choice(["HIGH", "MEDIUM", "LOW"]),
            "complexity": round(random.uniform(1, 10), 1),
            "status": "allotted" if i <= 5 else "pending",
            "assigned_to": f"dev_{random.randint(1, 10):03d}" if i <= 5 else None,
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30))
        })

    print("[SUCCESS] MongoDB Synced with Elite THG.")

if __name__ == "__main__":
    asyncio.run(seed_mongo_elite())
