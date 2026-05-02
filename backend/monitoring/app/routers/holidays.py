from fastapi import APIRouter, HTTPException
from shared.models.system_config import HolidayDTO, SystemConfigDTO, SystemConfigResponse
from shared.database.mongo import get_collection
from shared.services.audit_logger import AuditLogger
from datetime import datetime

router = APIRouter()

@router.get("/config", response_model=SystemConfigResponse)
async def get_current_config():
    db_config = get_collection("system_config")
    config = await db_config.find_one({"key": "global_config"})
    if not config:
        return SystemConfigResponse()
    return config

@router.post("/config/update")
async def update_system_config(dto: SystemConfigDTO, updated_by: str = "tech_support"):
    """
    Update global monitoring settings.
    """
    db_config = get_collection("system_config")
    
    # 1. Capture before state for audit
    before = await db_config.find_one({"key": "global_config"})
    
    # 2. Update
    update_data = {k: v for k, v in dto.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    update_data["updated_by"] = updated_by
    
    await db_config.update_one(
        {"key": "global_config"},
        {"$set": update_data}
    )
    
    # 3. Audit
    after = await db_config.find_one({"key": "global_config"})
    audit = AuditLogger(db_config.database)
    await audit.log_system_config_change(updated_by, before or {}, after)
    
    return {"status": "updated", "config": update_data}

@router.post("/declare")
async def declare_holiday(dto: HolidayDTO):
    """
    Declare a holiday (no monitoring on this day).
    """
    db_config = get_collection("system_config")
    await db_config.update_one(
        {"key": "global_config"},
        {"$push": {"holidays": dto.dict()}}
    )
    return {"status": "holiday_declared", "date": dto.date}

@router.delete("/remove/{date}")
async def remove_holiday(date: str):
    db_config = get_collection("system_config")
    await db_config.update_one(
        {"key": "global_config"},
        {"$pull": {"holidays": {"date": date}}}
    )
    return {"status": "holiday_removed", "date": date}
