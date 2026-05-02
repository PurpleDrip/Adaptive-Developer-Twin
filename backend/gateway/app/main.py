from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ADT API Gateway", version="1.0.0")

# Secure CORS configuration
default_cors = "http://localhost,http://localhost:80,http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5173"
cors_origins = os.getenv("CORS_ORIGINS", default_cors).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
    max_age=600,
)

# Load from environment variables (set in docker-compose)
SERVICE_URLS = {
    "auth": os.getenv("AUTH_URL", "http://auth-service:8000"),
    "telemetry": os.getenv("TELEMETRY_URL", "http://telemetry-service:8000"),
    "fusion": os.getenv("FUSION_URL", "http://fusion-service:8000"),
    "thg": os.getenv("THG_URL", "http://thg-service:8000"),
    "allocation": os.getenv("ALLOCATION_URL", "http://allocation-engine:8000"),
    "task": os.getenv("TASK_URL", "http://task-service:8000"),
    "analytics": os.getenv("ANALYTICS_URL", "http://analytics-service:8000"),
    "monitoring": os.getenv("MONITORING_URL", "http://monitoring-service:8000")
}

@app.api_route("/api/v1/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(service: str, path: str, request: Request):
    base_url = SERVICE_URLS.get(service)
    if not base_url:
        logger.warning(f"Unknown service requested: {service}")
        return Response(content='{"detail": "Service not found"}', status_code=404, media_type="application/json")
        
    url = f"{base_url}/api/v1/{service}/{path}"
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        method = request.method
        content = await request.body()
        headers = dict(request.headers)
        headers.pop("host", None)
        
        try:
            resp = await client.request(
                method,
                url,
                content=content,
                headers=headers,
                params=request.query_params
            )
            return Response(
                content=resp.content, 
                status_code=resp.status_code, 
                media_type=resp.headers.get("content-type", "application/json")
            )
        except httpx.TimeoutException:
            logger.error(f"Timeout proxying to {service}/{path}")
            return Response(
                content='{"detail": "Service timeout"}', 
                status_code=504, 
                media_type="application/json"
            )
        except httpx.RequestError as e:
            logger.error(f"Network error proxying to {service}/{path}: {e}")
            return Response(
                content='{"detail": "Service unavailable"}', 
                status_code=502, 
                media_type="application/json"
            )
        except Exception as e:
            logger.exception(f"Unexpected error proxying to {service}/{path}")
            return Response(
                content='{"detail": "Internal server error"}', 
                status_code=500, 
                media_type="application/json"
            )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gateway"}
