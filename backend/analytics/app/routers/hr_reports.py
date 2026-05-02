from fastapi import APIRouter, HTTPException
import os
import httpx
from typing import List, Dict, Any
from shared.database.mongo import get_collection
from datetime import datetime, timedelta

router = APIRouter()
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

@router.get("/summary")
async def get_team_health_summary():
    """
    Overview of entire department health.
    Includes: Avg skill strength, burnout distribution, total tasks completed.
    """
    db_users = get_collection("users")
    db_batches = get_collection("telemetry_batches")
    db_tasks = get_collection("tasks")
    
    total_devs = await db_users.count_documents({"role": "developer"})
    
    # 1. Burnout Distribution (Simplified)
    # In prod, this would aggregate from the analytics_results collection
    critical_burnout = 2 # Mock
    at_risk = 5 # Mock
    
    # 2. Avg Productivity (WPM trends)
    pipeline = [
        {"$group": {"_id": None, "avg_wpm": {"$avg": "$aggregated_signals.avg_wpm"}}}
    ]
    wpm_res = await db_batches.aggregate(pipeline).to_list(1)
    avg_wpm = wpm_res[0]["avg_wpm"] if wpm_res else 0.0
    
    # 3. Tasks status
    tasks_done = await db_tasks.count_documents({"status": "completed"})
    tasks_open = await db_tasks.count_documents({"status": "open"})

    return {
        "timestamp": datetime.utcnow(),
        "team_size": total_devs,
        "health_metrics": {
            "avg_wpm": round(avg_wpm, 2),
            "burnout_heatmap": {"critical": critical_burnout, "at_risk": at_risk, "healthy": total_devs - critical_burnout - at_risk},
            "task_velocity": tasks_done / max(tasks_open + tasks_done, 1)
        }
    }

@router.get("/developer/{user_id}")
async def get_hr_developer_report(user_id: str):
    """
    Detailed HR report for a single developer.
    Includes: Promotion/Firing suggestions, behavior metrics, self-awareness score.
    """
    db_users = get_collection("users")
    user = await db_users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # 1. Behavior & Attendance (Mocked from telemetry batch consistency)
    attendance_score = 0.95 
    
    # 2. Self-Awareness (Delta between 'self' feedback and 'peer' feedback)
    db_feedback = get_collection("weekly_feedback")
    self_f = await db_feedback.find_one({"user_id": user_id, "feedback_type": "self"})
    peer_f = await db_feedback.find_one({"user_id": user_id, "feedback_type": "peer"})
    
    awareness_score = 0.8
    if self_f and peer_f:
        # Calculate mean delta across categories
        deltas = [abs(self_f["ratings"].get(k, 0) - peer_f["ratings"].get(k, 0)) for k in self_f["ratings"]]
        awareness_score = 1.0 - (sum(deltas) / len(deltas)) if deltas else 0.8

    # 3. Recommendation Logic (HR-AI-Core)
    suggestion = "maintain"
    reason = "Performing consistently within expectations."
    
    # Simplified recommendation engine
    if awareness_score < 0.4:
        suggestion = "coaching"
        reason = "Significant gap between self-perception and peer feedback."
    elif attendance_score > 0.9 and awareness_score > 0.8:
        suggestion = "promote"
        reason = "High self-awareness and consistent attendance."

    return {
        "user_id": user_id,
        "name": user["name"],
        "metrics": {
            "attendance": attendance_score,
            "behavior": 0.88,
            "self_awareness": round(awareness_score, 4)
        },
        "hr_recommendation": {
            "suggestion": suggestion,
            "reason": reason
        }
    }
