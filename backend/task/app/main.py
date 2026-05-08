from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import tasks, assessment
from shared.database.mongo import connect_mongo, close_mongo
import logging
import traceback
import sys

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("task-service")

app = FastAPI(title="ADT Task Service", version="1.0.0")

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
    logger.error(f"500 Internal Server Error on {request.url.path}\n{error_details}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "traceback": error_details.split("\n")[-2]}
    )

@app.on_event("startup")
async def startup_db_client():
    logger.info("Connecting to MongoDB...")
    await connect_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo()

app.include_router(tasks.router, tags=["tasks"])
app.include_router(assessment.router, prefix="/api/v1/task/assessment", tags=["assessment"])

@app.get("/api/v1/task/health")
async def health():
    return {"status": "healthy", "service": "task-service"}
