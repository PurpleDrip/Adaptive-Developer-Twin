from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analytics
from app.services.neo4j import init_neo4j, close_neo4j, get_neo4j_session

app = FastAPI(title="ADT Analytics Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:80"], allow_methods=["GET"], allow_headers=["Content-Type", "Authorization"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

@app.on_event("startup")
async def startup():
    await init_neo4j()

@app.on_event("shutdown")
async def shutdown():
    await close_neo4j()

@app.get("/health")
async def health(session=Depends(get_neo4j_session)):
    return {"status": "healthy", "service": "analytics"}