from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI(title="ADT API Gateway", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SERVICE_URLS = {
    "thg": "http://thg-service:8003",
    "allocation": "http://allocation-service:8004",
    "fusion": "http://fusion-service:8002"
}

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(service: str, path: str, request=Depends()):
    url = f"{SERVICE_URLS.get(service, '')}/{path}"
    if not url:
        raise HTTPException(404, "Service not found")
    
    async with httpx.AsyncClient() as client:
        resp = await client.request(request.method, url, json=request.json)
        return resp.json()

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "gateway"}