from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

app = FastAPI(title="ADT Dashboard")

# Ensure static and templates exist
os.makedirs("app/static", exist_ok=True)

# Serve individual static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def index():
    try:
        with open("app/templates/index.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        return "Dashboard Landing Page (Template index.html not found yet)"

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "dashboard"}
