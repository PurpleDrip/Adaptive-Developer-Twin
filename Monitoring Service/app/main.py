from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import metrics

app = FastAPI(title="ADT Monitoring Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "monitoring"}