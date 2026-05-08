from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import telemetry
from shared.database.mongo import connect_mongo, close_mongo
from app.services.batch_processor import BatchProcessor
import logging
import traceback
import sys

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("telemetry-service")

app = FastAPI(title="ADT Telemetry Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_details = traceback.format_exc()
    logger.error(f"[TELEMETRY] 500 Error on {request.url.path}\n{error_details}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "traceback": error_details.split("\n")[-2]}
    )

@app.on_event("startup")
async def startup_event():
    logger.info("Connecting to MongoDB...")
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