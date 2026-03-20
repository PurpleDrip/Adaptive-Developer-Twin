from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import allocation

app = FastAPI(title="ADT Allocation Engine", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(allocation.router, prefix="/api/v1/allocation", tags=["allocation"])

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "allocation"}