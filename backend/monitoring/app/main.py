from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.routers import monitoring, holidays
from shared.database.mongo import connect_mongo, close_mongo
import redis
import os
import asyncio
import json

app = FastAPI(title="ADT Monitoring Service", version="1.0.0")

# Redis for Pub/Sub
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
r_client = redis.from_url(REDIS_URL, decode_responses=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/api/v1/monitoring/ws/audit")
async def websocket_audit_logs(websocket: WebSocket):
    await websocket.accept()
    pubsub = r_client.pubsub()
    pubsub.subscribe("audit_logs")
    
    try:
        while True:
            # Check for new messages in Redis
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                await websocket.send_text(message['data'])
            await asyncio.sleep(0.1) # Prevent CPU spinning
    except WebSocketDisconnect:
        pubsub.unsubscribe("audit_logs")
    except Exception as e:
        print(f"WS Error: {e}")
    finally:
        pubsub.close()

@app.on_event("startup")
async def startup_db_client():
    await connect_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo()

app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["monitoring"])
app.include_router(holidays.router, prefix="/api/v1/monitoring/holidays", tags=["holidays"])

@app.get("/api/v1/monitoring/health")
async def health():
    return {"status": "healthy", "service": "monitoring-service"}