from fastapi import APIRouter, HTTPException, Depends
from shared.models.assessment import WeeklyTest, TestSubmission, Question
from shared.database.mongo import get_collection
from shared.auth.rbac import role_required
import os
import httpx
import logging
from uuid import uuid4
from datetime import datetime

logger = logging.getLogger("task-service.assessment")

router = APIRouter(tags=["assessment"])

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
    logger.info(f"[ASSESSMENT] Created test {test_id} for domain '{test.domain}' by '{test.created_by}'")
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
        logger.warning(f"[ANTI-CHEAT] User {submission.user_id} attempted re-submission of {submission.test_id}")
        raise HTTPException(status_code=403, detail="Challenge already attempted. No second chances.")

    test = await db_assessments.find_one({"test_id": submission.test_id})
    if not test:
        logger.error(f"[ASSESSMENT] Test {submission.test_id} not found in DB")
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # 2. Calculate Score (BGSC-Feedback Algorithm)
    correct_count = 0
    questions = test["questions"]
    for q in questions:
        q_id = q["id"]
        if q_id in submission.answers and submission.answers[q_id] == q["correct_option"]:
            correct_count += 1
            
    score = correct_count / 10.0
    # Skill Delta logic: Bounded Gradient Skill Correction
    skill_delta = (score - 0.5) * 0.2 
    
    # 3. Save Verified Submission
    submission_doc = submission.dict()
    submission_doc["score"] = score
    submission_doc["verified_at"] = datetime.utcnow()
    submission_doc["is_legit"] = True
    await db_submissions.insert_one(submission_doc)
    logger.info(f"[ASSESSMENT] User {submission.user_id} scored {score:.1%} on {submission.test_id} | delta={skill_delta:.3f}")
    
    # 4. SYNC TO THG: Update the skill graph
    try:
        THG_URL = os.getenv("THG_URL", "http://127.0.0.1:8008")
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{THG_URL}/api/v1/thg/update-skill", json={
                "dev_id": submission.user_id,
                "skill_name": test["domain"],
                "delta": skill_delta
            })
            logger.info(f"[THG-SYNC] Skill delta applied: {test['domain']} += {skill_delta:.3f} for {submission.user_id} (status={resp.status_code})")
    except Exception as e:
        logger.error(f"[THG-SYNC FAILED] Could not update skill graph for {submission.user_id}: {e}")
        
    return {"score": score, "delta": skill_delta, "message": "Neural twin updated via assessment."}

@router.get("/active")
async def get_active_assessments():
    """List assessments for the developer to take."""
    db_assessments = get_collection("assessments")
    cursor = db_assessments.find({"is_active": True}, {"_id": 0}).sort("created_at", -1).limit(5)
    results = await cursor.to_list(length=5)
    logger.info(f"[ASSESSMENT] Returned {len(results)} active assessments")
    return results

@router.get("/submissions/{user_id}")
async def get_user_submissions(user_id: str):
    """Returns all test submissions for a given developer."""
    db_submissions = get_collection("test_submissions")
    cursor = db_submissions.find({"user_id": user_id}, {"_id": 0}).sort("verified_at", -1)
    results = await cursor.to_list(length=100)
    return results
