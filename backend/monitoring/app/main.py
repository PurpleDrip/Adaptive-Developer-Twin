from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import monitoring, holidays
from shared.database.mongo import connect_mongo, close_mongo

app = FastAPI(title="ADT Monitoring Service", version="1.0.0")

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

app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["monitoring"])
app.include_router(holidays.router, prefix="/api/v1/monitoring/holidays", tags=["holidays"])

@app.get("/api/v1/monitoring/health")
async def health():
    return {"status": "healthy", "service": "monitoring-service"}