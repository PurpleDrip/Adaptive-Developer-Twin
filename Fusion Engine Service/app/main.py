from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import fusion
from app.kafka_consumer import kafka_consumer

app = FastAPI(title="ADT Fusion Engine", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(fusion.router, prefix="/api/v1/fusion", tags=["fusion"])

@app.on_event("startup")
async def startup():
    await kafka_consumer.start()

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "fusion-engine"}