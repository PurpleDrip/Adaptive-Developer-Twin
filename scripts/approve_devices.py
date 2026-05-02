import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "adt_db")

async def approve_devices(device_ids: list):
    """
    Adds a list of Machine IDs to the 'approved_devices' whitelist.
    Only these devices will be allowed to register via the VS Code Extension.
    """
    if not MONGO_URI:
        print("❌ Error: MONGO_URI not found in .env file.")
        return

    print(f"🔗 Connecting to ADT Database...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    col = db["approved_devices"]

    print(f"🚀 Whitelisting {len(device_ids)} devices...")
    
    for mid in device_ids:
        # Use upsert to avoid duplicates
        result = await col.update_one(
            {"machine_id": mid},
            {"$set": {"machine_id": mid, "approved_at": "2026-05-02T12:00:00Z", "status": "active"}},
            upsert=True
        )
        if result.upserted_id:
            print(f"✅ Approved NEW device: {mid}")
        else:
            print(f"ℹ️ Device already approved: {mid}")

    print("\n🏆 Hardware Whitelisting Complete. These devices can now register.")
    client.close()

if __name__ == "__main__":
    # PASTE YOUR ACTUAL OFFICE MACHINE IDs HERE
    # You can get your machine ID by running: npx node-machine-id
    OFFICE_DEVICES = [
        # "UUID-1234-5678-ABCD", 
        # "UUID-9876-5432-FEBA"
    ]
    
    asyncio.run(approve_devices(OFFICE_DEVICES))
