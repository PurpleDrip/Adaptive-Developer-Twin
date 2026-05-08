import asyncio
import uuid
import os
import random
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient

# Config
MONGO_URI = "mongodb+srv://shashanth1239_db_user:aCEe1GwfqiAWxwcc@adt.dzyoggh.mongodb.net/adt_db?retryWrites=true&w=majority&appName=ADT"
client = AsyncIOMotorClient(MONGO_URI)
db = client.adt_db
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_mongo_elite():
    print("=" * 60)
    print("[ADT] Nuclear Reset — Synchronizing Data Vault")
    print("=" * 60)
    
    # PURGE
    await db.users.delete_many({})
    await db.managers.delete_many({})
    await db.tech_staff.delete_many({})
    await db.tasks.delete_many({})
    await db.assessments.delete_many({})
    await db.test_submissions.delete_many({})
    print("[PURGE] All collections wiped clean.")

    password_hash = pwd_context.hash("demo123")
    now = datetime.now(timezone.utc)

    # ──────────────────────────────────────────
    # 1. MANAGERS -> Only in `managers` collection (ISOLATED)
    # ──────────────────────────────────────────
    manager_ids = []
    for i in range(1, 11):
        m_id = f"mgr_{i:03d}"
        manager_ids.append(m_id)
        dept = "AI" if i <= 3 else "Backend" if i <= 6 else "Frontend"
        
        await db.managers.insert_one({
            "user_id": m_id,
            "username": f"manager_{i}",
            "name": f"Manager {i}",
            "role": "manager",
            "gender": "Male" if i % 2 == 0 else "Female",
            "email": f"mgr{i}@adt.ai",
            "phone_number": f"+1-555-010{i}",
            "department": dept,
            "password_hash": password_hash,
            "is_active": True,
            "registered_at": now - timedelta(days=random.randint(100, 1000))
        })
    print(f"[SEED] 10 Managers -> `managers` collection (ISOLATED)")

    # ──────────────────────────────────────────
    # 2. TECH STAFF -> Only in `tech_staff` collection (ISOLATED)
    # ──────────────────────────────────────────
    for i in range(1, 11):
        await db.tech_staff.insert_one({
            "user_id": f"tech_{i:03d}",
            "username": f"admin_{i}" if i > 1 else "admin_root",
            "name": f"Tech Admin {i}" if i > 1 else "Root Admin",
            "role": "tech",
            "gender": "Male" if i % 2 == 0 else "Female",
            "email": f"admin{i}@adt.ai" if i > 1 else "admin@adt.ai",
            "phone_number": f"+1-555-020{i}",
            "password_hash": password_hash,
            "clearance_level": "ROOT" if i == 1 else "STANDARD",
            "is_active": True,
            "registered_at": now - timedelta(days=random.randint(200, 500))
        })
    print(f"[SEED] 10 Tech Staff -> `tech_staff` collection (ISOLATED)")

    # ──────────────────────────────────────────
    # 3. DEVELOPERS -> Only in `users` collection
    # ──────────────────────────────────────────
    for i in range(1, 11):
        dev_id = f"dev_{i:03d}"
        assigned_manager = manager_ids[(i - 1) % 10]
        
        await db.users.insert_one({
            "user_id": dev_id,
            "username": f"dev_{i}",
            "name": f"Developer {i}",
            "role": "developer",
            "password_hash": password_hash,
            "manager_id": assigned_manager,
            "email": f"dev{i}@adt.ai",
            "experience_level": "Senior" if i <= 3 else "Mid",
            "strong_domains": ["Python", "FastAPI"] if i <= 5 else ["React", "Rust"],
            "registered_at": now - timedelta(days=random.randint(30, 300)),
            "is_active": True,
            "extension_id": f"ADT-DX-{100 + i}"
        })
    print(f"[SEED] 10 Developers -> `users` collection")

    # ──────────────────────────────────────────
    # 4. TASKS
    # ──────────────────────────────────────────
    for i in range(1, 16):
        task_id = f"task_{i:03d}"
        await db.tasks.insert_one({
            "task_id": task_id,
            "title": f"Task #{i}",
            "description": f"Implementation task #{i} for the engineering team.",
            "priority": random.choice(["HIGH", "MEDIUM", "LOW"]),
            "complexity": round(random.uniform(1, 10), 1),
            "status": "allotted" if i <= 5 else "pending",
            "assigned_to": f"dev_{random.randint(1, 10):03d}" if i <= 5 else None,
            "required_skills": {},
            "created_at": now - timedelta(days=random.randint(1, 30))
        })
    print(f"[SEED] 15 Tasks -> `tasks` collection")

    # ──────────────────────────────────────────
    # VERIFICATION
    # ──────────────────────────────────────────
    print("\n" + "=" * 60)
    print("[VERIFICATION] Collection Counts:")
    print(f"  users       : {await db.users.count_documents({})}")
    print(f"  managers    : {await db.managers.count_documents({})}")
    print(f"  tech_staff  : {await db.tech_staff.count_documents({})}")
    print(f"  tasks       : {await db.tasks.count_documents({})}")
    print(f"  assessments : {await db.assessments.count_documents({})}")
    print("=" * 60)
    print("[SUCCESS] ADT Data Vault synchronized.")

if __name__ == "__main__":
    asyncio.run(seed_mongo_elite())
