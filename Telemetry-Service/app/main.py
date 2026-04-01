from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import telemetry

app = FastAPI(title="ADT Telemetry Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(telemetry.router, prefix="/api/v1", tags=["telemetry"])

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "telemetry-service"}