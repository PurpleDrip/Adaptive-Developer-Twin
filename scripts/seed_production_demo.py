import asyncio
import uuid
import os
import json
from datetime import datetime, timedelta
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from neo4j import GraphDatabase

# Config from environment
MONGO_URI = "mongodb+srv://shashanth1239_db_user:aCEe1GwfqiAWxwcc@adt.dzyoggh.mongodb.net/adt_db?retryWrites=true&w=majority&appName=ADT"
NEO4J_URI = "neo4j+s://059f84b3.databases.neo4j.io"
NEO4J_USER = "059f84b3"
NEO4J_PASS = "s3rBq6aLqCJouWvOyHWtvIcQv5JcbA9t-Pf6Psh-Edw"

client = AsyncIOMotorClient(MONGO_URI)
db = client.adt_db
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

async def seed_mongo():
    print("[MONGO] Seeding Data Vault...")
    await db.users.delete_many({})
    await db.tasks.delete_many({})
    await db.telemetry_batches.delete_many({})
    await db.assessments.delete_many({})
    await db.whitelist.delete_many({})

    password_hash = pwd_context.hash("demo123")

    # 1. TECH ADMIN
    tech_id = "admin_001"
    await db.users.insert_one({
        "user_id": tech_id,
        "username": "admin_root",
        "name": "System Administrator",
        "email": "admin@adt.ai",
        "role": "tech",
        "password_hash": password_hash,
        "is_active": True
    })

    # 2. MANAGER
    manager_id = "mgr_001"
    await db.users.insert_one({
        "user_id": manager_id,
        "username": "marcus_t",
        "name": "Marcus Thorne",
        "email": "marcus@adt.ai",
        "role": "manager",
        "password_hash": password_hash,
        "is_active": True
    })

    # 3. DEVELOPERS
    for i in range(1, 11):
        dev_id = f"dev_{i:03d}"
        ext_id = f"ADT-DX-{100+i}"
        await db.users.insert_one({
            "user_id": dev_id,
            "username": f"dev_{i}",
            "name": f"Developer {i}",
            "email": f"dev{i}@adt.ai",
            "role": "developer",
            "password_hash": password_hash,
            "extension_id": ext_id,
            "manager_id": manager_id,
            "is_active": True
        })
        
        # Add to whitelist
        await db.whitelist.insert_one({
            "extension_id": ext_id,
            "user_id": dev_id,
            "is_active": True,
            "machine_id": f"LOCKED-HW-{i:02d}"
        })

        # Telemetry
        for day in range(3):
            await db.telemetry_batches.insert_one({
                "batch_id": str(uuid.uuid4()),
                "user_id": dev_id,
                "window_end": datetime.utcnow() - timedelta(days=day),
                "aggregated_signals": {
                    "avg_wpm": 60 + (i * 2),
                    "total_keystrokes": 5000,
                    "total_commands": 20,
                    "total_idle_seconds": 100,
                    "language_distribution": {"python": 0.7, "rust": 0.3}
                },
                "status": "processed"
            })

    print("[SUCCESS] MongoDB Seeding Complete.")

def seed_neo4j():
    print("[NEO4J] Seeding Skill Graph...")
    with neo4j_driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
        session.run("UNWIND ['python', 'rust', 'react', 'fastapi'] AS s MERGE (:Skill {name: s})")
        
        # Seed Devs & Managers
        for i in range(1, 11):
            session.run("""
                CREATE (d:Developer {id: $i, name: $name})
                WITH d
                MATCH (s:Skill) WHERE s.name IN ['python', 'fastapi']
                CREATE (d)-[:HAS_SKILL {strength: 0.8, confidence: 0.9}]->(s)
            """, i=f"dev_{i:03d}", name=f"Developer {i}")
        
        session.run("CREATE (m:Manager {id: 'mgr_001', name: 'Marcus Thorne'})")
    print("[SUCCESS] Neo4j Seeding Complete.")

if __name__ == "__main__":
    asyncio.run(seed_mongo())
    seed_neo4j()
    neo4j_driver.close()
    print("\n--- SEEDING COMPLETE ---")
    print("LOGINS: admin_root | marcus_t | dev_1")
    print("PASS: demo123")
