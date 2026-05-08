import httpx
import os

ALLOCATION_URL = os.getenv("ALLOCATION_URL", "http://127.0.0.1:8009")
THG_URL = os.getenv("THG_URL", "http://127.0.0.1:8008")
FUSION_URL = os.getenv("FUSION_URL", "http://127.0.0.1:8005")

class AllocationClient:
    @staticmethod
    async def rank_candidates(task_id: str, title: str, description: str, required_skills: dict):
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(f"{ALLOCATION_URL}/api/v1/allocation/rank", json={
                    "task_id": task_id,
                    "title": title,
                    "description": description,
                    "required_skills": required_skills
                })
                return resp.json().get("candidates", []) if resp.status_code == 200 else []
            except: return []

class THGClient:
    @staticmethod
    async def record_assignment(dev_id: str, task_id: str):
        async with httpx.AsyncClient() as client:
            try:
                await client.post(f"{THG_URL}/api/v1/thg/record-assignment", json={
                    "dev_id": dev_id, "task_id": task_id
                })
            except: pass

class FusionClient:
    @staticmethod
    async def analyze_project(user_id: str, github_url: str):
        async with httpx.AsyncClient() as client:
            try:
                await client.post(f"{FUSION_URL}/api/v1/fusion/analyze-project", json={
                    "user_id": user_id, "github_url": github_url
                })
            except: pass
