from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import thg
from app.services.neo4j import init_neo4j, close_neo4j, get_neo4j_session
from app.config.settings import settings

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="ADT THG Service - Neo4j AuraDB Backend"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:80"],
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(thg.router, prefix="/api/v1/thg", tags=["thg"])

@app.on_event("startup")
async def startup():
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
