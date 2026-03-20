from fastapi import FastAPI

app = FastAPI()

@app.get("/health")
async def read_server_health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="[IP_ADDRESS]", port=8000)