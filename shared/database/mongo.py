"""
ADT Shared MongoDB Client — Production-grade async MongoDB connection pool.
Used by all microservices that need MongoDB access.
"""
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

logger = logging.getLogger("adt.database")

_client: Optional[AsyncIOMotorClient] = None
_db = None

MONGO_URI = os.getenv("MONGO_URI", "mongodb://adt_admin:adt_mongo_pass@localhost:27017/adt_db?authSource=admin")
DB_NAME = os.getenv("MONGO_DB_NAME", "adt_db")


async def connect_mongo():
    """Initialize MongoDB connection pool. Call once on service startup."""
    global _client, _db
    if _client is not None:
        return _db

    logger.info(f"Connecting to MongoDB: {MONGO_URI[:30]}...")
    _client = AsyncIOMotorClient(
        MONGO_URI,
        maxPoolSize=50,
        minPoolSize=5,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        retryWrites=True,
    )
    _db = _client[DB_NAME]

    # Verify connection
    try:
        await _client.admin.command("ping")
        logger.info("MongoDB connection established successfully.")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        _client = None
        _db = None
        raise

    # Create indexes for performance
    await _ensure_indexes()
    return _db


async def _ensure_indexes():
    """Create production indexes on all collections."""
    global _db
    if _db is None:
        return

    # Users collection
    users = _db["users"]
    await users.create_index("user_id", unique=True)
    await users.create_index("username", unique=True)
    await users.create_index("email", unique=True)
    await users.create_index("extension_id", unique=True, sparse=True)

    # Telemetry raw collection
    telemetry = _db["telemetry_raw"]
    await telemetry.create_index([("user_id", 1), ("timestamp", -1)])
    await telemetry.create_index("extension_id")
    await telemetry.create_index("processed")
    await telemetry.create_index("batch_id", sparse=True)

    # Telemetry batches
    batches = _db["telemetry_batches"]
    await batches.create_index("batch_id", unique=True)
    await batches.create_index([("user_id", 1), ("window_start", -1)])
    await batches.create_index("status")

    # Audit log
    audit = _db["audit_log"]
    await audit.create_index([("timestamp", -1)])
    await audit.create_index([("user_id", 1), ("timestamp", -1)])
    await audit.create_index("action")

    # Tasks
    tasks = _db["tasks"]
    await tasks.create_index("task_id", unique=True)
    await tasks.create_index("assigned_to", sparse=True)
    await tasks.create_index("created_by")
    await tasks.create_index("status")

    # Project analyses
    projects = _db["project_analyses"]
    await projects.create_index([("user_id", 1), ("analyzed_at", -1)])

    # Weekly tests
    tests = _db["weekly_tests"]
    await tests.create_index([("user_id", 1), ("week_number", -1)])

    # System config
    config = _db["system_config"]
    await config.create_index("key", unique=True)
    
    # Initialize default config if not exists
    if not await config.find_one({"key": "global_config"}):
        from shared.models.system_config import DEFAULT_SYSTEM_CONFIG
        await config.insert_one(DEFAULT_SYSTEM_CONFIG)
        logger.info("Initialized default system configuration.")

    logger.info("MongoDB indexes created/verified.")


async def close_mongo():
    """Close MongoDB connection pool. Call on service shutdown."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def get_db():
    """Get the current database instance. Must call connect_mongo() first."""
    if _db is None:
        raise RuntimeError("MongoDB not connected. Call connect_mongo() first.")
    return _db


def get_collection(name: str):
    """Get a MongoDB collection by name."""
    db = get_db()
    return db[name]
