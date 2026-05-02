from fastapi import APIRouter, HTTPException
from shared.models.weekly_test import WeeklyFeedbackDTO
from shared.database.mongo import get_collection
import os
import httpx
from datetime import datetime

router = APIRouter()
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

@router.post("/submit", status_code=201)
async def submit_feedback(dto: WeeklyFeedbackDTO):
    """
    Submits peer, self, or manager feedback.
    Updates soft-skill nodes in the graph.
    """
    db = get_collection("weekly_feedback").database
    feedback_col = db["weekly_feedback"]
    
    # Store raw feedback
    doc = dto.dict()
    doc["submitted_at"] = datetime.utcnow()
    await feedback_col.insert_one(doc)
    
    # Update Graph for each rated category
    async with httpx.AsyncClient() as client:
        for category, score in dto.ratings.items():
            # Soft skills have a slower learning rate (0.2) and lower base confidence (0.4)
            # because they are subjective.
            try:
                await client.post(f"{THG_URL}/api/v1/thg/thg/update", json={
                    "dev_id": dto.user_id,
                    "skill_name": f"soft_{category}",
                    "strength": score,
                    "confidence": 0.4
                })
            except: pass
            
    return {"status": "feedback_recorded", "user_id": dto.user_id}

@router.get("/summary/{user_id}")
async def get_feedback_summary(user_id: str):
    feedback_col = get_collection("weekly_feedback")
    cursor = feedback_col.find({"user_id": user_id}).sort("submitted_at", -1).limit(20)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
