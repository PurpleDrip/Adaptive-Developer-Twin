from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import stats, tests, feedback, hr_reports, leaderboard
from shared.database.mongo import connect_mongo, close_mongo

app = FastAPI(title="ADT Analytics Service", version="1.0.0")

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

app.include_router(stats.router, tags=["stats"])
app.include_router(tests.router, prefix="/api/v1/analytics/tests", tags=["tests"])
app.include_router(feedback.router, prefix="/api/v1/analytics/feedback", tags=["feedback"])
app.include_router(hr_reports.router, prefix="/api/v1/analytics/hr-reports", tags=["hr-reports"])
app.include_router(leaderboard.router, tags=["leaderboard"])

@app.get("/api/v1/analytics/health")
async def health():
    return {"status": "healthy", "service": "analytics-service"}