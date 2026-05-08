from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, admin, connect, notifications
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
logger = logging.getLogger("auth-service")

app = FastAPI(title="ADT Authentication Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler for 500 Errors
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

app.include_router(users.router, tags=["users"])
app.include_router(admin.router, prefix="/api/v1/auth/admin", tags=["admin"])
app.include_router(connect.router, prefix="/api/v1/auth/connect", tags=["connect"])
app.include_router(notifications.router, prefix="/api/v1/auth/notifications", tags=["notifications"])

@app.get("/api/v1/auth/health")
async def health():
    return {"status": "healthy", "service": "auth-service"}