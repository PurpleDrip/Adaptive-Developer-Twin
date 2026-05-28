from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import httpx
import ipaddress
import time
import os
import logging
import sys
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("gateway-service")

app = FastAPI(title="ADT API Gateway", version="1.0.0")

# ── Office Network Whitelist Middleware ───────────────────────────────────────
# Only telemetry ingest requires the device to be on an office network.
WHITELIST_GUARDED_PATHS = {"/api/v1/telemetry/telemetry/ingest"}

class IPWhitelistMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, monitoring_url: str):
        super().__init__(app)
        self.monitoring_url = monitoring_url
        self._whitelist: list[str] = ["127.0.0.1", "::1", "10.0.0.0/8"]
        self._last_refresh: float = 0.0

    async def _refresh_whitelist(self):
        if time.monotonic() - self._last_refresh < 300:   # 5-min cache
            return
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.monitoring_url}/api/v1/monitoring/system-config")
                if resp.status_code == 200:
                    wl = resp.json().get("office_network_whitelist")
                    if isinstance(wl, list) and wl:
                        self._whitelist = wl
                        self._last_refresh = time.monotonic()
        except Exception:
            pass  # keep last known whitelist on error

    def _is_allowed(self, ip: str) -> bool:
        try:
            addr = ipaddress.ip_address(ip)
            for entry in self._whitelist:
                try:
                    if addr in ipaddress.ip_network(entry, strict=False):
                        return True
                except ValueError:
                    if ip == entry:
                        return True
        except ValueError:
            pass
        return False

    async def dispatch(self, request: Request, call_next):
        if request.url.path in WHITELIST_GUARDED_PATHS:
            await self._refresh_whitelist()
            # Honour X-Forwarded-For when behind a reverse proxy
            forwarded = request.headers.get("x-forwarded-for")
            client_ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "")
            if not self._is_allowed(client_ip):
                logger.warning(f"[GATEWAY] IP BLOCKED: {client_ip} not in office whitelist")
                return Response(
                    content='{"detail": "Access denied: not on authorised network"}',
                    status_code=403,
                    media_type="application/json",
                )
        return await call_next(request)

app.add_middleware(IPWhitelistMiddleware, monitoring_url=os.getenv("MONITORING_URL", "http://monitoring-service:8000"))

# Secure CORS configuration
default_cors = "http://localhost,http://localhost:80,http://localhost:3000,http://localhost:3001,http://localhost:5173,http://127.0.0.1,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:5173"
cors_origins = os.getenv("CORS_ORIGINS", default_cors).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
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
        logger.warning(f"[GATEWAY] Unknown service requested: '{service}' | path=/{path}")
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
            
            # Log non-200 responses for debugging
            if resp.status_code >= 400:
                logger.error(f"[GATEWAY] {method} {service}/{path} -> {resp.status_code} | body={resp.text[:200]}")
            else:
                logger.info(f"[GATEWAY] {method} {service}/{path} -> {resp.status_code}")
            
            return Response(
                content=resp.content, 
                status_code=resp.status_code, 
                media_type=resp.headers.get("content-type", "application/json")
            )
        except httpx.TimeoutException:
            logger.error(f"[GATEWAY] TIMEOUT: {method} {service}/{path} (30s limit exceeded)")
            return Response(
                content='{"detail": "Service timeout"}', 
                status_code=504, 
                media_type="application/json"
            )
        except httpx.RequestError as e:
            logger.error(f"[GATEWAY] NETWORK ERROR: {method} {service}/{path} -> {e}")
            return Response(
                content='{"detail": "Service unavailable"}', 
                status_code=502, 
                media_type="application/json"
            )
        except Exception as e:
            logger.exception(f"[GATEWAY] UNEXPECTED ERROR: {method} {service}/{path}")
            return Response(
                content='{"detail": "Internal server error"}', 
                status_code=500, 
                media_type="application/json"
            )

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gateway"}
