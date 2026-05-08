from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import fusion

app = FastAPI(title="ADT Fusion Engine", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:80"], allow_methods=["GET", "POST"], allow_headers=["*"])

app.include_router(fusion.router, prefix="/api/v1/fusion", tags=["fusion"])

@app.get("/api/v1/fusion/health")
async def health():
    return {"status": "healthy", "service": "fusion-service"}