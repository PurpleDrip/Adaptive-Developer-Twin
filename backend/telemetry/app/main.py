from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import telemetry
from shared.database.mongo import connect_mongo, close_mongo
from app.services.batch_processor import BatchProcessor
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("adt.telemetry")

app = FastAPI(title="ADT Telemetry Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_mongo()
    # Start the 30-minute batch processor
    processor = BatchProcessor()
    processor.start()
    logger.info("Telemetry Service started, Batch Processor active.")

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo()

app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])

@app.get("/api/v1/telemetry/health")
async def health():
    return {"status": "healthy", "service": "telemetry-service"}