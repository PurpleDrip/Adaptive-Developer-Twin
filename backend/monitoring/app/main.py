from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.routers import monitoring
from shared.database.mongo import connect_mongo, close_mongo
import redis
import os
import asyncio
import json

app = FastAPI(title="ADT Monitoring Service", version="1.0.0")

from redis.asyncio import from_url as async_redis_from_url

# Redis for Pub/Sub (Async)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
# Handle SSL for Upstash if rediss:// is used
if REDIS_URL.startswith("rediss://"):
    r_client = async_redis_from_url(REDIS_URL, decode_responses=True, ssl_cert_reqs=None)
else:
    r_client = async_redis_from_url(REDIS_URL, decode_responses=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/api/v1/monitoring/ws/audit")
async def websocket_audit_logs(websocket: WebSocket):
    await websocket.accept()
    print("[WS] Client connected to Audit Stream")
    async with r_client.pubsub() as pubsub:
        try:
            await pubsub.subscribe("audit_logs")
            print("[WS] Subscribed to 'audit_logs' channel")
            async for message in pubsub.listen():
                if message["type"] == "message":
                    await websocket.send_text(message["data"])
        except WebSocketDisconnect:
            print("[WS] Client disconnected")
        except Exception as e:
            print(f"[WS] Error: {e}")
        finally:
            try:
                await pubsub.unsubscribe("audit_logs")
            except:
                pass
            print("[WS] Cleaned up subscription")

@app.on_event("startup")
async def startup_db_client():
    await connect_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo()

app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["monitoring"])

@app.get("/api/v1/monitoring/health")
async def health():
    return {"status": "healthy", "service": "monitoring-service"}