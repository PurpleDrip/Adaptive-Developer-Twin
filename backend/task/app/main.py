from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import tasks
from shared.database.mongo import connect_mongo, close_mongo

app = FastAPI(title="ADT Task Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo()

app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["tasks"])

@app.get("/api/v1/tasks/health")
async def health():
    return {"status": "healthy", "service": "task-service"}
