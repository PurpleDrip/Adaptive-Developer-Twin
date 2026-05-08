import httpx
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger("analytics-service.clients")

THG_URL = os.getenv("THG_URL", "http://127.0.0.1:8008")

class THGClient:
    @staticmethod
    async def get_skills_leaderboard(skill: str):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{THG_URL}/api/v1/thg/leaderboard/{skill}")
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(f"[THG-CLIENT] Leaderboard request returned {resp.status_code} for skill '{skill}'")
                return []
        except Exception as e:
            logger.error(f"[THG-CLIENT] Failed to fetch leaderboard for '{skill}': {e}")
            return []

    @staticmethod
    async def get_influence():
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{THG_URL}/api/v1/thg/influence")
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(f"[THG-CLIENT] Influence request returned {resp.status_code}")
                return []
        except Exception as e:
            logger.error(f"[THG-CLIENT] Failed to fetch influence rankings: {e}")
            return []

    @staticmethod
    async def get_dev_skills(user_id: str):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{THG_URL}/api/v1/thg/skills/{user_id}")
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(f"[THG-CLIENT] Skills request for '{user_id}' returned {resp.status_code}")
                return {"skills": []}
        except Exception as e:
            logger.error(f"[THG-CLIENT] Failed to fetch skills for '{user_id}': {e}")
            return {"skills": []}
