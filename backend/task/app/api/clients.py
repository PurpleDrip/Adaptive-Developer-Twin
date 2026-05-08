import httpx
import os
import logging

logger = logging.getLogger("task-service.clients")

ALLOCATION_URL = os.getenv("ALLOCATION_URL", "http://127.0.0.1:8009")
THG_URL = os.getenv("THG_URL", "http://127.0.0.1:8008")
FUSION_URL = os.getenv("FUSION_URL", "http://127.0.0.1:8005")
AUTH_URL = os.getenv("AUTH_URL", "http://127.0.0.1:8001")


class AuthClient:
    @staticmethod
    async def get_squad_ids(manager_id: str) -> list:
        """
        Returns the list of dev user_ids belonging to a manager's squad.
        Hits the auth-service squad endpoint and forwards the manager role
        so RBAC accepts the request.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{AUTH_URL}/api/v1/auth/users/squad/{manager_id}",
                    headers={"X-User-Role": "manager"},
                )
                if resp.status_code == 200:
                    squad = resp.json() or []
                    ids = [d.get("user_id") for d in squad if d.get("user_id")]
                    logger.info(f"[SQUAD] Manager {manager_id} -> {len(ids)} devs")
                    return ids
                logger.warning(f"[SQUAD] auth-service returned {resp.status_code} for manager {manager_id}")
                return []
        except Exception as e:
            logger.error(f"[SQUAD] auth-service unreachable: {e}")
            return []

class AllocationClient:
    @staticmethod
    async def rank_candidates(task_id: str, title: str, description: str, required_skills: dict):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{ALLOCATION_URL}/api/v1/allocation/rank", json={
                    "task_id": task_id,
                    "title": title,
                    "description": description,
                    "required_skills": required_skills
                })
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    logger.info(f"[CSA-MATCHING] Ranked {len(candidates)} candidates for task {task_id}")
                    return candidates
                logger.warning(f"[CSA-MATCHING] Allocation engine returned {resp.status_code} for task {task_id}")
                return []
        except Exception as e:
            logger.error(f"[CSA-MATCHING] Allocation engine unreachable for task {task_id}: {e}")
            return []

class THGClient:
    @staticmethod
    async def record_assignment(dev_id: str, task_id: str):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{THG_URL}/api/v1/thg/record-assignment", json={
                    "dev_id": dev_id, "task_id": task_id
                })
                logger.info(f"[THG-SYNC] Assignment recorded: {dev_id} -> {task_id} (status={resp.status_code})")
        except Exception as e:
            logger.error(f"[THG-SYNC] Failed to record assignment {dev_id} -> {task_id}: {e}")

    @staticmethod
    async def create_task(task_id: str, title: str, description: str, required_skills: dict):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{THG_URL}/api/v1/thg/task/create", json={
                    "task_id": task_id, "title": title, "description": description, "required_skills": required_skills
                })
                logger.info(f"[THG-SYNC] Task {task_id} created in graph")
        except Exception as e:
            logger.error(f"[THG-SYNC] Failed to create task {task_id}: {e}")

    @staticmethod
    async def get_user_tasks(dev_id: str):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{THG_URL}/api/v1/thg/task/user/{dev_id}")
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.error(f"[THG-SYNC] Failed to get user tasks for {dev_id}: {e}")
        return []

class FusionClient:
    @staticmethod
    async def analyze_project(user_id: str, github_url: str):
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(f"{FUSION_URL}/api/v1/fusion/analyze-project", json={
                    "user_id": user_id, "github_url": github_url
                })
                logger.info(f"[SCM-AUDIT] Project analysis triggered for {user_id}: {github_url} (status={resp.status_code})")
        except Exception as e:
            logger.error(f"[SCM-AUDIT] Failed to analyze project for {user_id}: {e}")
