from fastapi import APIRouter

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/system")
async def get_system_metrics():
    return {"cpu": 45.2, "memory": 67.8, "services": 8}

@router.get("/performance")
async def get_performance_metrics():
    return {"response_time": 120, "throughput": 1500, "errors": 2}