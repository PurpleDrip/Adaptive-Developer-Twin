from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users

app = FastAPI(title="ADT Authentication Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(users.router, prefix="/api/v1", tags=["users"])

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "auth-service"}