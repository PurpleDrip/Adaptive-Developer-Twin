from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users

app = FastAPI(title="ADT Authentication Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://localhost:80"], allow_methods=["GET", "POST"], allow_headers=["Content-Type", "Authorization"])

app.include_router(users.router, prefix="/api/v1/auth", tags=["users"])

@app.get("/api/v1/auth/health")
async def health():
    return {"status": "healthy", "service": "auth-service"}