from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analytics
from app.services.neo4j import get_neo4j_session

app = FastAPI(title="ADT Analytics Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

@app.get("/health")
async def health(session=Depends(get_neo4j_session)):
    return {"status": "healthy", "service": "analytics"}