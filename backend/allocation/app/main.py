from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import allocation

app = FastAPI(title="ADT Allocation Engine", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:80"], allow_methods=["GET", "POST"], allow_headers=["*"])
app.include_router(allocation.router, prefix="/api/v1/allocation", tags=["allocation"])

@app.get("/api/v1/allocation/health")
async def health():
    return {"status": "healthy", "service": "allocation-engine"}