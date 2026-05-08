from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from shared.models.task import TaskCreateDTO, TaskAssignDTO, TaskReviewDTO, TaskDocument
from shared.database.mongo import get_collection
from shared.services.audit_logger import AuditLogger
from app.api.clients import AllocationClient, THGClient, FusionClient, AuthClient

router = APIRouter(prefix="/api/v1/task", tags=["tasks"])

@router.post("/match", status_code=200)
async def match_candidates(dto: TaskCreateDTO):
    """
    Ranks the best-fit developers for a candidate task WITHOUT persisting the task.
    Scoped to the requesting manager's squad (Isolated Access per ADT manifesto).
    Used by the manager flow: 'Find Best Devs' → review candidates → assign.
    """
    preview_id = f"PREVIEW-{uuid.uuid4().hex[:6].upper()}"

    squad_ids = await AuthClient.get_squad_ids(dto.created_by)
    if not squad_ids:
        return {
            "status": "matched",
            "candidates": [],
            "scope": "squad",
            "manager_id": dto.created_by,
            "squad_size": 0,
            "message": "No developers are currently assigned to this manager.",
        }

    ranked_candidates = await AllocationClient.rank_candidates(
        preview_id, dto.title, dto.description, dto.required_skills
    )

    squad_set = set(squad_ids)
    scoped = [c for c in ranked_candidates if c.get("user_id") in squad_set]

    return {
        "status": "matched",
        "candidates": scoped,
        "scope": "squad",
        "manager_id": dto.created_by,
        "squad_size": len(squad_ids),
    }

@router.post("/create", status_code=201)
async def create_task(dto: TaskCreateDTO):
    """Senior Dev creates a new task."""
    tasks_col = get_collection("tasks")
    task_id = f"TASK-{uuid.uuid4().hex[:6].upper()}"

    # 1. Get Ranked Candidates from Allocation Engine
    ranked_candidates = await AllocationClient.rank_candidates(
        task_id, dto.title, dto.description, dto.required_skills
    )

    # 2. Save Task to THG (Bypassing Mongo)
    await THGClient.create_task(task_id, dto.title, dto.description, dto.required_skills)

    return {"status": "created", "task_id": task_id, "top_candidates": ranked_candidates[:3]}

@router.post("/{task_id}/assign")
async def assign_task(task_id: str, dto: TaskAssignDTO):
    """Assigns task to dev and syncs with THG."""
    # 1. Sync Assignment with THG Graph (Bypassing Mongo)
    await THGClient.record_assignment(dto.assigned_to, task_id)
    
    return {"status": "assigned", "task_id": task_id, "dev_id": dto.assigned_to}

@router.get("/user/{user_id}")
async def get_user_tasks(user_id: str):
    tasks = await THGClient.get_user_tasks(user_id)
    return tasks

@router.get("/all")
async def get_all_tasks():
    # Not supported dynamically via THG yet unless needed
    return []
