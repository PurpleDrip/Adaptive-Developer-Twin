from fastapi import APIRouter, HTTPException, Depends
from shared.models.assessment import WeeklyTest, TestSubmission, Question
from shared.database.mongo import get_collection
from shared.auth.rbac import role_required
from app.api.clients import THGClient
import os
import httpx
from uuid import uuid4
from datetime import datetime

router = APIRouter(prefix="/api/v1/task/assessment", tags=["assessment"])

@router.post("/create", dependencies=[Depends(role_required(["manager", "PM"]))])
async def create_assessment(test: WeeklyTest):
    """
    Manager issues a 10-question challenge for a specific domain.
    """
    if len(test.questions) != 10:
        raise HTTPException(status_code=400, detail="Assessments must have exactly 10 questions")
        
    db_assessments = get_collection("assessments")
    test_id = f"TEST-{uuid4().hex[:6].upper()}"
    doc = test.dict()
    doc["test_id"] = test_id
    doc["created_at"] = datetime.utcnow()
    
    await db_assessments.insert_one(doc)
    return {"status": "created", "test_id": test_id}

@router.post("/submit")
async def submit_assessment(submission: TestSubmission):
    """
    Developer submits answers, calculates score, and updates THG.
    Includes anti-loophole protection (Single Attempt).
    """
    db_assessments = get_collection("assessments")
    db_submissions = get_collection("test_submissions")

    # 1. Check for existing submission (Anti-Cheat)
    existing = await db_submissions.find_one({"user_id": submission.user_id, "test_id": submission.test_id})
    if existing:
        raise HTTPException(status_code=403, detail="Challenge already attempted. No second chances.")

    test = await db_assessments.find_one({"test_id": submission.test_id})
    if not test:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # 2. Calculate Score
    correct_count = 0
    questions = test["questions"]
    for q in questions:
        q_id = q["id"]
        if q_id in submission.answers and submission.answers[q_id] == q["correct_option"]:
            correct_count += 1
            
    score = correct_count / 10.0
    # Skill Delta logic: High score increases strength, low score decreases it.
    skill_delta = (score - 0.5) * 0.2 
    
    # 3. Save Verified Submission
    submission_doc = submission.dict()
    submission_doc["score"] = score
    submission_doc["verified_at"] = datetime.utcnow()
    submission_doc["is_legit"] = True # Add behavioral analysis here later
    await db_submissions.insert_one(submission_doc)
    
    # 4. SYNC TO THG: Update the skill graph (using standardized client)
    try:
        async with httpx.AsyncClient() as client:
            # We use the internal service URL for high speed
            THG_URL = os.getenv("THG_URL", "http://127.0.0.1:8008")
            await client.post(f"{THG_URL}/api/v1/thg/update-skill", json={
                "dev_id": submission.user_id,
                "skill_name": test["domain"],
                "delta": skill_delta
            })
    except Exception as e:
        print(f"THG Sync failed: {e}")
        
    return {"score": score, "delta": skill_delta, "message": "Neural twin updated via assessment."}

@router.get("/active")
async def get_active_assessments():
    """List assessments for the developer to take."""
    db_assessments = get_collection("assessments")
    cursor = db_assessments.find({"is_active": True}).sort("created_at", -1).limit(5)
    return await cursor.to_list(length=5)
