from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from app.routers import telemetry
from app.kafka_producer import kafka_producer

app = FastAPI(title="ADT Telemetry Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])

@app.on_event("startup")
async def startup():
    await kafka_producer.start()

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "telemetry-agent"}