from fastapi import APIRouter, HTTPException, Depends
from shared.models.assessment import AssessmentCreateDTO, AssessmentSubmissionDTO, AssessmentResult
from shared.database.mongo import get_collection
from shared.auth.rbac import role_required
import os
import httpx
from uuid import uuid4
from datetime import datetime

router = APIRouter(tags=["assessment"])
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

@router.post("/create", dependencies=[Depends(role_required(["manager", "PM"]))])
async def create_assessment(dto: AssessmentCreateDTO):
    """
    Manager issues a 10-question challenge for a specific domain.
    """
    if len(dto.questions) != 10:
        raise HTTPException(status_code=400, detail="Assessments must have exactly 10 questions")
        
    db_assessments = get_collection("assessments")
    assessment_id = str(uuid4())
    doc = dto.dict()
    doc["assessment_id"] = assessment_id
    doc["created_at"] = datetime.utcnow()
    
    await db_assessments.insert_one(doc)
    return {"status": "created", "assessment_id": assessment_id}

@router.post("/submit")
async def submit_assessment(dto: AssessmentSubmissionDTO):
    """
    Developer submits answers, calculates score, and updates THG.
    """
    db_assessments = get_collection("assessments")
    assessment = await db_assessments.find_one({"assessment_id": dto.assessment_id})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Calculate Score
    correct_count = 0
    for i, q in enumerate(assessment["questions"]):
        if i < len(dto.answers) and dto.answers[i] == q["correct_option"]:
            correct_count += 1
            
    score = correct_count / 10.0
    # Skill Delta logic: High score increases strength, low score slightly decreases it
    skill_delta = (score - 0.5) * 0.2 
    
    # Save Result
    db_results = get_collection("assessment_results")
    result = {
        "user_id": dto.user_id,
        "assessment_id": dto.assessment_id,
        "score": score,
        "domain": assessment["domain"],
        "skill_delta": skill_delta,
        "created_at": datetime.utcnow()
    }
    await db_results.insert_one(result)
    
    # SYNC TO THG: Update the skill graph
    try:
        async with httpx.AsyncClient() as client:
            await client.post(f"{THG_URL}/api/v1/thg/thg/update-skill", json={
                "dev_id": dto.user_id,
                "skill_name": assessment["domain"],
                "delta": skill_delta
            })
    except Exception as e:
        print(f"THG Sync failed: {e}")
        
    return {"score": score, "delta": skill_delta, "message": "Neural twin updated via assessment."}

@router.get("/active")
async def get_active_assessments():
    """List assessments for the developer to take."""
    db_assessments = get_collection("assessments")
    cursor = db_assessments.find().sort("created_at", -1).limit(5)
    return await cursor.to_list(length=5)
