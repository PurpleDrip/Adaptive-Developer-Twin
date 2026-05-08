from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from shared.models.task import TaskCreateDTO, TaskAssignDTO, TaskReviewDTO, TaskDocument
from shared.database.mongo import get_collection
from shared.services.audit_logger import AuditLogger
from app.api.clients import AllocationClient, THGClient, FusionClient

router = APIRouter(prefix="/api/v1/task", tags=["tasks"])

@router.post("/create", status_code=201)
async def create_task(dto: TaskCreateDTO):
    """Senior Dev creates a new task."""
    tasks_col = get_collection("tasks")
    task_id = f"TASK-{uuid.uuid4().hex[:6].upper()}"
    
    # 1. Get Ranked Candidates from Allocation Engine
    ranked_candidates = await AllocationClient.rank_candidates(
        task_id, dto.title, dto.description, dto.required_skills
    )

    # 2. Save Task
    task_doc = TaskDocument.create(dto, task_id)
    task_doc["ranked_candidates"] = ranked_candidates
    await tasks_col.insert_one(task_doc)
    
    return {"status": "created", "task_id": task_id, "top_candidates": ranked_candidates[:3]}

@router.post("/{task_id}/assign")
async def assign_task(task_id: str, dto: TaskAssignDTO):
    """Assigns task to dev and syncs with THG."""
    tasks_col = get_collection("tasks")
    
    # 1. Update Mongo
    await tasks_col.update_one(
        {"task_id": task_id},
        {"$set": {
            "assigned_to": dto.assigned_to, 
            "status": "allotted", 
            "assigned_at": datetime.utcnow()
        }}
    )
    
    # 2. Sync with THG Graph
    await THGClient.record_assignment(dto.assigned_to, task_id)
    
    return {"status": "assigned", "task_id": task_id, "dev_id": dto.assigned_to}

@router.get("/user/{user_id}")
async def get_user_tasks(user_id: str):
    tasks_col = get_collection("tasks")
    cursor = tasks_col.find({"assigned_to": user_id}, {"_id": 0})
    return await cursor.to_list(length=10)

@router.get("/all")
async def get_all_tasks():
    tasks_col = get_collection("tasks")
    cursor = tasks_col.find({}, {"_id": 0})
    return await cursor.to_list(length=100)
