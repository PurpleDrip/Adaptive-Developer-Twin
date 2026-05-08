import httpx
import os
from typing import List, Dict, Any

THG_URL = os.getenv("THG_URL", "http://127.0.0.1:8008")

class THGClient:
    @staticmethod
    async def get_skills_leaderboard(skill: str):
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{THG_URL}/api/v1/thg/leaderboard/{skill}")
            return resp.json() if resp.status_code == 200 else []

    @staticmethod
    async def get_influence():
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{THG_URL}/api/v1/thg/influence")
            return resp.json() if resp.status_code == 200 else []

    @staticmethod
    async def get_dev_skills(user_id: str):
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{THG_URL}/api/v1/thg/skills/{user_id}")
            return resp.json() if resp.status_code == 200 else {"skills": []}
