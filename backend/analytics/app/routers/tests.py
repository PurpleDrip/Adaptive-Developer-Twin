from fastapi import APIRouter, HTTPException, BackgroundTasks
import httpx
import os
from typing import List, Dict, Any
from shared.models.weekly_test import WeeklyTestSubmitDTO, WeeklyTestDocument
from shared.database.mongo import get_collection
from shared.services.audit_logger import AuditLogger
from datetime import datetime

router = APIRouter()
THG_URL = os.getenv("THG_URL", "http://thg-service:8000")

@router.post("/submit", status_code=201)
async def submit_weekly_test(dto: WeeklyTestSubmitDTO, background_tasks: BackgroundTasks):
    """
    Developer submits results from their weekly skill test.
    Triggers THG calibration in the background.
    """
    tests_col = get_collection("weekly_tests")
    
    test_doc = WeeklyTestDocument.create(dto)
    await tests_col.insert_one(test_doc)
    
    # Trigger Calibration
    background_tasks.add_task(calibrate_thg_with_test, dto)
    
    return {"status": "submitted", "user_id": dto.user_id, "week": dto.week_number}

async def calibrate_thg_with_test(test: WeeklyTestSubmitDTO):
    """
    Algorithm: THG Calibrator.
    Compares test scores against current THG predictions.
    If delta is large (>0.2), we update the graph with the test result 
    and significantly increase confidence (calibration signal).
    """
    user_id = test.user_id
    
    async with httpx.AsyncClient() as client:
        audit = AuditLogger(get_collection("audit_log").database)
        
        # 1. Fetch current THG profile
        try:
            profile_resp = await client.get(f"{THG_URL}/api/v1/thg/thg/{user_id}/skills")
            if profile_resp.status_code != 200:
                print(f"Calibration failed: User {user_id} not found in THG.")
                return
            
            current_skills = {s["name"]: s for s in profile_resp.json().get("skills", [])}
        except Exception as e:
            print(f"Calibration failed: THG connection error: {e}")
            return

        # 2. Compare and Update
        calibration_results = {}
        
        for skill_name, test_score in test.test_scores.items():
            current_state = current_skills.get(skill_name, {"strength": 0.5, "confidence": 0.1})
            predicted_strength = current_state["strength"]
            
            delta = abs(test_score - predicted_strength)
            calibration_results[skill_name] = {"delta": round(delta, 4), "test_score": test_score}
            
            # If delta is significant or confidence is very low, force-calibrate
            if delta > 0.15 or current_state["confidence"] < 0.3:
                # Calibration update: Test is "Ground Truth"
                new_strength = (predicted_strength * 0.3) + (test_score * 0.7) # High weight to test
                new_confidence = min(1.0, current_state["confidence"] + 0.3) # Confidence boost
                
                await client.post(f"{THG_URL}/api/v1/thg/thg/update", json={
                    "dev_id": user_id,
                    "skill_name": skill_name,
                    "strength": new_strength,
                    "confidence": new_confidence
                })
                
                await audit.log_thg_update(
                    user_id=user_id,
                    source="weekly_test",
                    skill_name=skill_name,
                    old_strength=predicted_strength,
                    new_strength=new_strength,
                    old_confidence=current_state["confidence"],
                    new_confidence=new_confidence,
                    metadata={"week": test.week_number, "test_score": test_score, "delta": delta}
                )

        # 3. Save calibration summary in test doc
        tests_col = get_collection("weekly_tests")
        await tests_col.update_one(
            {"user_id": user_id, "week_number": test.week_number, "year": test.year},
            {"$set": {"thg_calibration_result": calibration_results}}
        )
