from fastapi import APIRouter, HTTPException
import os
import httpx
from typing import List, Dict, Any
from shared.database.mongo import get_collection
from app.services.burnout_predictor import BurnoutPredictor
from app.services.success_predictor import SuccessPredictor

router = APIRouter()
TELEMETRY_URL = os.getenv("TELEMETRY_URL", "http://telemetry-service:8000")

burnout_model = BurnoutPredictor()
success_model = SuccessPredictor()

@router.get("/{user_id}/burnout")
async def get_burnout_risk(user_id: str):
    """
    Analyzes last 30 days of telemetry batches to predict burnout risk.
    """
    db_batches = get_collection("telemetry_batches")
    # Fetch last 30 batches for this user
    cursor = db_batches.find({"user_id": user_id}).sort("window_end", -1).limit(30)
    batches = []
    async for b in cursor:
        # Extract features for the model
        signals = b.get("aggregated_signals", {})
        batches.append({
            "user_id": user_id,
            "wpm": signals.get("avg_wpm", 0),
            "keystrokes": signals.get("total_keystrokes", 0),
            "commands": signals.get("total_commands", 0),
            "errors": signals.get("total_errors", 0),
            "idle_ratio": signals.get("total_idle_seconds", 0) / 1800.0, # Assumes 30m batch
            "copy_paste_ratio": signals.get("total_copy_paste", 0) / max(signals.get("total_keystrokes", 1), 1)
        })
    
    if not batches:
        raise HTTPException(status_code=404, detail="No telemetry data found for user")
        
    # Model expects sequence in chronological order
    batches.reverse()
    prediction = burnout_model.predict_risk(batches)
    return prediction

@router.get("/{user_id}/success-probability/{task_id}")
async def get_task_success_probability(user_id: str, task_id: str):
    """
    Predicts probability of success for a specific developer-task pairing.
    """
    # 1. Fetch Task Info
    db_tasks = get_collection("tasks")
    task = await db_tasks.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # 2. Fetch User Info (for match score and experience)
    # We can get the match score from the task's 'ranked_candidates' if available
    match_score = 0.5
    for cand in task.get("ranked_candidates", []):
        if cand["user_id"] == user_id:
            match_score = cand["match_score"]
            break
            
    # 3. Fetch User Experience from Auth/Mongo
    db_users = get_collection("users")
    user = await db_users.find_one({"user_id": user_id})
    exp_level = user.get("experience_level", "Junior") if user else "Junior"
    
    # 4. Predict
    prediction = success_model.predict_success(
        developer_profile={
            "skill_match_score": match_score,
            "experience_level": exp_level,
            "current_workload": 1, # Simplified
            "historical_success_rate": 0.85 # Simplified
        },
        task_metadata={
            "complexity": 3 # Simplified
        }
    )
    
    return {
        "user_id": user_id,
        "task_id": task_id,
        "prediction": prediction
    }

@router.get("/{user_id}/summary")
async def get_developer_analytics_summary(user_id: str):
    """
    Aggregated view for the Developer Dashboard.
    """
    # This would combine burnout, success trends, and feedback
    return {
        "user_id": user_id,
        "overall_rank_percentile": 85,
        "learning_velocity": "high",
        "primary_domain": "Backend",
        "top_skills": ["FastAPI", "Neo4j", "Python"]
    }
