from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, admin, connect
from shared.database.mongo import connect_mongo, close_mongo

app = FastAPI(title="ADT Authentication Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo()

app.include_router(users.router, prefix="/api/v1/auth/users", tags=["users"])
app.include_router(admin.router, prefix="/api/v1/auth/admin", tags=["admin"])
app.include_router(connect.router, prefix="/api/v1/auth/connect", tags=["connect"])

@app.get("/api/v1/auth/health")
async def health():
    return {"status": "healthy", "service": "auth-service"}