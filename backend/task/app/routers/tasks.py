from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
import httpx
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from shared.models.task import TaskCreateDTO, TaskAssignDTO, TaskReviewDTO, TaskDocument
from shared.database.mongo import get_collection
from shared.services.audit_logger import AuditLogger

router = APIRouter()
ALLOCATION_URL = os.getenv("ALLOCATION_URL", "http://allocation-engine:8000")
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")
FUSION_URL = os.getenv("FUSION_URL", "http://fusion-service:8000")

@router.post("/create", status_code=201)
async def create_task(dto: TaskCreateDTO):
    """Senior Dev creates a new task."""
    tasks_col = get_collection("tasks")
    task_id = f"TASK-{uuid.uuid4().hex[:6].upper()}"
    
    # 1. Get Ranked Candidates from Allocation Engine
    ranked_candidates = []
    try:
        async with httpx.AsyncClient() as client:
            # We first get semantic vector from Fusion, then pass to Allocation
            # But Allocation Engine's rank endpoint might do this internally.
            # Here we assume Allocation Engine handles the matching logic.
            resp = await client.post(f"{ALLOCATION_URL}/api/v1/allocation/rank", json={
                "task_id": task_id,
                "title": dto.title,
                "description": dto.description,
                "required_skills": dto.required_skills
            })
            if resp.status_code == 200:
                ranked_candidates = resp.json().get("candidates", [])
    except Exception as e:
        print(f"Candidate ranking failed: {e}")

    # 2. Save Task
    task_doc = TaskDocument.create(dto, task_id)
    task_doc["ranked_candidates"] = ranked_candidates
    await tasks_col.insert_one(task_doc)
    
    return {"status": "created", "task_id": task_id, "top_candidates": ranked_candidates[:3]}

@router.post("/{task_id}/assign")
async def assign_task(task_id: str, dto: TaskAssignDTO):
    tasks_col = get_collection("tasks")
    task = await tasks_col.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await tasks_col.update_one(
        {"task_id": task_id},
        {"$set": {
            "status": "assigned",
            "assigned_to": dto.assigned_to,
            "assigned_by": dto.assigned_by,
            "assigned_at": datetime.utcnow()
        }}
    )
    
    # Notify THG
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{THG_URL}/api/v1/thg/thg/record-assignment", json={
                "dev_id": dto.assigned_to,
                "task_id": task_id
            })
    except: pass

    return {"status": "assigned", "task_id": task_id, "to": dto.assigned_to}

@router.post("/{task_id}/complete")
async def complete_task(task_id: str):
    tasks_col = get_collection("tasks")
    await tasks_col.update_one(
        {"task_id": task_id},
        {"$set": {
            "status": "review",
            "completed_at": datetime.utcnow()
        }}
    )
    return {"status": "moved_to_review", "task_id": task_id}

@router.post("/{task_id}/review")
async def review_task(task_id: str, dto: TaskReviewDTO, background_tasks: BackgroundTasks):
    tasks_col = get_collection("tasks")
    task = await tasks_col.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await tasks_col.update_one(
        {"task_id": task_id},
        {"$set": {
            "status": "completed",
            "review_comment": dto.review_comment,
            "review_score": dto.review_score,
            "reviewed_by": dto.reviewed_by,
            "skills_demonstrated": dto.skills_demonstrated,
            "reviewed_at": datetime.utcnow()
        }}
    )
    
    # Trigger THG update based on feedback
    background_tasks.add_task(process_review_feedback, task, dto)
    
    return {"status": "completed", "task_id": task_id}

async def process_review_feedback(task: Dict[str, Any], review: TaskReviewDTO):
    """
    Analyzes review score/comments and updates developer skills in THG.
    """
    user_id = task["assigned_to"]
    # Skills to update: either the task's required skills or the explicitly demonstrated ones
    skills_to_update = review.skills_demonstrated or task["required_skills"]
    
    # Review Score multiplier: 1.0 is neutral, >0.5 is positive, <0.5 is negative
    # We map 0.0-1.0 to a delta of -0.2 to +0.2
    delta = (review.review_score - 0.5) * 0.4
    
    async with httpx.AsyncClient() as client:
        audit = AuditLogger(get_collection("audit_log").database)
        
        for skill, weight in skills_to_update.items():
            # Base strength comes from the review score * the weight of that skill in the task
            strength_update = max(0.01, min(1.0, 0.5 + delta)) # Center around 0.5 for the update signal
            
            # Update THG
            try:
                # 1. Fetch current strength for audit
                profile_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/{user_id}/skills")
                old_strength = 0.5
                old_confidence = 0.5
                if profile_resp.status_code == 200:
                    for s in profile_resp.json().get("skills", []):
                        if s["name"] == skill:
                            old_strength = s["strength"]
                            old_confidence = s["confidence"]
                            break

                # 2. Push update
                await client.post(f"{THG_URL}/api/v1/thg/thg/update", json={
                    "dev_id": user_id,
                    "skill_name": skill,
                    "strength": strength_update,
                    "confidence": 0.8 # Reviews are high-confidence evidence
                })
                
                # 3. Audit Log
                await audit.log_thg_update(
                    user_id=user_id,
                    source="review_feedback",
                    skill_name=skill,
                    old_strength=old_strength,
                    new_strength=strength_update, # THG will handle the exponential moving average internally
                    old_confidence=old_confidence,
                    new_confidence=0.8,
                    metadata={"task_id": task["task_id"], "review_score": review.review_score}
                )
            except Exception as e:
                print(f"Feedback processing failed for skill {skill}: {e}")

@router.get("/open")
async def get_open_tasks():
    tasks_col = get_collection("tasks")
    cursor = tasks_col.find({"status": "open"}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results

@router.get("/user/{user_id}")
async def get_user_tasks(user_id: str):
    tasks_col = get_collection("tasks")
    cursor = tasks_col.find({"assigned_to": user_id}).sort("assigned_at", -1)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
