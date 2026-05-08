from fastapi import FastAPI, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import thg
from app.services.neo4j import init_neo4j, close_neo4j, get_neo4j_session
from app.config.settings import settings
import logging
import traceback
import sys

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("thg-service")

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="ADT THG Service - Neo4j AuraDB Backend"
)

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

app.include_router(thg.router, tags=["thg"])

@app.on_event("startup")
async def startup():
    logger.info("Initializing Neo4j Connection...")
    await init_neo4j()

@app.on_event("shutdown")
async def shutdown():
    await close_neo4j()

@app.get("/api/v1/thg/health")
async def health(session=Depends(get_neo4j_session)):
    neo4j_uri = str(settings.neo4j_uri)
    if settings.neo4j_password:
        neo4j_uri = neo4j_uri.replace(settings.neo4j_password, "***")

    return {
        "status": "healthy", 
        "service": "thg",
        "neo4j_uri": neo4j_uri,
    }
